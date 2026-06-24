import 'dotenv/config'
import http from 'http'
import app from './app'
import {connectDB} from './lib/mongoose'

const PORT = process.env.PORT ?? 3000

async function main(){
    await connectDB()
    const server = http.createServer(app)
    server.listen(PORT, ()=>{
        console.log(`Server running on port ${PORT}`)
    })
}

main().catch(err=>{
    console.error('Failed to start server: ', err)
    process.exit(1)
})