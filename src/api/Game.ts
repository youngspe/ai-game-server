import Container, { FactoryKey } from "../Container"

class Game {
    readonly id: string
    currentState = {}

    currentStateString() {
        return JSON.stringify(this.currentState)
    }

    constructor(id: string) {
        this.id = id
    }
}

namespace Game {
    export const Factory = new FactoryKey<[{ id: string, ownerId: string }], Game>()
    export const Module = (ct: Container) => ct
        .provide(Factory, {}, () => ({ id }) => new Game(id))
}

export = Game
