const keySymbol = Symbol()
const abstractKeySymbol = Symbol()
const lazySymbol = Symbol()
const provideSymbol = Symbol()

class Lazy<T> {
    private _init?: () => T
    private _value?: T
    get value() {
        if (this._init) {
            this._value = this._init()
            this._init = undefined
        }
        return this._value!
    }

    constructor(init: () => T) {
        this._init = init
    }
}

class Container {
    private _providers = new Map<Container.TypeKey<any>, Entry<any, any>>()

    private _setProvider<T, D = {}>(key: Container.TypeKey<T>, entry: Entry<T, D>) {
        this._providers.set(key, entry)
    }

    provide<T, D>(key: Container.TypeKey<T>, deps: Container.Dependencies<D>, fac: (deps: D) => T): this {
        this._setProvider(key, { value: { deps, fac, singleton: false } })
        return this
    }

    provideSingleton<T, D>(key: Container.TypeKey<T>, deps: Container.Dependencies<D>, fac: (deps: D) => T): this {
        this._setProvider(key, { value: { deps, fac, singleton: true } })
        return this
    }

    provideInstance<T>(key: Container.TypeKey<T>, instance: T): this {
        this._setProvider(key, { value: { instance } })
        return this
    }

    apply(...mods: ((ct: this) => void)[]): this {
        mods.forEach(mod => mod(this))
        return this
    }

    request<T>(deps: Container.Dependencies<T>, key: string = ''): T {
        if (deps instanceof Container.TypeKey) {
            const entry = this._providers.get(deps)
            if (!entry) throw new Error(`${key} not provided`)
            if ('instance' in entry.value) {
                return entry.value.instance
            }

            const d = this.request(entry.value.deps)
            const instance = entry.value.fac(d)
            if (entry.value.singleton) {
                entry.value = { instance }
            }
            return instance
        }

        if (deps instanceof Container.LazyKey) {
            return new Lazy(() => this.request(deps.key)) as T
        }

        if (deps instanceof Container.ProviderKey) {
            return (() => this.request(deps.key)) as T
        }

        if (deps instanceof Container.AbstractKey) {
            throw new Error()
        }

        const obj = {} as any

        for (let prop in deps) {
            obj[prop] = this.request((deps as any)[prop], key + `.${prop}`)
        }

        return obj as T
    }
}

type Entry<T, D> = {
    value: {
        deps: Container.Dependencies<D>,
        fac: (deps: D) => T,
        singleton: boolean,
    } | { instance: T }
}

namespace Container {
    export abstract class AbstractKey<T> {
        private readonly [abstractKeySymbol]: T[] = []
    }

    export class LazyKey<out T> extends AbstractKey<{ readonly value: T }> {
        private readonly [lazySymbol]: T[] = []
        readonly key: Dependencies<T>
        constructor(key: Dependencies<T>) {
            super()
            this.key = key
        }
    }

    export class ProviderKey<out T> extends AbstractKey<() => T> {
        private readonly [provideSymbol]: T[] = []
        readonly key: Dependencies<T>
        constructor(key: Dependencies<T>) {
            super()
            this.key = key
        }
    }

    export class TypeKey<out T> {
        private readonly [keySymbol]: T | null = null
        lazy = new LazyKey<T>(this)
        provider = new ProviderKey<T>(this)
    }

    export class FactoryKey<Args extends any[], T> extends TypeKey<(...args: Args) => T> { }

    export type Dependencies<T> =
        | TypeKey<T>
        | AbstractKey<T>
        | { [K in keyof T]: Dependencies<T[K]> }
        | (T extends {} ? {} : never)

    export type Actual<D> = D extends Dependencies<infer T> ? T : never
}

export = Container

