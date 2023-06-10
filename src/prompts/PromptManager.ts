import Container, { TypeKey } from "../Container"

export class PromptManager {
    async getPrompt(): Promise<string> {
        throw new Error('TODO: generate prompt')
    }

    async getStyleSuggestions(count: number): Promise<string[]> {
        throw new Error('TODO: generate style suggestions')
    }

    async getOutput(prompt: string, style: string): Promise<string> {
        throw new Error('TODO: generate output')
    }
}

export namespace PromptManager {
    export const Key = new TypeKey<PromptManager>()
    export const Module = (ct: Container) => ct
        .provideSingleton(Key, {}, () => new PromptManager)
}

export default PromptManager
