import { RequestHandler } from "express"
import * as jwt from 'jsonwebtoken'
import { expressjwt } from "express-jwt"
import { Module, Singleton, TypeKey } from 'checked-inject'

const algorithm: jwt.Algorithm = 'HS256'

export abstract class TokenManager {
    abstract readonly verifyJwt: <A extends Parameters<RequestHandler>>(...args: A) => void
    abstract sign(token: { userId: string }): Promise<string>
}

class _TokenManager extends TokenManager {
    readonly secret: Buffer
    readonly verifyJwt = <A extends Parameters<RequestHandler>>(...args: A) =>
        expressjwt({ secret: this.secret, algorithms: [algorithm] })(...args as Parameters<RequestHandler>)

    sign({ userId }: { userId: string }) {
        return new Promise<string>((ok, err) => {
            jwt.sign({ userId }, this.secret, { algorithm }, (e, token) => {
                if (e) { err(e) }
                else { ok(token!) }
            })
        })
    }

    constructor(secret: Buffer) {
        super()
        this.secret = secret
    }
}

export const TokenModule = Module(ct => ct
    .provide(TokenManager, Singleton, { secret: JwtSecretKey }, ({ secret }) => new _TokenManager(secret))
)

export class JwtSecretKey extends TypeKey<Buffer>() { static readonly keyTag = Symbol() }
