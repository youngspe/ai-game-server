import Container, { FactoryKey } from "../Container"
import HttpError from "../HttpError"
import { PromptManager } from "../prompts.ts"
import { ClientEvent, ServerEvent } from "../Event"
import EventStreamConnection from "./EventStreamConnection"
import { GameState, PlayerState } from "../GameState"
import * as uuid from 'uuid'
import * as crypto from 'crypto'
import { CountdownLock } from "../syncUtils"
import { delay, parallel } from "../asyncUtils"

const VOTE_COUNT = 3
const ROUND_COUNT = 3
const SUGGESTION_COUNT = 3
const SUBMISSION_DURATION = 30_000
const VOTING_DURATION = 30_000
const ROUND_SCORE_DURATION = 30_000

class Game {
    readonly id: string
    readonly gameState: GameState
    readonly playerStates: Partial<Record<string, PlayerState>> = Object.create(null)
    readonly connections: Partial<Record<string, EventStreamConnection>> = Object.create(null)
    private _promptManager: PromptManager
    private _submissionLock?: CountdownLock

    get playerCount() { return Object.getOwnPropertyNames(this.playerStates).length }

    constructor(id: string, ownerId: string, promptManager: PromptManager) {
        this.id = id
        this.gameState = {
            playerList: [],
            started: false,
            ownerId,
            scores: {},
        }
        this._promptManager = promptManager
    }

    private _broadcastToAll(data: ServerEvent[]) {
        const value = JSON.stringify(data)
        const promises: Promise<void>[] = []
        for (let userId in this.connections) {
            const promise = this.connections[userId]?.sendEvent(value)
            promise && promises.push(promise)
        }
        return Promise.all(promises)
    }

    private async _sendToUser(userId: string, data: ServerEvent[]) {
        await this.connections[userId]?.sendEvent(JSON.stringify(data))
    }

    async addPlayer(userId: string, displayName: string) {
        if (userId in this.playerStates) return
        this.playerStates[userId] = { displayName }
        this.gameState.playerList.push({ userId, displayName })
        await this._broadcastToAll([{ event: 'addPlayer', player: { userId, displayName } }])
    }

    async addConnection(connection: EventStreamConnection) {
        const playerState = this.playerStates[connection.userId]
        if (!playerState) throw new HttpError(403)

        this.connections[connection.userId]?.stop()
        this.connections[connection.userId] = connection
        connection.start(this)
        await this._sendToUser(connection.userId, [{
            event: "reloadState",
            gameState: this.gameState,
            playerState,
        }])

    }

    async connectionClosed(connection: EventStreamConnection) {
        if (this.connections[connection.userId] === connection) {
            this.connections[connection.userId] = undefined
        }
    }

    async onMessage(connection: EventStreamConnection, data: string) {
        const events: ClientEvent[] = JSON.parse(data)

        for (let e of events) {
            switch (e.event) {
                case "start": {
                    if (connection.userId == this.gameState.ownerId) {
                        this._startGame()
                    }
                }; break
                case "submit": {
                    await this._submit(connection.userId, e.style)
                }; break
                case "vote": {
                    await this._vote(connection.userId, e.votes)
                }; break
            }
        }
    }

    private async _startGame() {
        if (this.gameState.started) throw new Error('Game already started')
        this.gameState.started = true
        await this._broadcastToAll([{ event: 'beginGame' }])
        await this._startRound()
    }

    private async _startRound() {
        const lastNumber = this.gameState.round?.number ?? -1
        const number = lastNumber + 1

        const playerCount = this.playerCount
        const suggestionPromise = this._promptManager.getStyleSuggestions(playerCount * SUGGESTION_COUNT)
        const prompt = await this._promptManager.getPrompt()

        this.gameState.round = {
            number, prompt,
            submissions: Object.create(null),
            voteCount: VOTE_COUNT,
        }

        const allSuggestions = await suggestionPromise
        const submissionEndTime = new Date().getTime() + SUBMISSION_DURATION
        this.gameState.round.submissionEndTime = submissionEndTime
        this._submissionLock = new CountdownLock(playerCount)

        await parallel(
            delay(SUBMISSION_DURATION),
            this._mapPlayers(async (userId, playerState) => {
                const styleSuggestions = allSuggestions.splice(0, SUGGESTION_COUNT)
                playerState.styleSuggestions = styleSuggestions
                this._sendToUser(userId, [{
                    event: 'beginRound', submissionEndTime, prompt, round: number, styleSuggestions, voteCount: VOTE_COUNT,
                }])
            }))

        this._endSubmissions()
    }

