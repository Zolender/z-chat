import express from 'express'
import cors from 'cors'

const app = express()

app.use(cors({
    origin: process.env.CLIENT_ORIGIN
}))
app.use(express.json())

app.get("/health", (_req, res)=>{
    res.json({status: 'ok'})
})

export default app