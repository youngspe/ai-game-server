import Container, { Actual, TypeKey } from "../Container"
import Game from './Game'

class GameRegistry {
    private readonly _games = new Map<string, Game>()
    private readonly _gameFac: Actual<typeof Game.Factory>

    constructor(gameFac: Actual<typeof Game.Factory>) {
        this._gameFac = gameFac
    }

    private _nextId(): string {
        throw new Error('todo!')
    }

    createGame(ownerId: string) {
        const id = this._nextId()
        this._games.set(id, this._gameFac({ id, ownerId: ownerId }))
    }
}

namespace GameRegistry {
    export const Key = new TypeKey<GameRegistry>()
    export const Module = (ct: Container) => ct
        .provide(Key, { gameFac: Game.Factory }, ({ gameFac }) => new GameRegistry(gameFac))
}


export = GameRegistry
