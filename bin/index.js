"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const api_1 = __importDefault(require("./api"));
const ws_1 = require("ws");
const wsUtils_1 = __importDefault(require("./wsUtils"));
const Container_1 = __importDefault(require("./Container"));
const App_1 = __importDefault(require("./App"));
const TokenManager_1 = __importDefault(require("./TokenManager"));
const jwtSecret = fs_1.default.readFileSync('secrets/jwt');
const wss = new ws_1.WebSocketServer({ clientTracking: false, noServer: true });
const port = 5000;
new Container_1.default()
    .provideInstance(TokenManager_1.default.SecretKey, jwtSecret)
    .provideInstance(wsUtils_1.default.ServerKey, wss)
    .apply(TokenManager_1.default.Module)
    .apply(wsUtils_1.default.Module)
    .apply(api_1.default.Module)
    .apply(App_1.default.Module)
    .request(App_1.default.Key)
    .listen(port, () => {
    console.log(`Listening on port ${port}`);
});
