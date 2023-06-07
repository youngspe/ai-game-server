import express, { Router } from "express"
import { getToken } from "../jwtUtil"
import Container, { TypeKey } from "../Container"
import WsUtils from "../wsUtils"
import TokenManager from "../TokenManager"
import GameRegistry from "./GameRegistry"
import HttpError from "../HttpError"
import Game from "./Game"
import EventStreamConnection from "./EventStreamConnection"


namespace Api {
    export const Key = new TypeKey<Router>()

    export const Module = (ct: Container) => ct
        .provide(Key, {
            wsu: WsUtils.Key,
            tokenManager: TokenManager.Key,
            gameRegistry: GameRegistry.Key,
        }, ({ wsu, tokenManager, gameRegistry }) => Router()
            .use(express.json(), tokenManager.verifyJwt)
            .post('/games', (req, res) => {
                const { userId } = getToken(req)!
                const game = gameRegistry.createGame(userId)
                res.json({ gameId: game.id })
            })
            .post('/games/:gameId/players', async (req, res, next) => {
                const { userId } = getToken(req)!
                const { gameId } = req.params
                const { displayName } = req.query
                if (!displayName || typeof displayName != 'string') throw new HttpError(400, 'Invalid display name')
                const game = gameRegistry.get(gameId)
                if (!game) throw new HttpError(404)
                await game.addPlayer(userId, displayName)
                res.json({})
            })
            .get('/games/:gameId/events', wsu.handle(async (ws, req) => {
                throw new Error('not implemented')
            })))
            .apply(EventStreamConnection.Module)
            .apply(Game.Module)
            .apply(GameRegistry.Module)
}

export = Api
