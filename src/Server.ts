import express, { ErrorRequestHandler, RequestHandler, Router } from "express"
import { ApiKey } from "./api"
import WsUtils from "./wsUtils"
import { TokenManager } from "./TokenManager"
import * as uuid from 'uuid'
import HttpError from "./HttpError"
import { Express } from "express"
import { errorInfo } from "./errorUtils"
import { Module, TypeKey } from "checked-inject"

export class ServerKey extends TypeKey<Express>() { private _: any }
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    const { status, message } = errorInfo(err)
    console.error(status, message.slice(0, 1024))
    res.status(status)
    res.json({ error: message })
}

const useQueryToken: RequestHandler = (req, _res, next) => {
    const token = req.query.authToken
    if (token) {
        req.headers.authorization ??= `Bearer ${token}`
    }
    next()
}

export const ServerModule = Module(ct => ct
    .provide(ServerKey,
        { api: ApiKey, tokenManager: TokenManager, }, ({ api, tokenManager }) => express()
            .use(useQueryToken)
            .use('/api', Router()
                .use(express.json())
                .post('/session', async (_req, res, _next) => {
                    const token = await tokenManager.sign({ userId: uuid.v4() })
                    res.json({ token })
                })
                .use(api)
            )
            .use(express.static('./ai-game-client/dist'))
            .use(express.static('./ai-game-client/public'))
            .use((_req, _res, next) => { next(new HttpError(404)) })
            .use(errorHandler)
    )
)
