import Container, { TypeKey } from "../Container"

export class PromptManager {
    async getPrompt(): Promise<string> {
        return 'Foo bar baz'
        // TODO: generate prompt
        // throw new Error('TODO: generate prompt')
    }

    async getStyleSuggestions(count: number): Promise<string[]> {
        return new Array(count).fill('foo')
        // TODO: generate style suggestions
        // throw new Error('TODO: generate style suggestions')
    }

    async getOutput(prompt: string, style: string): Promise<string> {
        return 'Qwer asdf zxcv'
        // TODO: generate output
        // throw new Error('TODO: generate output')
    }
}

export namespace PromptManager {
    export const Key = new TypeKey<PromptManager>()
    export const Module = (ct: Container) => ct
        .provideSingleton(Key, {}, () => new PromptManager)
}

export default PromptManager
