import {describe, it, expect, beforeAll, afterAll, beforeEach} from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import app from '../src/app'
import { User } from '../src/models/User'
import {connectDB} from '../src/lib/mongoose'


beforeAll(async()=>{
    await connectDB()
})

afterAll(async()=>{
    await User.deleteMany({})
    await mongoose.disconnect()
})

beforeEach(async()=>{
    await User.deleteMany({})
})

describe('POST /auth/register', ()=>{
    it('create a user and returns tokens', async()=>{
        const res = await request(app).post('/auth/register').send({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        })
        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('accessToken')
        expect(res.body).toHaveProperty('refreshToken')
        expect(res.body.user).toMatchObject({username: 'testuser', email:'test@example.com'})
    })
    it('returns 400 when fields are missing', async()=>{
        const res = await request(app).post('/auth/register').send({email: 'test@example.com'})
        expect(res.status).toBe(400)
    })

    it('returns 409 when email is already taken', async ()=>{
        await request(app).post('/auth/register').send({
            username: 'testUser',
            email: 'test@example.com',
            password: 'password123'
        })
        const res = await request(app).post('/auth/register').send({
            username: 'testuser2',
            email: 'test@example.com',
            password: 'password123'
        })
        expect(res.status).toBe(409)
    })
})

describe("POST /auth/login", ()=>{
    beforeEach(async()=>{
        await request(app).post('/auth/register').send({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        })
    })

    it('returns tokens on valid credentials', async()=>{
        const res = await request(app).post('/auth/login').send({
            email: 'test@example.com',
            password: 'password123'
        })
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('accessToken')
        expect(res.body).toHaveProperty('refreshToken')
    })
    it('returns 401 on wrong password', async ()=>{
        const res = await request(app).post('/auth/login').send({
            email: 'test@example.com',
            password: 'wrongpassword'
        })
        expect(res.status).toBe(401)
    })
    it('returns 401 on unknow email', async ()=>{
        const res = await request(app).post('/auth/login').send({
            email: 'nobody@example.com',
            password: 'password123'
        })
        expect(res.status).toBe(401)
    })
})

describe('POST /auth/refresh', ()=>{
    it('returns a new access token', async()=>{
        const reg = await request(app).post('/auth/register').send({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        })
        const res = await request(app).post('/auth/refresh').send({
            refreshToken: reg.body.refreshToken
        })
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('accessToken')
    })

    it('returns 401 on invalid token', async ()=>{
        const res = await request(app).post('/auth/refresh').send({ refreshToken: 'not.a.real.token' })
        expect(res.status).toBe(401)
    })
})

describe('POST /auth/logout', ()=>{
    it('invalidates the refresh token', async ()=>{
        const reg = await request(app).post('/auth/register').send({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        })
        const {refreshToken} = reg.body

        const logout = await request(app).post('/auth/logout').send({ refreshToken })
        expect(logout.status).toBe(200)

        const refresh = await request(app).post('/auth/refresh').send({ refreshToken })
        expect(refresh.status).toBe(401)
    })
})