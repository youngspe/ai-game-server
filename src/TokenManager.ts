import { RequestHandler } from "express"
import Container, { TypeKey } from "./Container"
import * as jwt from 'jsonwebtoken'
import { expressjwt } from "express-jwt"

const algorithm: jwt.Algorithm = 'HS256'

interface TokenManager {
    readonly verifyJwt: <A extends Parameters<RequestHandler>>(...args: A) => void
    sign(token: { userId: string }): Promise<string>
}

class _TokenManager implements TokenManager {
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
        this.secret = secret
    }
}

namespace TokenManager {
    export const Key = new TypeKey<TokenManager>()
    export function Module(ct: Container) {
        ct.provideSingleton(Key, { secret: SecretKey }, ({ secret }) => new _TokenManager(secret))
    }

    export const SecretKey = new TypeKey<Buffer>()
}

export = TokenManager
