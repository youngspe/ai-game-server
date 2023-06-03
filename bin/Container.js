"use strict";
const keySymbol = Symbol();
const abstractKeySymbol = Symbol();
const lazySymbol = Symbol();
const provideSymbol = Symbol();
class Lazy {
    _init;
    _value;
    get value() {
        if (this._init) {
            this._value = this._init();
        }
        return this._value;
    }
    constructor(init) {
        this._init = init;
    }
}
class Container {
    _providers = new Map();
    _setProvider(key, entry) {
        this._providers.set(key, entry);
    }
    provide(key, deps, fac) {
        this._setProvider(key, { value: { deps, fac, singleton: false } });
        return this;
    }
    provideSingleton(key, deps, fac) {
        this._setProvider(key, { value: { deps, fac, singleton: true } });
        return this;
    }
    provideInstance(key, instance) {
        this._setProvider(key, { value: { instance } });
        return this;
    }
    apply(...mods) {
        mods.forEach(mod => mod(this));
        return this;
    }
    request(deps, key = '') {
        if (deps instanceof Container.TypeKey) {
            const entry = this._providers.get(deps);
            if (!entry)
                throw new Error(`${key} not provided`);
            if ('instance' in entry.value) {
                return entry.value.instance;
            }
            const d = this.request(entry.value.deps);
            const instance = entry.value.fac(d);
            if (entry.value.singleton) {
                entry.value = { instance };
            }
            return instance;
        }
        if (deps instanceof Container.LazyKey) {
            return new Lazy(() => this.request(deps.key));
        }
        if (deps instanceof Container.ProviderKey) {
            return (() => this.request(deps.key));
        }
        if (deps instanceof Container.AbstractKey) {
            throw new Error();
        }
        const obj = {};
        for (let prop in deps) {
            obj[prop] = this.request(deps[prop], key + `.${prop}`);
        }
        return obj;
    }
}
(function (Container) {
    class AbstractKey {
        [abstractKeySymbol] = [];
    }
    Container.AbstractKey = AbstractKey;
    class LazyKey extends AbstractKey {
        [lazySymbol] = [];
        key;
        constructor(key) {
            super();
            this.key = key;
        }
    }
    Container.LazyKey = LazyKey;
    class ProviderKey extends AbstractKey {
        [provideSymbol] = [];
        key;
        constructor(key) {
            super();
            this.key = key;
        }
    }
    Container.ProviderKey = ProviderKey;
    class TypeKey {
        [keySymbol] = null;
        lazy = new LazyKey(this);
        provider = new ProviderKey(this);
    }
    Container.TypeKey = TypeKey;
    class Factory extends TypeKey {
    }
    Container.Factory = Factory;
})(Container || (Container = {}));
module.exports = Container;
