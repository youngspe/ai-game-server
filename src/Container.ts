const keySymbol = Symbol()
const abstractKeySymbol = Symbol()
const lazySymbol = Symbol()
const provideSymbol = Symbol()

class Container {
    private _providers = Map<Container.TypeKey<any>, Entry<any, any>>

    private _setProvider<T, D = undefined>(entry)
}

type Entry<T, D> = {
    deps: Container.Dependencies<D>
    fac: (deps: D) => T
} | { instance: T }

namespace Container {
    export abstract class AbstractKey<T> {
        private readonly [abstractKeySymbol]: T[] = []
    }

    export class LazyKey<out T> extends AbstractKey<{ readonly value: T }> {
        private readonly [lazySymbol]: T[] = []
        readonly key: TypeKey<T>
        constructor(key: TypeKey<T>) {
            super()
            this.key = key
        }
    }

    export class ProviderKey<out T> extends AbstractKey<() => T> {
        private readonly [provideSymbol]: T[] = []
        readonly key: TypeKey<T>
        constructor(key: TypeKey<T>) {
            super()
            this.key = key
        }
    }

    export class TypeKey<out T> {
        private readonly [keySymbol]: T | null = null
        lazy = new LazyKey<T>(this)
        provider = new ProviderKey<T>(this)
    }

    export class Factory<Args extends any[], T> extends TypeKey<(...args: Args) => T> { }

    export type Dependencies<T> =
        | TypeKey<T>
        | AbstractKey<T>
        | (object & { [K in keyof T]: Dependencies<T[K]> })
        | (T extends (null | undefined) ? T : never)
}

export = Container

