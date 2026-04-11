# Celestra Jewelry

> A full-stack, production-ready ecommerce platform built for a premium jewelry brand — featuring a customer storefront, a dedicated admin dashboard, and a unified backend API.

---

## Overview

Celestra Jewelry is not a template or a starter project. It is a complete, deployable ecommerce system engineered with real-world requirements in mind — secure authentication, real-time notifications, sales analytics, smart product search, and a full order management workflow. Every layer of the stack is purpose-built and production-aware.

---

## System Architecture

The project is split into three independent applications served through a single backend:

```
celestra-jewelry/
├── backend/          # Express.js REST API + Socket.io server
├── frontend/         # Customer-facing storefront (React + Vite)
└── dashboard/
    └── client/       # Admin dashboard (React + Vite)
```

The backend serves both React builds as static files, so the entire system deploys as a single Node.js process. The storefront is served at `/` and the admin dashboard at `/dashboard`.

---

## Features

### Customer Storefront

- Browse products with category filtering, price sorting, and tag-based discovery
- Full-text smart search powered by MongoDB text indexes (name, description, tags)
- Quick view modal for fast product previews without leaving the listing page
- Product detail page with image gallery, size/color selection, and stock awareness
- Persistent cart with quantity control, size and color variants, and live total calculation
- Wishlist to save and revisit favourite products
- Checkout with Cash on Delivery — Pakistan-specific validation (province, city, phone format)
- Order tracking — customers can view their order history and current status
- Real-time notifications via Socket.io (order confirmations, status updates)
- Contact form with rate-limited submission to prevent spam
- User account system with registration, login, JWT-based sessions, and refresh tokens
- Fully responsive design across mobile, tablet, and desktop

### Admin Dashboard

- Secure login with role-based access control (admin-only routes enforced on the backend)
- Dashboard home with live business metrics and summary cards
- Order management — view all orders, update status (pending → completed → cancelled), filter by status
- Product management — add, edit, delete products with image upload, stock control, and variant management
- Customer management — view registered users, their order history, and account details
- Sales analytics — revenue charts, profit tracking, and order volume trends powered by Recharts
- Low-stock alerts — automatic detection and display of products falling below stock thresholds
- Real-time notifications — instant alerts for new orders and customer activity via Socket.io
- Contact message inbox — read and manage messages submitted through the storefront contact form
- Settings panel for admin account and system configuration

### System & Technical Features

- JWT authentication with access tokens and refresh tokens stored in the Login collection
- Role-based middleware (`authMiddleware` / `adminAuth`) protecting all sensitive routes
- NoSQL injection prevention via `mongo-sanitize` on all incoming request data
- Granular rate limiting per endpoint type (auth: 20/15min, orders: 30/15min, contact: 10/hr, uploads: 50/hr)
- Image processing pipeline using `sharp` — uploads are auto-converted to optimised `.webp` at multiple sizes (thumb, md, full)
- MongoDB text indexes on products for performant full-text search
- Compound indexes on category + price for fast filtered queries
- Nodemailer integration for transactional email (order confirmations, contact replies)
- Single-server deployment — both React apps are served as static builds from the Express server
- Environment-based configuration with `.env.example` files for all three apps

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Backend Framework | Express.js v5 |
| Database | MongoDB + Mongoose v9 |
| Real-time | Socket.io v4 |
| Authentication | JSON Web Tokens (jsonwebtoken) |
| Password Hashing | bcryptjs |
| Image Processing | sharp |
| File Uploads | multer |
| Email | Nodemailer |
| Frontend | React 19 + Vite 7 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Admin Dashboard | React 19 + Vite 8 |
| Charts | Recharts |
| HTTP Client | Axios |
| SEO | react-helmet-async |
| Security | express-rate-limit, mongo-sanitize |

---

## Key Highlights

