import express, { ErrorRequestHandler, Handler, Router } from 'express'
import { Request, RequestHandler, Response } from 'express'
import { expressjwt } from 'express-jwt'
import jwt, { Jwt, JwtPayload } from 'jsonwebtoken'
import * as fs from 'fs'
import * as uuid from 'uuid'
import * as http from 'http'
import { getToken } from './jwtUtil'
import Api from './api'
import { WebSocket, WebSocketServer } from 'ws'
import { WsUtils } from './wsUtils'

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    res.status(err?.status ?? 500)
    res.json({ error: err?.message ?? err ?? 'Unknown' })
}

const port = 5000

const jwtSecret = fs.readFileSync('secrets/jwt')
const algorithm: jwt.Algorithm = 'HS256'

const jwtSettings = expressjwt({ secret: jwtSecret, algorithms: [algorithm] })
const verifyJwt = <A extends Parameters<typeof jwtSettings>>(...args: A) => jwtSettings(...args as [any, any, any])

class HttpError extends Error {
    readonly status: number
    constructor(status: number) {
        super(http.STATUS_CODES[status] ?? 'Unknown')
        this.status = status
    }
}

const wss = new WebSocketServer({ clientTracking: false, noServer: true })
const wsu = new WsUtils(wss)

const app = express()
    .use('/api', Router()
        .use(express.json())
        .use(verifyJwt, Api())
        .post('/session', async (req, res, next) => {
            jwt.sign({ userId: uuid.v4() }, jwtSecret, { algorithm }, (e, token) => {
                if (e) { next(e) }
                else { res.json({ token }) }
            })
        }))
    .get('/ws', wsu.handle(async ws => {
        await ws.sendAsync('Hello, world!')
        ws.close()
    }))
    .use((req, res, next) => { next(new HttpError(404)) })
    .use(errorHandler)

const server = http.createServer(app)


// server.on('upgrade', (req, socket, head) => {
//     socket.on('error', err => console.error(err))
//     const authorization = req.headers.authorization
//     if (authorization == null) return
//     let [bearer, tokenString] = req.headers.authorization?.split(' ') ?? [undefined, undefined]
//     if (bearer != 'Bearer' || !tokenString) return
//     let token: JwtPayload
//     try { token = jwt.verify(tokenString, jwtSecret, { algorithms: [algorithm] }) as JwtPayload }

//     // if (jwt.verify())
// })

server.listen(port, () => {
    console.log(`Listening on port ${port}`)
})

