import { OpenAIApi, Configuration } from 'openai'
import { Singleton, TypeKey } from 'checked-inject'
import * as CI from 'checked-inject'

export namespace AI {
    export namespace Keys {
        export class Config extends TypeKey<Configuration>() { private _: any }
        export class Api extends TypeKey<OpenAIApi>() { private _: any }
    }
    export const Module = CI.Module(ct => ct
        .provide(Keys.Api, Singleton, { config: Keys.Config }, ({ config }) => new OpenAIApi(config))
    )
}

export default AI
