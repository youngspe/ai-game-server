import Container, { FactoryKey } from "../Container"
import { WebSocketAsync } from "../wsUtils"
import Game from "./Game"

class EventStreamConnection {
    private readonly _ws: WebSocketAsync
    readonly userId: string

    constructor(ws: WebSocketAsync, userId: string) {
        this._ws = ws
        this.userId = userId
    }

    start(game: Game) {
        this._ws.on('message', (data, bin) => {
            // TODO: do I need to check if data is Buffer[] or ArrayBuffer and handle differently?
            game.onMessage(this, data.toString())
        })
        this._ws.on('close', () => {
            game.connectionClosed(this)
        })
    }

    async sendEvent(event: string) {
        await this._ws.sendAsync(event)
    }

    async stop() {
        this._ws.close()
    }
}

namespace EventStreamConnection {
    export const Factory = new FactoryKey<[{
        ws: WebSocketAsync,
        userId: string,
    }], EventStreamConnection>()

    export const Module = (ct: Container) => ct
        .provide(Factory, {}, () => ({ ws, userId }) => new EventStreamConnection(ws, userId))
}

export = EventStreamConnection
