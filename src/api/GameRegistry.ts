import * as crypto from 'crypto'
import { Game, GameFactory } from './Game'
import { Inject, Module, Singleton, Target } from 'checked-inject'

const SYMBOLS = 'abcdefghjkmnpqrstuvwxyz23456789'
const ID_LENGTH = 6

export abstract class GameRegistry {
    abstract createGame(ownerId: string): Game
    abstract get(gameId: string): Game | undefined
}

export class DefaultGameRegistry extends GameRegistry {
    private readonly _games = new Map<string, Game>()
    private readonly _gameFac: Target<typeof GameFactory>

    constructor(gameFac: Target<typeof GameFactory>) {
        super()
        this._gameFac = gameFac
    }

    private _nextId(): string {
        const blank = new Array<null>(ID_LENGTH).fill(null)
        while (true) {
            const id = blank.map(() => SYMBOLS[crypto.randomInt(SYMBOLS.length)]).join('')
            if (!this._games.has(id)) {
                return id
            }
        }
    }

    createGame(ownerId: string): Game {
        const id = this._nextId()
        const game = this._gameFac({ id, ownerId })
        this._games.set(id, game)
        return game
    }

    get(gameId: string): Game | undefined {
        return this._games.get(gameId.toLowerCase())
    }

    static inject = Inject.construct(this, GameFactory)
}

export const GameRegistryModule = Module(ct => ct
    .provide(GameRegistry, Singleton, Inject.from(DefaultGameRegistry))
)
