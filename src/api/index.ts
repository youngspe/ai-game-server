import express, { Router } from "express"
import { getToken } from "../jwtUtil"

function Api() {
    return Router()
        .use(express.json())
        .put('/game/:code/players', (req, res, next) => {
            next(new Error('not implemented'))
        })
        .get('/foo', async (req, res) => {
            res.json(getToken(req))
        })
}

export = Api
