import * as crypto from 'crypto'
import Container, { Actual, TypeKey } from "../Container"
import Game from './Game'

const SYMBOLS = 'abcdefghjkmnpqrstuvwxyz23456789'
const ID_LENGTH = 6

class GameRegistry {
    private readonly _games = new Map<string, Game>()
    private readonly _gameFac: Actual<typeof Game.Factory>

    constructor(gameFac: Actual<typeof Game.Factory>) {
        this._gameFac = gameFac
    }

    private _nextId(): string {
        const blank = new Array<undefined>(ID_LENGTH)
        while (true) {
            const id = blank.map(() => SYMBOLS[crypto.randomInt(SYMBOLS.length)]).join('')
            if (!this._games.has(id)) {
                return id
            }
        }
    }

    createGame(ownerId: string): Game {
        const id = this._nextId()
        const game = this._gameFac({ id, ownerId })
        this._games.set(id, game)
        return game
    }

    get(gameId: string): Game | undefined {
        return this._games.get(gameId.toLowerCase())
    }
}

namespace GameRegistry {
    export const Key = new TypeKey<GameRegistry>()
    export const Module = (ct: Container) => ct
        .provideSingleton(Key, { gameFac: Game.Factory }, ({ gameFac }) => new GameRegistry(gameFac))
}

export = GameRegistry
