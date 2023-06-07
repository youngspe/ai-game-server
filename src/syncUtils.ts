export class CountdownLock {
    private _count: number
    private _callbacks?: (() => void)[] = []

    constructor(count: number) {
        this._count = count
    }

    decrement() {
        if (this._count == 0) return
        --this._count

        if (this._count == 0) {
            this._callbacks?.forEach(f => f())
            this._callbacks = undefined
        }
    }

    wait(): Promise<void> {
        const cbs = this._callbacks
        if (cbs) {
            return new Promise(res => { cbs.push(res) })
        } else {
            return Promise.resolve()
        }
    }
}
