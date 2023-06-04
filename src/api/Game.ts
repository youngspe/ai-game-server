import Container, { FactoryKey } from "../Container"
import EventStreamConnection from "./EventStreamConnection"

interface GameState {
    playerList: { userId: string, displayName: string }[]
}

class Game {
    readonly id: string
    readonly gameState: GameState = {
        playerList: []
    }

    readonly players: Record<string, { displayName: string }> = Object.create(null)
    readonly connections: Record<string, EventStreamConnection> = Object.create(null)

    constructor(id: string) {
        this.id = id
    }

    _broadcastAll(data: { event: string } & Record<string, any>) {
        const value = JSON.stringify(data)
        const promises = []
        for (let userId in this.connections) {
            promises.push(this.connections[userId].sendEvent(value))
        }
        return Promise.all(promises)
    }

    currentStateString() {
        // TODO: cache??
        return JSON.stringify({ event: 'reloadState', gameState: this.gameState })
    }

    async addPlayer(userId: string, displayName: string) {
        if (userId in this.players) return
        this.players[userId] = { displayName }
        this.gameState.playerList.push({ userId, displayName })
        await this._broadcastAll({ event: 'addPlayer', player: { userId, displayName } })
    }
}

namespace Game {
    export const Factory = new FactoryKey<[{ id: string, ownerId: string }], Game>()
    export const Module = (ct: Container) => ct
        .provide(Factory, {}, () => ({ id }) => new Game(id))
}

export = Game