    private async _endSubmissions() {
        await this._broadcastToAll([{ event: 'endSubmissions' }])

        await this._mapPlayers(async (userId, playerState) => {
            if (playerState.submission == null) {
                const suggestions = playerState.styleSuggestions

                const style = (suggestions && suggestions.length > 0) ?
                    suggestions[crypto.randomInt(suggestions.length)]
                    : (await this._promptManager.getStyleSuggestions(1))[0]

                await this._submit(userId, style)
            }
        })

        await this._submissionLock?.wait()
        this._submissionLock = undefined

        this._mapPlayers((_userId, state) => {
            const sub = state.submission!
            this.gameState.round!.submissions[sub.id!] = { style: sub.style, output: sub.output! }
        })

        // begin the judgment phase
        const judgmentEndTime = new Date().getTime() + VOTING_DURATION
        this.gameState.round!.judgmentEndTime = judgmentEndTime

        await parallel(
            delay(VOTING_DURATION),
            this._broadcastToAll([{
                event: 'beginJudgment',
                round: this.gameState.round!.number,
                judgmentEndTime,
                submissions: this.gameState.round!.submissions,
            }]),
        )

        await this._endJudgment()
    }

    private async _endJudgment() {
        // Now add up the votes

        const scores = await this._mapPlayers(async userId => {
            let sum = 0
            await this._mapPlayers((_, playerState) => {
                sum += playerState.votes?.[userId] ?? 0
            })
            const scoreList = this.gameState.scores[userId] ?? []
            scoreList.push(sum)
            this.gameState.scores[userId] = scoreList
            return sum
        })

        const submissionIds = await this._mapPlayers((_, playerState) => playerState.submission?.id)
        this.gameState.round!.submissionIds = submissionIds

        const judgmentEndTime = new Date().getTime() + VOTING_DURATION
        this.gameState.round!.judgmentEndTime = judgmentEndTime

        await parallel(
            delay(ROUND_SCORE_DURATION),
            this._broadcastToAll([{ event: 'endRound', round: this.gameState.round!.number, scores, submissionIds }]),
        )

        await this._endRound()
    }

    private async _endRound() {
        this._mapPlayers((_, playerState) => {
            playerState.styleSuggestions = undefined
            playerState.submission = undefined
            playerState.votes = undefined
        })
        if (this.gameState.round!.number == ROUND_COUNT - 1) {
            await this._endGame()
        } else {
            this._startRound()
        }
    }

    private async _endGame() {
        await this._broadcastToAll([{ event: 'endGame' }])
    }

    private async _submit(userId: string, style: string) {
        const playerState = this.playerStates[userId]
        if (playerState == null) throw new Error('Player not in game')
        if (this.gameState.round == null || this.gameState.round.judgmentEndTime != null) throw new Error('Not accepting submissions')
        if (playerState.submission != null) throw new Error('Already submitted')
        const id = uuid.v4()
        playerState.submission = { id: uuid.v4(), style }

        const output = await this._promptManager.getOutput(this.gameState.round.prompt, style)
        playerState.submission.output = output

        this._submissionLock?.decrement()
        await this._sendToUser(userId, [{ event: "generateSubmission", id, output }])
    }

    private async _vote(userId: string, votes: { [SubmissionId in string]?: number }) {
        const playerState = this.playerStates[userId]
        if (playerState == null) throw new Error('Player not in game')
        if (playerState.votes != null) throw new Error('Already voted')
        let sum = 0
        for (let id in votes) {
            const vote = votes[id] ?? 0
            if (vote < 0) throw new Error('invalid vote')
            if (vote > 0 && playerState.submission?.id == id) throw new Error('invalid vote')
            sum += vote
        }

        if (sum > (this.gameState.round?.voteCount ?? -1)) throw new Error('invalid vote')

        this.playerStates[userId]!.votes = votes
    }

    private async _mapPlayers<T>(
        f: (userId: string, playerState: PlayerState, connection?: EventStreamConnection) => T,
    ): Promise<{ [UserId in string]?: Awaited<T> }> {
        const ids = Object.getOwnPropertyNames(this.playerStates)
        const values = ids.map(userId => f(userId, this.playerStates[userId]!))
        const out: { [UserId in string]?: Awaited<T> } = Object.create(null)
        for (let i = 0; i < ids.length; ++i) {
            out[ids[i]] = await values[i]
        }
        return out
    }
}


namespace Game {
    export const Factory = new FactoryKey<[{ id: string, ownerId: string }], Game>()
    export const Module = (ct: Container) => ct
        .provide(Factory, {
            promptManager: PromptManager.Key,
        }, ({ promptManager }) => ({ id, ownerId }) => new Game(id, ownerId, promptManager))
}

export default Game
