import { RequestHandler } from 'express'
import { STATUS_CODES } from 'http'


export function errorInfo(error: any): { status: number, message: string } {
    let status = (typeof error?.status == 'number') ? error.status : null

    let message = errorMessage(error)
    if (message == null && status != null) {
        message = STATUS_CODES[status] ?? null
    }
    message = message ?? 'Unknown'

    return { status: status ?? 500, message }
}

export function errorMessage(error: unknown): string | null {
    try {
        if (error == null) return error ?? null
        if (typeof error != 'object') return error.toString()
        if ('message' in error && error.message != null) return error.message.toString()

        let proto = error

        while (proto != null && proto != Object.prototype) {
            if (Object.hasOwn(proto, 'toString')) return error.toString()
            proto = Object.getPrototypeOf(proto)
        }
    } catch (_ex) {
        // do nothing
    }

    return null
}

export function catching<F extends RequestHandler>(f: F, shouldCatch?: (ex: any) => boolean): F {
    return async function (req, res, next) {
        try {
            return await f(req, res, next)
        } catch (ex) {
            if (shouldCatch) {
                if (shouldCatch(ex)) {
                    next(ex)
                } else {
                    throw ex
                }
            } else {
                next(ex)
            }
        }
    } as RequestHandler as F
}
