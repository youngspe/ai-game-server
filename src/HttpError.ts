import http from 'http'

export default class HttpError extends Error {
    readonly status: number
    constructor(status: number) {
        super(http.STATUS_CODES[status] ?? 'Unknown')
        this.status = status
    }
}
