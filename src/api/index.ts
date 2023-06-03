import express, { Router } from "express"
import { getToken } from "../jwtUtil"
import Container, { TypeKey } from "../Container"
import WsUtils from "../wsUtils"
import TokenManager from "../TokenManager"


namespace Api {
    export const Key = new TypeKey<Router>()

    export function Module(ct: Container) {
        ct.provide(Key, {
            wsu: WsUtils.Key,
            tokenManager: TokenManager.Key,
        }, ({ wsu, tokenManager }) => Router()
            .use(express.json(), tokenManager.verifyJwt)
            .put('/games/:code/players', (req, res, next) => {
                next(new Error('not implemented'))
            })
            .get('/games/:code/events', wsu.handle((ws, req) => {
                throw new Error('not implemented')
            }))
            .get('/foo', async (req, res) => {
                res.json(getToken(req))
            }))
    }
}

export = Api
