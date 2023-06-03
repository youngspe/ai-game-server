"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
class HttpError extends Error {
    status;
    constructor(status) {
        super(http_1.default.STATUS_CODES[status] ?? 'Unknown');
        this.status = status;
    }
}
exports.default = HttpError;
