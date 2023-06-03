"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importStar(require("express"));
const Container_1 = require("./Container");
const api_1 = __importDefault(require("./api"));
const wsUtils_1 = __importDefault(require("./wsUtils"));
const TokenManager_1 = __importDefault(require("./TokenManager"));
const uuid = __importStar(require("uuid"));
const HttpError_1 = __importDefault(require("./HttpError"));
var App;
(function (App) {
    App.Key = new Container_1.TypeKey;
    function Module(ct) {
        const errorHandler = (err, req, res, next) => {
            res.status(err?.status ?? 500);
            res.json({ error: err?.message ?? err ?? 'Unknown' });
        };
        ct.provide(App.Key, {
            api: api_1.default.Key,
            wsu: wsUtils_1.default.Key,
            tokenManager: TokenManager_1.default.Key,
        }, ({ api, wsu, tokenManager }) => (0, express_1.default)()
            .use('/api', (0, express_1.Router)()
            .use(express_1.default.json())
            .post('/session', async (req, res, next) => {
            const token = await tokenManager.sign({ userId: uuid.v4() });
            res.json({ token });
        })
            .use(api))
            .get('/ws', wsu.handle(async (ws) => {
            await ws.sendAsync('Hello, world!');
            ws.close();
        }))
            .use((req, res, next) => { next(new HttpError_1.default(404)); })
            .use(errorHandler));
    }
    App.Module = Module;
})(App || (App = {}));
module.exports = App;
