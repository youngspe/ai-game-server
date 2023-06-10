import fs from 'fs'
import Api from './api'
import { WebSocketServer } from 'ws'
import * as OpenAI from 'openai'
import WsUtils from './wsUtils'
import Container from './Container'
import App from './App'
import TokenManager from './TokenManager'
import Prompts from './prompts'
import AI from './AI'


const jwtSecret = fs.readFileSync('secrets/jwt')
const openAiKey = fs.readFileSync('secrets/openAIKey', { encoding: 'utf8' })
const wss = new WebSocketServer({ clientTracking: false, noServer: true })
const port = 5000

new Container()
    .provideInstance(TokenManager.SecretKey, jwtSecret)
    .provideInstance(WsUtils.ServerKey, wss)
    .provideInstance(AI.Keys.Config, new OpenAI.Configuration({
        apiKey: openAiKey,
    }))
    .apply(TokenManager.Module)
    .apply(WsUtils.Module)
    .apply(Api.Module)
    .apply(App.Module)
    .apply(Prompts.Module)
    .apply(AI.Module)
    .request(App.Key)
    .listen(port, () => {
        console.log(`Listening on port ${port}`)
    })
