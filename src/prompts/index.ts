import Container from "../Container"
import { PromptManager } from "./PromptManager"

export * from './PromptManager'

export namespace Prompts {
    export const Module = (ct: Container) => ct
        .apply(PromptManager.Module)
}

export default Prompts
