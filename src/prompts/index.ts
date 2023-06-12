import Container, { TypeKey } from "../Container"
import { PromptManager } from "./PromptManager"

export * from './PromptManager'

export namespace Prompts {
    export const Module = (ct: Container) => ct
        .apply(PromptManager.Module)

    export const StylesKey = new TypeKey<string[]>()
    export const PromptsKey = new TypeKey<string[]>()
}

export default Prompts
