# z-chat

A real-time chat application built as a WebSocket learning exercise. Users can register, log in, browse chat rooms, and send messages to other users in real time.

## Tech Stack

**Backend**
- Node.js + Express
- Socket.IO
- Prisma ORM
- Supabase (PostgreSQL)
- Custom JWT authentication

**Frontend**
- React + Vite
- TypeScript
- Tailwind CSS
- Lucide Icons
- socket.io-client

## Project Structure

```
z-chat/
├── backend/    # Express + Socket.IO server
├── frontend/   # React + Vite client
└── plan.md     # Design spec and implementation plan
```

## Getting Started

> Setup instructions will be added once the project is scaffolded.

## Features

- User registration and login (JWT auth)
- Browse and join chat rooms
- Create new chat rooms
- Real-time messaging via Socket.IO
- Message history persisted in Supabase