- Three-app monorepo with a single deployment target — no separate hosting needed for the dashboard
- Real-time order and stock events pushed to both admin and customer via Socket.io without polling
- Image upload pipeline that automatically generates three responsive sizes in `.webp` format
- Pakistan-specific checkout validation built into the order model (province, city, phone)
- MongoDB text search across product name, description, and tags — no external search service required
- Tiered rate limiting strategy — different limits per endpoint sensitivity, not a blanket global limit
- NoSQL injection sanitisation applied at the middleware level before any route handler runs
- Admin seed script (`createAdmin.js`) for safe first-time setup without exposing credentials in code
- Refresh token architecture for persistent sessions without compromising security

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (or local MongoDB instance)
- Gmail account with an App Password for Nodemailer

### 1. Clone the repository

```bash
git clone https://github.com/your-username/celestra-jewelry.git
cd celestra-jewelry
```

### 2. Install dependencies

```bash
# Backend
cd backend && npm install

# Customer storefront
cd ../frontend && npm install

# Admin dashboard
cd ../dashboard/client && npm install
```

### 3. Configure environment variables

Copy the example files and fill in your values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp dashboard/client/.env.example dashboard/client/.env
```

### 4. Seed the admin account

```bash
cd backend
node createAdmin.js
```

This creates the first admin user using the credentials defined in `backend/.env`.

### 5. Build the frontend apps

```bash
# Customer storefront
cd frontend && npm run build

# Admin dashboard
cd ../dashboard/client && npm run build
```

### 6. Start the server

```bash
cd backend
node app.js
```

The storefront is available at `http://localhost:1000` and the admin dashboard at `http://localhost:1000/dashboard`.

---

## Environment Variables

### `backend/.env`

```env
PORT=1000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=<app>
JWT_SECRET=<strong-random-secret-32-chars-min>

MAIL_USER=your_gmail@gmail.com
MAIL_PASS=your_gmail_app_password

# Used only by: node createAdmin.js
ADMIN_NAME=Celestra Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong-password>
```

### `frontend/.env`

```env
# Leave empty to use Vite's built-in proxy (recommended for local dev)
# Set to your deployed backend URL for production builds
VITE_API_BASE_URL=
```

### `dashboard/client/.env`

```env
VITE_API_URL=http://localhost:1000/api
```

---

## Security Features

- JWT-based authentication — all protected routes require a valid Bearer token in the `Authorization` header
- Role enforcement — the `adminAuth` middleware verifies both token validity and `role === "admin"` before any admin route executes
- NoSQL injection prevention — `mongo-sanitize` strips MongoDB operator characters (`$`, `.`) from all request body, query, and param data before it reaches any handler
- Rate limiting per endpoint type:
  - Auth routes: 20 requests per 15 minutes
  - Order placement: 30 requests per 15 minutes
  - Contact form: 10 requests per hour
  - File uploads: 50 requests per hour
  - General API: 300 requests per 15 minutes
- Passwords hashed with `bcryptjs` before storage — plaintext passwords are never persisted
- Environment secrets kept out of source code via `.env` files (`.gitignore` enforced)

---

## Scalability & Performance

- MongoDB compound and text indexes eliminate full collection scans on the most common query patterns (category + price filtering, full-text product search)
- Image assets served in `.webp` format at three sizes — the browser loads only what it needs
- Both frontend apps are pre-built static bundles served directly by Express, removing any SSR overhead
- Socket.io handles real-time events without long-polling, keeping connection overhead minimal
- The three-app architecture allows each layer to be extracted and scaled independently (e.g., move the backend to a dedicated server, deploy frontends to a CDN) without code changes

---

## Future Improvements

- Payment gateway integration (Stripe, JazzCash, EasyPaisa)
- Product reviews and ratings system
- Coupon and discount code engine
- Email notification templates for order status changes
- Advanced analytics with date range filtering and export to CSV
- Multi-image reordering in the product editor
- Customer loyalty / points system
- PWA support for offline browsing and push notifications

---

## Author

Developed by **Zoha Fatima**

---

*Celestra Jewelry — built to scale, designed to impress.*
