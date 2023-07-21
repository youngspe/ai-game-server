import { Module, TypeKey } from "checked-inject"
import { PromptManagerModule } from "./PromptManager"

export { PromptManager } from './PromptManager'

export const PromptModule = Module(PromptManagerModule)

export namespace PromptKeys {
    export class Styles extends TypeKey<string[]>() { static readonly keyTag = Symbol() }
    export class Prompts extends TypeKey<string[]>() { static readonly keyTag = Symbol() }
}
