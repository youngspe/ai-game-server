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
const Container_1 = require("./Container");
const jwt = __importStar(require("jsonwebtoken"));
const express_jwt_1 = require("express-jwt");
const algorithm = 'HS256';
class _TokenManager {
    secret;
    verifyJwt = (...args) => (0, express_jwt_1.expressjwt)({ secret: this.secret, algorithms: [algorithm] })(...args);
    sign({ userId }) {
        return new Promise((ok, err) => {
            jwt.sign({ userId }, this.secret, { algorithm }, (e, token) => {
                if (e) {
                    err(e);
                }
                else {
                    ok(token);
                }
            });
        });
    }
    constructor(secret) {
        this.secret = secret;
    }
}
var TokenManager;
(function (TokenManager) {
    TokenManager.Key = new Container_1.TypeKey();
    function Module(ct) {
        ct.provideSingleton(TokenManager.Key, { secret: TokenManager.SecretKey }, ({ secret }) => new _TokenManager(secret));
    }
    TokenManager.Module = Module;
    TokenManager.SecretKey = new Container_1.TypeKey();
})(TokenManager || (TokenManager = {}));
module.exports = TokenManager;
