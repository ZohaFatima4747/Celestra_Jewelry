# Celestra Jewelry

A full-stack e-commerce platform for a premium jewelry brand — customer storefront, admin dashboard, and REST API, all deployable as a single Node.js process.

---

## Features

- Product catalog with search, category filtering, price sorting, and quick view
- Persistent cart for both authenticated users and guests
- Cash on Delivery checkout with Pakistan-specific address validation
- Wishlist, order history, and real-time in-app notifications (Socket.io)
- JWT auth with refresh tokens, guest checkout, and guest-to-account conversion
- Admin dashboard with order management, product CRUD, sales analytics, and low-stock alerts
- Manual order creation for phone/walk-in sales
- Image upload pipeline — auto-converts to optimised `.webp` via sharp
- Transactional email for order confirmations and cancellations

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js v5 |
| Database | MongoDB + Mongoose v9 |
| Real-time | Socket.io v4 |
| Auth | JWT + bcryptjs |
| Image Processing | multer + sharp |
| Email | Nodemailer |
| Frontend | React 19, Vite 7, Tailwind CSS v4, React Router v7 |
| Admin Dashboard | React 19, Vite 8, Recharts v3 |
| Security | helmet, express-rate-limit, mongo-sanitize, cors |

---

## System Overview

```
celestra-jewelry/
├── backend/          # Express REST API + Socket.io
├── frontend/         # Customer storefront (React + Vite)
└── dashboard/
    └── client/       # Admin dashboard (React + Vite)
```

The backend serves both React builds as static files — the storefront at `/` and the dashboard at `/dashboard`. No separate hosting is needed for the dashboard. Both apps can also be deployed independently to Vercel with the included `vercel.json` configs.

---

## Getting Started

**Prerequisites:** Node.js 18+, MongoDB Atlas cluster, Gmail App Password

```bash
git clone https://github.com/your-username/celestra-jewelry.git

cd backend && npm install
cd ../frontend && npm install
cd ../dashboard/client && npm install
```

Seed the admin account after configuring your `.env`:

```bash
cd backend && node createAdmin.js
```

Run all three apps in development:

```bash
# Terminal 1
cd backend && nodemon app.js

# Terminal 2 — storefront at http://localhost:5173
cd frontend && npm run dev

# Terminal 3 — dashboard at http://localhost:5174
cd dashboard/client && npm run dev
```

---

## Environment Variables

**`backend/.env`**

```env
PORT=1000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/

JWT_SECRET=<random-32-bytes>
JWT_REFRESH_SECRET=<random-32-bytes>

MAIL_USER=your_gmail@gmail.com
MAIL_PASS=your_gmail_app_password

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
LOG_LEVEL=debug

# Admin seed — used only by node createAdmin.js
ADMIN_NAME=Celestra Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong-password>
```

**`frontend/.env`**

```env
VITE_API_BASE_URL=        # leave empty for Vite proxy in dev
VITE_SITE_URL=https://www.celestrajewelry.com
```

**`dashboard/client/.env`**

```env
VITE_API_URL=http://localhost:1000/api
```

> Generate secrets with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Deployment

**Single server (Heroku / Railway / Render)**

```bash
cd frontend && npm run build          # served at /
cd dashboard/client && npm run build  # served at /dashboard
cd backend && npm start/ npm install
```

The `Procfile` is pre-configured: `web: node app.js`

**Separate Vercel deployment**

Set `VITE_API_BASE_URL` to your backend URL, then deploy each app. The SPA rewrite rule is already in both `vercel.json` files. Vercel preview URLs matching `celestra-*.vercel.app` are automatically allowed by the backend CORS config.

---

Author 

Zoha Fatima
