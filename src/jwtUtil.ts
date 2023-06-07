import { Request } from 'express'

export type MyToken = { userId: string }

export function getToken(req: Request): MyToken | undefined {
    return (req as any).auth
}
