# z-chat — Design Spec

**Date:** 2026-06-09
**Status:** Approved

---

## 1. Overview

A real-time chat application built as a WebSocket learning exercise. Users register, log in, browse chat rooms, send real-time messages, and direct-message other users. The project is built with Node.js + Express + Socket.IO on the backend and React + Vite + TypeScript on the frontend.

---

## 2. Tech Stack

**Backend**
- Node.js + Express
- Socket.IO
- Prisma ORM → Supabase (PostgreSQL)
- Custom JWT authentication (access + refresh tokens)
- bcrypt for password hashing

**Frontend**
- React + Vite + TypeScript
- Tailwind CSS + Lucide Icons
- Framer Motion (animations)
- socket.io-client

---

## 3. Architecture

**Approach A — REST for data, Socket.IO for real-time only.**

HTTP handles all stateless operations: auth, fetching rooms. Socket.IO handles all real-time operations: messaging, presence, DMs. A JWT is issued via HTTP and passed as the socket handshake credential so the server can authenticate the connection before any event handler runs.

---

## 4. Project Structure

npm workspaces monorepo.

```
z-chat/
├── backend/
│   ├── src/
│   │   ├── index.ts                  # Server entry — boots Express + Socket.IO
│   │   ├── routes/
│   │   │   └── auth.ts               # POST /auth/register, /login, /refresh, /logout
│   │   ├── middleware/
│   │   │   └── auth.ts               # JWT verification for HTTP routes
│   │   ├── socket/
│   │   │   ├── index.ts              # Socket.IO init + JWT handshake middleware
│   │   │   └── handlers/
│   │   │       ├── rooms.ts          # join-room, leave-room, create-room, open-dm
│   │   │       └── messages.ts       # send-message
│   │   └── lib/
│   │       └── prisma.ts             # Prisma client singleton
│   └── prisma/
│       └── schema.prisma
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── Chat.tsx
│   │   ├── components/
│   │   │   ├── RoomList.tsx
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── MessageBubble.tsx
│   │   ├── hooks/
│   │   │   ├── useSocket.ts
│   │   │   └── useAuth.ts
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   └── lib/
│   │       ├── api.ts                # axios instance
│   │       └── socket.ts            # socket.io-client singleton
├── README.md
├── plan.md
└── package.json                      # workspaces root
```

---

## 5. Data Model (Prisma)

### User
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| username | String | unique |
| email | String | unique |
| passwordHash | String | bcrypt |
| refreshToken | String? | nullable — set on login, cleared on logout |
| createdAt | DateTime | |

### Room
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | String | |
| description | String? | nullable |
| type | Enum | `PREDEFINED \| USER_CREATED \| DIRECT` |
| createdById | uuid? | nullable FK → User (null for predefined rooms) |
| createdAt | DateTime | |

### Message
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| content | String | |
| createdAt | DateTime | |
| userId | uuid | FK → User |
| roomId | uuid | FK → Room |

### RoomMember
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| userId | uuid | FK → User |
| roomId | uuid | FK → Room |
| joinedAt | DateTime | |

Unique constraint on `(userId, roomId)`.

> **Predefined rooms** are created via a Prisma seed script (`prisma/seed.ts`) that runs once on first deploy. They have `type: PREDEFINED` and `createdById: null`.

---

## 6. Auth Flow

### HTTP Endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /auth/register | No | `{ username, email, password }` → hash → create User → return token pair |
| POST | /auth/login | No | Validate credentials → return token pair |
| POST | /auth/refresh | No | Verify refresh token → return new access token |
| POST | /auth/logout | Yes | Clear `User.refreshToken` in DB |

### JWT Tokens
- **Access token** — short-lived (15 min), payload: `{ userId, username, email }`, used for HTTP route auth and the socket handshake
- **Refresh token** — long-lived (7 days), payload: `{ userId }`, stored in `User.refreshToken` so it can be invalidated on logout

### HTTP Route Protection
`authMiddleware` reads `Authorization: Bearer <token>`, verifies the access token with the JWT secret, attaches `req.user` for downstream handlers.

### Socket.IO Handshake
```ts
// Client
const socket = io(SERVER_URL, { auth: { token: accessToken } })

// Server middleware (runs before any event handler)
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  // verify → attach socket.data.user → call next()
  // or next(new Error('Unauthorized'))
})
```
Connection is rejected before it opens if the token is missing or invalid.

---

## 7. Socket Events

### Client → Server
| Event | Payload | What happens |
|---|---|---|
| `join-room` | `{ roomId }` | `socket.join(roomId)` + upsert `RoomMember` + emit `room-joined` with last 50 messages (ordered `createdAt` ASC) |
| `leave-room` | `{ roomId }` | `socket.leave(roomId)` + delete `RoomMember` |
| `send-message` | `{ roomId, content }` | Verify membership → save `Message` → broadcast `new-message` to room |
| `create-room` | `{ name, description }` | Create `Room` (type: USER_CREATED) → broadcast `room-created` to all |
| `open-dm` | `{ targetUserId }` | Find or create DIRECT room for the pair → initiating socket joins immediately → if target has an active socket it joins too; if offline they join on next connection via rooms list → emit `dm-opened` to initiating socket |

### Server → Client
| Event | Payload | Recipients |
|---|---|---|
| `room-joined` | `{ room, messages[] }` | Joining socket only |
| `new-message` | `{ message }` | All sockets in that room |
| `room-created` | `{ room }` | All connected clients |
| `user-joined` | `{ user, roomId }` | All sockets in that room |
| `user-left` | `{ user, roomId }` | All sockets in that room |
| `dm-opened` | `{ room }` | Initiating socket only |
| `error` | `{ message }` | Originating socket only |

---

## 8. REST Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /auth/register | No | Register |
| POST | /auth/login | No | Login |
| POST | /auth/refresh | No | Refresh access token |
| POST | /auth/logout | Yes | Logout |
| GET | /rooms | Yes | All rooms with `isMember` flag per room |

Message history is delivered via the `room-joined` socket event, not a REST endpoint.

---

## 9. Membership Rules

- All authenticated users can see all rooms via `GET /rooms`
- To send or receive messages in a room, a `RoomMember` record must exist for that user
- Non-members see a **Join** button on the room — not the chat window
- `send-message` handler verifies membership before saving; rejects with `error` if not a member
- `open-dm` auto-creates `RoomMember` records for both participants — no explicit join required for DMs

---

## 10. UI Layout

### Desktop / Tablet (≥768px) — Discord-style 3-panel
- **Left sidebar** — Rooms section (PREDEFINED + USER_CREATED) and Direct Messages section below it
- **Center panel** — Active chat window: room name header, scrollable message history, message input at bottom
- **Right sidebar** — Member list for the active room; clicking a member fires `open-dm` and opens the DM in the center panel

### Mobile (<768px) — WhatsApp-style single column
- **List screen** — All rooms and DMs with last-message preview and timestamps; unjoined rooms show a muted "Join to see messages" subtitle
- **Chat screen** — Full-screen chat; back button returns to list
- React Router manages the list ↔ chat stack

### Auth Pages
- `/login` — email + password form, link to register
- `/register` — username + email + password form, link to login
- Both redirect to `/chat` on success; protected routes redirect unauthenticated users to `/login`
