import { Request } from 'express'
import { JwtPayload } from "jsonwebtoken"

export type JsonPrimitive =
    | string
    | number
    | boolean
    | null

export interface JsonArray extends Array<JsonValue> { }
export interface JsonObject extends Record<string, JsonValue> { }

export type JsonValue =
    | JsonArray
    | JsonObject
    | JsonPrimitive

export type MyToken = JwtPayload & JsonObject & { userId?: string }

export function getToken(req: Request): MyToken | undefined {
    return (req as any).auth
}
