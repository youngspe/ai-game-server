import { RequestHandler } from "express"
import WebSocket, { WebSocketServer } from "ws"
import Container, { TypeKey } from "./Container"
import http from 'http'
import { errorInfo } from "./errorUtils"

class WsUtils {
    server: WebSocket.WebSocketServer

    constructor(server: WebSocketServer) {
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
        const { status, message } = errorInfo(error)
        ws.close(status, JSON.stringify({ error: message }))
    }
}

namespace WsUtils {
    export function Module(ct: Container) {
        ct.provideSingleton(Key, { wss: ServerKey }, ({ wss }) => new WsUtils(wss))
    }

    export const Key = new TypeKey<WsUtils>
    export const ServerKey = new TypeKey<WebSocket.WebSocketServer>
}

export type WebSocketAsync = WebSocket & { sendAsync(data: string | Buffer): Promise<void> }
export default WsUtils
