import { RequestHandler } from "express"
import WebSocket, { WebSocketServer } from "ws"
import { errorInfo } from "./errorUtils"
import { Inject, Injectable, Module, Singleton, TypeKey } from "checked-inject"


export class WsServerKey extends TypeKey<WebSocket.WebSocketServer>() { static readonly keyTag = Symbol() }

export class WsUtils extends Injectable {
    server: WebSocket.WebSocketServer

    constructor(server: WebSocketServer) {
        super()
        this.server = server
    }

    handle<A extends Parameters<RequestHandler>>(
        f: (ws: WebSocketAsync, req: A[0]) => Promise<void> | undefined,
    ) {
        return (...[req, res, next]: A) => {
            if (req.headers.upgrade?.toLowerCase() == 'websocket') {
                this.server.handleUpgrade(req, res.socket!, Buffer.alloc(0), ws => {
                    (ws as any).sendAsync = (data: string | Buffer) => new Promise<void>((ok, err) => {
                        ws.send(data, e => e ? err(e) : ok())
                    })
                    f(ws as WebSocketAsync, req)?.catch(e => {
                        this.fail(ws, e)
                    })
                })
            } else {
                next()
            }
        }
    }

    fail(ws: WebSocket, error: any) {
        const info = errorInfo(error)
        console.error(info.status, info.message.slice(0, 1024))
        ws.close(undefined, JSON.stringify({ error: info }))
    }

    static scope = Singleton
    static inject = Inject.construct(this, WsServerKey)
}

export const WsModule = Module(ct => ct
    .provide(WsServerKey, () => new WebSocketServer({ clientTracking: false, noServer: true }))
)

export type WebSocketAsync = WebSocket & { sendAsync(data: string | Buffer): Promise<void> }
export default WsUtils
