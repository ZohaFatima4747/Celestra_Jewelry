# Celestra Jewelry

A production-ready full-stack e-commerce platform for a premium jewelry brand — customer storefront, admin dashboard, and REST API.

---

## Features

**Customer**
- Product catalog with search, category filtering, price range, and quick view modal
- Persistent cart for authenticated users and guests (with merge on login)
- Wishlist with guest support and merge on login
- Cash on Delivery checkout with Pakistan-specific address and phone validation
- Order history and real-time in-app notifications
- JWT auth with refresh tokens, guest checkout, and guest-to-account conversion

**Admin**
- Order management with status updates (shipped, delivered, cancelled) and transactional emails
- Manual order creation for phone/walk-in sales
- Product CRUD with bulk image upload to Cloudinary (auto-quality, auto-format)
- Sales analytics — 7-day chart, 6-month revenue/profit breakdown
- Low-stock alerts (≤ 5 units) and pending order alerts
- Customer management and contact message inbox with reply support
- Admin notification inbox

**Technical**
- Atomic stock management — prevents overselling with MongoDB `findOneAndUpdate` + rollback
- Structured logging via Pino (pretty in dev, JSON in prod)
- Rate limiting per route type (auth, orders, contact, uploads, general)
- NoSQL injection sanitization, Helmet security headers, CORS with Vercel preview URL support

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js v5 |
| Database | MongoDB Atlas + Mongoose v9 |
| Real-time | Socket.io v4 |
| Auth | JWT + bcryptjs (7-day access, 30-day refresh) |
| Image Upload | Multer (memory storage) → Cloudinary v2 |
| Email | Nodemailer (Gmail SMTP) |
| Logging | Pino + pino-http |
| Frontend | React 19, Vite 7, Tailwind CSS v4, React Router v7 |
| Admin Dashboard | React 19, Vite 8, Recharts v3 |
| Security | Helmet, express-rate-limit, mongo-sanitize, CORS |

---

## Project Structure

```
celestra-jewelry/
├── backend/              # Express REST API + Socket.io
│   ├── config/           # Cloudinary setup
│   ├── conn/             # MongoDB connection with retry logic
│   ├── middleware/       # Auth, rate limiting, upload, sanitize
│   ├── models/           # 8 Mongoose schemas
│   ├── routes/           # 9 API route files
│   └── utils/            # Logger, email helpers, Cloudinary upload
├── frontend/             # Customer storefront (React + Vite)
│   └── src/
│       ├── components/   # 30+ React components
│       ├── context/      # CartContext
│       └── utils/        # Axios instance, auth helpers, validation
└── dashboard/
    └── client/           # Admin dashboard (React + Vite)
        └── src/
            ├── pages/    # 15+ admin pages
            └── context/  # AuthContext
```

The backend serves both React builds as static files — storefront at `/` and dashboard at `/dashboard`. Both apps can also be deployed independently to Vercel using the included `vercel.json` configs.

---

## Getting Started

**Prerequisites:** Node.js 18+, MongoDB Atlas cluster, Cloudinary account, Gmail App Password

```bash
git clone https://github.com/your-username/celestra-jewelry.git

cd backend && npm install
cd ../frontend && npm install
cd ../dashboard/client && npm install
```

Copy and fill in the environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Seed the admin account:

```bash
cd backend && node createAdmin.js
```

Run all three in development:

```bash
# Terminal 1 — API at http://localhost:1000
cd backend && npm run dev

# Terminal 2 — Storefront at http://localhost:5173
cd frontend && npm run dev

# Terminal 3 — Dashboard at http://localhost:5174
cd dashboard/client && npm run dev
```

---

## Environment Variables

**`backend/.env`**

```env
PORT=1000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=<app>

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<strong-random-secret-min-32-chars>
JWT_REFRESH_SECRET=<strong-random-refresh-secret-min-32-chars>

MAIL_USER=your_gmail@gmail.com
MAIL_PASS=your_gmail_app_password

# Comma-separated, no trailing slash
ALLOWED_ORIGINS=https://celestraa.com,https://www.celestraa.com,http://localhost:5173
FRONTEND_URL=https://celestraa.com

# Log level: trace | debug | info | warn | error
LOG_LEVEL=debug

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Used only by: node createAdmin.js
ADMIN_NAME=Celestra Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong-password>
```

**`frontend/.env`**

```env
# Leave empty to use Vite's built-in proxy in dev
# Set to your deployed backend URL for production builds
VITE_API_BASE_URL=

# Used for canonical URLs, OG tags, and structured data
VITE_SITE_URL=https://celestraa.com
```

**`dashboard/client/.env`**

```env
VITE_API_URL=http://localhost:1000/api
```

---

## API Reference

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/signup` | — | Register or convert guest to account |
| POST | `/api/v1/auth/login` | — | Login, merges guest cart |
| POST | `/api/v1/auth/refresh` | — | Refresh JWT |
| POST | `/api/v1/auth/guest` | — | Create/update guest record |
| GET | `/api/products` | — | List products (search, filter, sort) |
| GET | `/api/products/categories` | — | Distinct categories |
| GET | `/api/products/price-range` | — | Min/max prices |
| GET | `/api/products/:id` | — | Single product |
| POST | `/api/cart/add` | User | Add item to cart |
| GET | `/api/cart` | User | Fetch cart |
| POST | `/api/orders/complete-payment` | — | Place COD order |
| PUT | `/api/orders/:id/status` | User | Cancel pending order |
| GET | `/api/orders/user/:userId` | User | Order history |
| POST | `/api/wishlist/add` | User | Toggle wishlist item |
| GET | `/api/wishlist` | User | Fetch wishlist |
| GET | `/api/messages/user/:userId` | User | In-app notifications |
| POST | `/api/contact-us` | — | Submit contact form |
| GET | `/api/admin/stats` | Admin | Dashboard stats |
| GET | `/api/admin/orders` | Admin | Paginated orders |
| PUT | `/api/admin/orders/:id` | Admin | Update order status |
| POST | `/api/admin/orders/manual` | Admin | Create manual order |
| POST | `/api/admin/products` | Admin | Create product |
| PUT | `/api/admin/products/:id` | Admin | Update product |
| DELETE | `/api/admin/products/:id` | Admin | Delete product |
| GET | `/api/admin/sales` | Admin | 6-month revenue/profit |
| GET | `/api/admin/alerts` | Admin | Low-stock + pending alerts |
| POST | `/api/upload` | Admin | Upload images to Cloudinary |

---

## Deployment

**Single server (Heroku / Railway / Render)**

```bash
cd frontend && npm run build          # output → frontend/dist (served at /)
cd dashboard/client && npm run build  # output → dashboard/client/dist (served at /dashboard)
cd backend && npm start
```

The `Procfile` is pre-configured: `web: node app.js`

**Separate Vercel deployment**

Set `VITE_API_BASE_URL` to your backend URL, then deploy each app. The SPA rewrite rule is already in both `vercel.json` files. Vercel preview URLs matching `celestra-*.vercel.app` are automatically allowed by the backend CORS config.

---

## Database Models

| Model | Key Fields |
|---|---|
| Product | name, price, costPrice, images, category, stock, sizes, colors, tags, isActive |
| Order | items, total, totalCost, profit, customer, status, orderType (online/manual) |
| Contact (User) | name, email, password, phone, province, city, address, isGuest, role |
| Cart | userId, items (product, qty, size, color), status |
| Message | userId, title, body, orderId, type, isRead |
| Wishlist | userId, products[] |
| ContactMessage | name, email, subject, message, replied, isRead |

---

## Author

Zoha Fatima
