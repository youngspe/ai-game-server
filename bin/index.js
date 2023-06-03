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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const express_jwt_1 = require("express-jwt");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs = __importStar(require("fs"));
const uuid = __importStar(require("uuid"));
const http = __importStar(require("http"));
const api_1 = require("./api");
const ws_1 = require("ws");
const errorHandler = (err, req, res, next) => {
    res.status(err?.status ?? 500);
    res.json({ error: err?.message ?? err ?? 'Unknown' });
};
const port = 5000;
const jwtSecret = fs.readFileSync('secrets/jwt');
const algorithm = 'HS256';
const jwtSettings = (0, express_jwt_1.expressjwt)({ secret: jwtSecret, algorithms: [algorithm] });
const verifyJwt = (...args) => jwtSettings(...args);
class HttpError extends Error {
    status;
    constructor(status) {
        super(http.STATUS_CODES[status] ?? 'Unknown');
        this.status = status;
    }
}
const handleWs = (f) => (...[req, res, next]) => {
    if (req.headers.upgrade?.toLowerCase() == 'websocket') {
        wss.handleUpgrade(req, res.socket, Buffer.alloc(0), ws => {
            ws.sendAsync = (data) => new Promise((ok, err) => {
                ws.send(data, e => e ? err(e) : ok());
            });
            return f(ws, req);
        });
    }
    else {
        next();
    }
};
const app = (0, express_1.default)()
    .use('/api', (0, express_1.Router)()
    .use(express_1.default.json())
    .use(verifyJwt, api_1.Api)
    .post('/session', async (req, res, next) => {
    jsonwebtoken_1.default.sign({ userId: uuid.v4() }, jwtSecret, { algorithm }, (e, token) => {
        if (e) {
            next(e);
        }
        else {
            res.json({ token });
        }
    });
}))
    .get('/ws', handleWs(async (ws) => {
    await ws.sendAsync('Hello, world!');
    ws.close();
}))
    .use((req, res, next) => { next(new HttpError(404)); })
    .use(errorHandler);
const server = http.createServer(app);
const wss = new ws_1.WebSocketServer({ clientTracking: false, noServer: true });
// server.on('upgrade', (req, socket, head) => {
//     socket.on('error', err => console.error(err))
//     const authorization = req.headers.authorization
//     if (authorization == null) return
//     let [bearer, tokenString] = req.headers.authorization?.split(' ') ?? [undefined, undefined]
//     if (bearer != 'Bearer' || !tokenString) return
//     let token: JwtPayload
//     try { token = jwt.verify(tokenString, jwtSecret, { algorithms: [algorithm] }) as JwtPayload }
//     // if (jwt.verify())
// })
server.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
