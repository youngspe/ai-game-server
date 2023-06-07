type NonUndefinedKeys<T> = {
    [K in keyof T]: undefined extends T[K] ? never : K
}[keyof T]

type PickNotUndefined<T> = { [K in NonUndefinedKeys<T>]: T[K] }

export type MakeUndefinedOptional<T> = { [K in keyof (T | PickNotUndefined<T> & Partial<T>)]: T[K] }

type MaybeCanceled<T, R = void> =
    | { complete: true } & MakeUndefinedOptional<{ value: T }>
    | { complete: false } & MakeUndefinedOptional<{ reason: R }>

export function delay<Reason = void>(
    ms: number, cancelWith?: CancelWith<Reason>,
): Promise<MaybeCanceled<void, Reason>> {
    return new Promise(res => {
        const t = setTimeout(res, ms, { complete: true })
        cancelWith?.({
            cancel(reason) {
                clearTimeout(t)
                res({ complete: false, reason })
            }
        })
    })
}

export interface CancelationToken<in Reason = void> {
    cancel(reason: Reason): void
}

export interface CancelWith<out Reason = void> {
    (token: CancelationToken<Reason>): void
}

export function CancelationSource<Reason = void>() {
    let tokens: CancelationToken<Reason>[] | undefined = []
    let reason: Reason | undefined
    function CancelationSource(token: CancelationToken<Reason>) {
        if (tokens == null) {
            token.cancel(reason!)
        } else {
            tokens.push(token)
        }
    }
    CancelationSource.cancel = function cancel(reason: Reason) {
        tokens?.forEach(t => t.cancel(reason))
    }
    return CancelationSource
}

type ParallelOutput<A> = readonly unknown[] & (
    A extends [Promise<infer X> | (() => Promise<infer X>), ...infer Y] ? readonly [X, ...ParallelOutput<Y>]
    : A extends [] ? readonly []
    : never
)

export function parallel<A extends (Promise<unknown> | (() => Promise<unknown>))[]>(...args: A): Promise<ParallelOutput<A>> {
    const promise: Promise<unknown> = Promise.all(args.map(x => 'then' in x ? x : x()))
    return promise as Promise<ParallelOutput<A>>
}
