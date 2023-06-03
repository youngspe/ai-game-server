import { RequestHandler } from "express"
import WebSocket, { WebSocketServer } from "ws"

type WebSocketAsync = WebSocket & { sendAsync(data: string | Buffer): Promise<void> }

export class WsUtils {
    server: WebSocket.WebSocketServer

    constructor(server: WebSocketServer) {
        this.server = server
    }

    handle<A extends Parameters<RequestHandler>>(
        f: (ws: WebSocketAsync, req: A[0]) => void | Promise<void>,
    ) {
        return (...[req, res, next]: A) => {
            if (req.headers.upgrade?.toLowerCase() == 'websocket') {
                this.server.handleUpgrade(req, res.socket!, Buffer.alloc(0), ws => {
                    (ws as any).sendAsync = (data: string | Buffer) => new Promise<void>((ok, err) => {
                        ws.send(data, e => e ? err(e) : ok())
                    })
                    return f(ws as WebSocketAsync, req)
                })
            } else {
                next()
            }
        }
    }
}
