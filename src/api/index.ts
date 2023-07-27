import express, { Router } from "express"
import { getToken } from "../jwtUtil"
import WsUtils from "../wsUtils"
import { TokenManager } from "../TokenManager"
import { GameRegistry, GameRegistryModule } from "./GameRegistry"
import HttpError from "../HttpError"
import { Game, GameModule } from "./Game"
import { EventStreamConnectionModule, EventStreamConnectionFactory } from "./EventStreamConnection"
import { catching } from "../errorUtils"
import { Module, TypeKey } from "checked-inject"


export class ApiKey extends TypeKey<Router>() { private _: any }

export const ApiModule = Module(
    EventStreamConnectionModule,
    GameModule,
    GameRegistryModule,
    ct => ct.provide(ApiKey, {
        wsu: WsUtils,
        tokenManager: TokenManager,
        gameRegistry: GameRegistry,
        connectionFac: EventStreamConnectionFactory,
    }, ({ wsu, tokenManager, gameRegistry, connectionFac }) => Router()
        .use(express.json(), tokenManager.verifyJwt)
        .post('/games', (req, res) => {
            const { userId } = getToken(req)!
            const game = gameRegistry.createGame(userId)
            res.json({ gameId: game.id })
        })
        .post('/games/:gameId/players', catching(async (req, res, next) => {
            const { userId } = getToken(req)!
            const { gameId } = req.params
            const { displayName } = req.query
            if (!displayName || typeof displayName != 'string') throw new HttpError(400, 'Invalid display name')
            const game = gameRegistry.get(gameId)
            if (!game) throw new HttpError(404)
            await game.addPlayer(userId, displayName)
            res.json({})
        }))
        .get('/games/:gameId/events', wsu.handle(async (ws, req) => {
            const { userId } = getToken(req)!
            const { gameId } = req.params
            const game = gameRegistry.get(gameId)
            if (!game) throw new HttpError(404)
            game.addConnection(connectionFac({ ws, userId }))
        }))
    )
)
