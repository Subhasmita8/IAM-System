# IAM System — Identity & Access Management

A production-ready IAM system built with Node.js, React, MySQL, and JWT.

---

## Architecture Overview

```
iam-system/
├── schema.sql                    ← MySQL schema + seed data
├── backend/
│   ├── server.js                 ← Express entry point
│   ├── .env.example              ← Environment template
│   ├── config/
│   │   └── db.js                 ← MySQL connection pool
│   ├── models/
│   │   ├── User.js               ← User queries (DAL)
│   │   ├── Role.js               ← Role/permission queries
│   │   └── RefreshToken.js       ← Token storage queries
│   ├── services/
│   │   ├── authService.js        ← Auth business logic
│   │   └── tokenService.js       ← JWT generation/verification
│   ├── controllers/
│   │   ├── authController.js     ← Auth HTTP handlers
│   │   ├── userController.js     ← User CRUD handlers
│   │   └── roleController.js     ← Role management handlers
│   ├── routes/
│   │   ├── auth.js               ← /auth/* routes
│   │   ├── users.js              ← /users/* routes
│   │   └── roles.js              ← /roles/* routes
│   └── middleware/
│       ├── authenticate.js       ← JWT verification
│       ├── authorize.js          ← RBAC (role + permission)
│       ├── validate.js           ← Input validation rules
│       ├── rateLimiter.js        ← express-rate-limit config
│       └── errorHandler.js       ← Global error handler
└── frontend/
    └── src/
        ├── App.jsx               ← Router + AuthProvider
        ├── App.css               ← Design system + global styles
        ├── index.js              ← React root
        ├── context/
        │   └── AuthContext.jsx   ← Global auth state
        ├── services/
        │   ├── api.js            ← Axios + interceptors
        │   └── authService.js    ← Auth API calls
        ├── components/
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx
            └── AdminPanel.jsx
```

---

## Security Architecture

| Concern | Solution |
|---|---|
| Password storage | bcrypt (12 rounds) |
| Access token | JWT HS256, 15-minute expiry, in-memory only |
| Refresh token | JWT HS256, 7-day expiry, httpOnly cookie + DB hash |
| Token rotation | Old refresh token revoked on each use |
| Token reuse detection | All sessions invalidated on reuse attempt |
| XSS protection | Access token never touches localStorage |
| CSRF protection | SameSite=strict cookie + CORS origin whitelist |
| Brute force | Rate limiter: 10 auth attempts per 15 min |
| SQL injection | Parameterized queries via mysql2 |
| Input validation | express-validator on all inputs |
| Large payloads | JSON body limit: 10kb |

---

## Prerequisites

- Node.js >= 18
- MySQL >= 8.0
- npm or yarn

---

## Setup

### 1. Database

```bash
mysql -u root -p < schema.sql
```

This creates the `iam_db` database, all tables, and seeds:
- 3 default roles: admin, manager, user
- 9 default permissions
- Role-permission mappings

### 2. Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=iam_db

# Generate secrets:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=<64+ char random string>
JWT_REFRESH_SECRET=<different 64+ char random string>
```

```bash
npm install
npm run dev      # Development with nodemon
# or
npm start        # Production
```

Server runs on **http://localhost:5000**

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on **http://localhost:3000**

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register new user |
| POST | `/auth/login` | — | Login, get tokens |
| POST | `/auth/refresh-token` | Cookie | Rotate refresh token |
| POST | `/auth/logout` | Cookie | Revoke refresh token |

**Register / Login request body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "username": "johndoe", "role_name": "user" },
    "accessToken": "eyJ..."
  }
}
```

### Users

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/users` | users:read | List all users |
| GET | `/users/me` | any auth | Own profile |
| GET | `/users/:id` | users:read | User by ID |
| POST | `/users` | users:create | Create user |
| DELETE | `/users/:id` | users:delete | Delete user |

### Roles

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/roles` | roles:read | List roles |
| POST | `/roles` | roles:create | Create role |
| GET | `/roles/:id/permissions` | roles:read | Role permissions |
| POST | `/roles/assign` | admin only | Assign role to user |
| GET | `/roles/permissions/all` | roles:read | All permissions |

**Using the access token:**
```
Authorization: Bearer <accessToken>
```

---

## Default RBAC Matrix

| Permission | admin | manager | user |
|---|---|---|---|
| users:create | ✅ | ❌ | ❌ |
| users:read | ✅ | ✅ | ✅ |
| users:update | ✅ | ✅ | ❌ |
| users:delete | ✅ | ❌ | ❌ |
| roles:create | ✅ | ❌ | ❌ |
| roles:read | ✅ | ✅ | ❌ |
| roles:update | ✅ | ❌ | ❌ |
| roles:delete | ✅ | ❌ | ❌ |
| reports:read | ✅ | ✅ | ❌ |

---

## Creating Your First Admin

After running the schema, register a user then manually promote them:

```sql
USE iam_db;
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE email = 'your@email.com';
```

---

## Frontend Token Flow

```
1. Login  → POST /auth/login
           ← { accessToken } + httpOnly refreshToken cookie

2. API    → GET /users (Authorization: Bearer <accessToken>)
           ← data

3. Expiry → 401 TOKEN_EXPIRED intercepted by axios
           → POST /auth/refresh-token (cookie sent automatically)
           ← { accessToken: newToken }
           → Retry original request with new token

4. Logout → POST /auth/logout
           → Cookie cleared, token revoked in DB
           → accessToken cleared from memory
```

---

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS (set `secure: true` on cookies automatically)  
- [ ] Use strong, unique JWT secrets (64+ random bytes each)
- [ ] Configure `FRONTEND_URL` to your actual domain
- [ ] Set up a cron job to run `RefreshToken.cleanup()` daily
- [ ] Add a proper logger (Winston / Pino) replacing `console.error`
- [ ] Put access token in Redis cache for instant invalidation
- [ ] Enable MySQL SSL in production
- [ ] Run behind nginx reverse proxy
