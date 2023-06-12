import { OpenAIApi } from "openai"
import AI from "../AI"
import Container, { TypeKey } from "../Container"
import Prompts from "."
import { randInt } from "../randomUtils"

export class PromptManager {
    readonly ai: OpenAIApi
    readonly styles: string[]
    readonly prompts: string[]

    constructor(ai: OpenAIApi, styles: string[], prompts: string[]) {
        this.ai = ai
        this.styles = styles
        this.prompts = prompts
    }

    async getPrompt(): Promise<string> {
        return this.prompts[randInt(this.prompts.length)]
    }

    async getStyleSuggestions(count: number): Promise<string[]> {
        const used = new Set<string>()
        let out: string[] = []
        for (let i = 0; i < count; ++i) {
            if (used.size > this.styles.length * 0.75) {
                used.clear()
            }
            let style: string
            while (true) {
                style = this.styles[randInt(this.styles.length)]
                if (used.has(style)) {
                    continue
                }
                used.add(style)
                break
            }
            out.push(style)
        }
        return out
    }

    async getOutput(prompt: string, style: string): Promise<string> {
        const input = [
            `Complete the following. Do not include any other text:`,
            ``,
            `Prompt: ${prompt}`,
            `This brief answer (no more than 3 sentences, and including no other text) is a satirical made-up quote from ${style}:`,
            '',
        ].join('\n')
        const result = await this.ai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            max_tokens: 256,
            temperature: 1.2,
            messages: [{ role: "user", content: input }],
        })
        return result.data.choices[0]?.message?.content?.trim() || result.statusText // TODO: handle errors properly
    }
}

export namespace PromptManager {
    export const Key = new TypeKey<PromptManager>()
    export const Module = (ct: Container) => ct
        .provideSingleton(Key, {
            ai: AI.Keys.Api,
            styles: Prompts.StylesKey,
            prompts: Prompts.PromptsKey,
        }, ({ ai, styles, prompts }) => new PromptManager(ai, styles, prompts))
}

export default PromptManager
