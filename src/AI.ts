import { OpenAIApi, Configuration } from 'openai'
import Container, { TypeKey } from "./Container"

export namespace AI {
    export namespace Keys {
        export const Config = new TypeKey<Configuration>
        export const Api = new TypeKey<OpenAIApi>
    }
    export const Module = (ct: Container) => ct
        .provideSingleton(Keys.Api, { config: Keys.Config }, ({ config }) => new OpenAIApi(config))
}

export default AI
