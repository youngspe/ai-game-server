import http from 'http'

export default class HttpError extends Error {
    readonly status: number
    constructor(status: number, message?: string) {
        super(message ?? http.STATUS_CODES[status] ?? 'Unknown')
        this.status = status
    }
}
