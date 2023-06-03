"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const Container_1 = require("./Container");
const http_1 = __importDefault(require("http"));
class WsUtils {
    server;
    constructor(server) {
        this.server = server;
    }
    handle(f) {
        return (...[req, res, next]) => {
            if (req.headers.upgrade?.toLowerCase() == 'websocket') {
                this.server.handleUpgrade(req, res.socket, Buffer.alloc(0), ws => {
                    ws.sendAsync = (data) => new Promise((ok, err) => {
                        ws.send(data, e => e ? err(e) : ok());
                    });
                    f(ws, req)?.catch(e => {
                        const code = (typeof e?.status == 'number') ? e.status : 500;
                        ws.close(code, JSON.stringify({ error: e?.message ?? http_1.default.STATUS_CODES[code] ?? 'Unknown' }));
                    });
                });
            }
            else {
                next();
            }
        };
    }
}
(function (WsUtils) {
    function Module(ct) {
        ct.provideSingleton(WsUtils.Key, { wss: WsUtils.ServerKey }, ({ wss }) => new WsUtils(wss));
    }
    WsUtils.Module = Module;
    WsUtils.Key = new Container_1.TypeKey;
    WsUtils.ServerKey = new Container_1.TypeKey;
})(WsUtils || (WsUtils = {}));
module.exports = WsUtils;
