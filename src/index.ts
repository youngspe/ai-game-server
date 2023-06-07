import fs from 'fs'
import Api from './api'
import { WebSocketServer } from 'ws'
import WsUtils from './wsUtils'
import Container from './Container'
import App from './App'
import TokenManager from './TokenManager'
import EventStreamConnection from './api/EventStreamConnection'
import Game from './api/Game'
import GameRegistry from './api/GameRegistry'
import Prompts from './prompts.ts'


const jwtSecret = fs.readFileSync('secrets/jwt')
const wss = new WebSocketServer({ clientTracking: false, noServer: true })
const port = 5000

new Container()
    .provideInstance(TokenManager.SecretKey, jwtSecret)
    .provideInstance(WsUtils.ServerKey, wss)
    .apply(TokenManager.Module)
    .apply(WsUtils.Module)
    .apply(Api.Module)
    .apply(App.Module)
    .apply(Prompts.Module)
    .request(App.Key)
    .listen(port, () => {
        console.log(`Listening on port ${port}`)
    })
