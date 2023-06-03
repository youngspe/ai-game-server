import express, { ErrorRequestHandler, Router } from "express"
import Container, { TypeKey } from "./Container"
import Api from "./api"
import WsUtils from "./wsUtils"
import TokenManager from "./TokenManager"
import * as uuid from 'uuid'
import HttpError from "./HttpError"
import { Express } from "express"

namespace App {
    export const Key = new TypeKey<Express>

    export function Module(ct: Container) {
        const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
            res.status(err?.status ?? 500)
            res.json({ error: err?.message ?? err ?? 'Unknown' })
        }

        ct.provide(Key, {
            api: Api.Key,
            wsu: WsUtils.Key,
            tokenManager: TokenManager.Key,
        }, ({ api, wsu, tokenManager }) => express()
            .use('/api', Router()
                .use(express.json())
                .post('/session', async (req, res, next) => {
                    const token = await tokenManager.sign({ userId: uuid.v4() })
                    res.json({ token })
                })
                .use(api)
            )
            .get('/ws', wsu.handle(async ws => {
                await ws.sendAsync('Hello, world!')
                ws.close()
            }))
            .use((req, res, next) => { next(new HttpError(404)) })
            .use(errorHandler)
        )
    }
}

export = App
