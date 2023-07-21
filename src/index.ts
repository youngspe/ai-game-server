import fs from 'fs/promises'
import { ApiModule } from './api'
import * as OpenAI from 'openai'
import { WsModule } from './wsUtils'
import { ServerKey, ServerModule } from './Server'
import { JwtSecretKey, TokenManager, TokenModule } from './TokenManager'
import { PromptKeys, PromptModule } from './prompts'
import AI from './AI'
import { Inject, Module } from 'checked-inject'

const jwtSecret = () => fs.readFile('secrets/jwt')

const styles = async () => (await fs.readFile('data/styles.txt', { encoding: 'utf8' }))
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0)

const prompts = async () => (await fs.readFile('data/prompts.txt', { encoding: 'utf8' }))
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0)

const openAIConfig = async () => {
    const apiKey = (await fs.readFile('secrets/openAIKey', { encoding: 'utf8' })).trim()
    return new OpenAI.Configuration({
        apiKey,
    })
}

const port = 5000

const AppModule = Module(
    TokenModule,
    WsModule,
    ApiModule,
    ServerModule,
    PromptModule,
    AI.Module,
    ct => ct
        .provideAsync(JwtSecretKey, jwtSecret)
        .provideAsync(AI.Keys.Config, openAIConfig)
        .provideAsync(PromptKeys.Styles, styles)
        .provideAsync(PromptKeys.Prompts, prompts)
)

AppModule.injectAsync(ServerKey, app => app.listen(port, () => {
    console.log(`Listening on port ${port}`)
}))
