import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth'

const app = express()

app.use(cors({
    origin: process.env.CLIENT_ORIGIN
}))
app.use(express.json())

app.get("/health", (_req, res)=>{
    res.json({status: 'ok'})
})

app.use('/auth', authRouter)

export default app