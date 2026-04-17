# Design Document: Supabase Migration

## Overview

This document describes the technical design for migrating the Celestra Jewelry platform from an Express.js + MongoDB + Socket.io + Multer/Sharp backend to a fully Supabase-powered architecture. After the migration, both the Storefront (`frontend/`) and the Admin Dashboard (`dashboard/client/`) will communicate directly with Supabase services — Auth, PostgreSQL, Storage, and Realtime — using the `@supabase/supabase-js` client. The custom `backend/` Node.js server will no longer be required for any runtime functionality.

The migration is designed to be incremental: each feature area (auth, products, cart, orders, etc.) can be migrated independently without breaking the running application.

---

## Architecture

### Current Architecture

```
Browser (Storefront / Dashboard)
        │  axios HTTP
        ▼
Express.js Server (backend/)
  ├── JWT auth middleware
  ├── Mongoose → MongoDB Atlas
  ├── Multer + Sharp → /uploads filesystem
  ├── Socket.io → WebSocket connections
  └── Nodemailer → Gmail SMTP
```

### Target Architecture

```
Browser (Storefront / Dashboard)
        │  @supabase/supabase-js
        ▼
Supabase Platform
  ├── Supabase Auth      (replaces JWT + bcryptjs)
  ├── Supabase PostgreSQL (replaces MongoDB + Mongoose)
  │     └── Row Level Security (replaces auth middleware)
  ├── Supabase Storage   (replaces Multer + Sharp + /uploads)
  ├── Supabase Realtime  (replaces Socket.io)
  └── Supabase Edge Functions (replaces Nodemailer email sending)
```

### Deployment After Migration

```
Vercel (free tier)
  ├── frontend/          → Storefront SPA
  └── dashboard/client/  → Admin Dashboard SPA

Supabase (free tier)
  ├── Auth
  ├── PostgreSQL
  ├── Storage (product-images bucket)
  ├── Realtime
  └── Edge Functions (email notifications)
```

---

## Components and Interfaces

### 1. Supabase Client Singleton

Both apps will have a dedicated client file:

- `frontend/src/utils/supabaseClient.js`
- `dashboard/client/src/utils/supabaseClient.js`

```js
// frontend/src/utils/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

The existing `frontend/src/utils/axiosInstance.js` and `dashboard/client/src/utils/api.js` axios wrappers will be removed once all API calls are migrated.

### 2. Authentication

**Signup flow:**
1. Call `supabase.auth.signUp({ email, password, options: { data: { name } } })`
2. Supabase Auth creates the user in `auth.users`
3. A PostgreSQL trigger automatically inserts a row into `public.profiles` with `role = 'user'`

**Login flow:**
1. Call `supabase.auth.signInWithPassword({ email, password })`
2. Session (access token + refresh token) stored automatically in `localStorage` by the Supabase client
3. `supabase.auth.getSession()` used to restore session on page load

**Admin check:**
1. After login, query `profiles` table: `select role from profiles where id = auth.uid()`
2. If `role !== 'admin'`, redirect to storefront login

**Guest checkout:**
1. No Supabase Auth call — guest ID is a UUID generated client-side
2. `profiles` row inserted with `is_guest = true` via a public-insert RLS policy
3. On later signup with same email, update `profiles` row: `is_guest = false`

**Session management:**
- `supabase.auth.onAuthStateChange()` listener replaces the axios 401 interceptor
- Replaces: `backend/routes/contact.js` (signup/login/refresh/guest endpoints), `backend/middleware/auth.js`

### 3. Database Access Layer

All data access goes through the Supabase JS client using the PostgREST auto-generated API:

```js
// Example: fetch active products with category filter
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true)
  .eq('category', category)
  .order('created_at', { ascending: false })
```

Complex queries (stats aggregations, full-text search) use Supabase RPC (PostgreSQL functions):

```js
// Example: dashboard stats
const { data } = await supabase.rpc('get_dashboard_stats')
```

### 4. Storage

Product image uploads use the Supabase Storage JS API:

```js
const { data, error } = await supabase.storage
  .from('product-images')
  .upload(`${Date.now()}-${file.name}`, file, {
    contentType: file.type,
    upsert: false,
  })

const { data: { publicUrl } } = supabase.storage
  .from('product-images')
  .getPublicUrl(data.path)
```

Client-side image resizing (replacing Sharp) will use the browser's `canvas` API or the `browser-image-compression` npm package to generate a compressed version before upload. Supabase Storage Image Transformations (available on paid plans) can serve responsive variants via URL parameters.

### 5. Realtime Notifications

```js
// Subscribe to new notifications for the current user
const channel = supabase
  .channel('user-notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => handleNewNotification(payload.new)
  )
  .subscribe()
```

Replaces: `socket.io-client` in `dashboard/client/package.json` and the Socket.io server setup.

### 6. Email Notifications (Edge Functions)

Transactional emails are sent via a Supabase Edge Function triggered by PostgreSQL webhooks (or called directly from the client after order placement):

```
supabase/functions/send-order-email/index.ts
```

The Edge Function uses the [Resend](https://resend.com) API (free tier: 3,000 emails/month) as the email provider, replacing Nodemailer + Gmail SMTP. The existing HTML email templates from `backend/utils/` are ported to the Edge Function.

---

## Data Models

### PostgreSQL Schema

```sql
-- Profiles (extends auth.users)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null unique,
  phone       text,
  province    text,
  city        text,
  address     text,
  is_guest    boolean default false,
  role        text default 'user' check (role in ('admin', 'user')),
  created_at  timestamptz default now()
);

-- Products
create table public.products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text default '',
  price        numeric(10,2) not null check (price >= 0),
  cost_price   numeric(10,2) default 0 check (cost_price >= 0),
  images       text[] default '{}',
  category     text default '',
  stock        integer default 0 check (stock >= 0),
  sizes        text[] default '{}',
  colors       text[] default '{}',
  tags         text[] default '{}',
  rating       numeric(3,2) default 0 check (rating between 0 and 5),
  num_reviews  integer default 0,
  is_active    boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Orders
create table public.orders (
  id          uuid primary key default gen_random_uuid(),
  session_id  text,
  order_type  text default 'online' check (order_type in ('online', 'manual')),
  items       jsonb not null default '[]',
  total       numeric(10,2) not null,
  total_cost  numeric(10,2) default 0,
  profit      numeric(10,2) default 0,
  customer    jsonb not null,
  status      text default 'pending COD'
              check (status in ('pending COD','shipped','delivered','cancelled','completed')),
  created_at  timestamptz default now()
);

-- Carts
create table public.carts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  items       jsonb default '[]',
  total       numeric(10,2) default 0,
  status      text default 'pending' check (status in ('pending', 'completed')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Wishlists
create table public.wishlists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade unique,
  product_ids uuid[] default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Notifications
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  title       text not null,
  body        text not null,
  order_id    uuid references public.orders(id),
  type        text check (type in ('order_placed','order_cancelled','status_update')),
  is_read     boolean default false,
  created_at  timestamptz default now()
);

-- Contact Messages
create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  subject     text default '',
  message     text not null,
  replied     boolean default false,
  replied_at  timestamptz,
  is_read     boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
```

### Indexes

```sql
create index on products(category, price);
create index on products using gin(to_tsvector('english', name || ' ' || description || ' ' || array_to_string(tags, ' ')));
create index on orders(session_id, created_at desc);
create index on orders(status, created_at desc);
create index on notifications(user_id, created_at desc);
create index on carts(user_id);
```

### Trigger: Auto-create profile on signup

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### PostgreSQL RPC Functions

```sql
-- Dashboard stats aggregation
create or replace function get_dashboard_stats()
returns json language plpgsql security definer as $$
declare result json;
begin
  select json_build_object(
    'totalRevenue',    coalesce(sum(total) filter (where status in ('delivered','completed')), 0),
    'totalOrders',     count(*),
    'completedOrders', count(*) filter (where status in ('delivered','completed')),
    'pendingOrders',   count(*) filter (where status in ('pending COD','shipped')),
    'cancelledOrders', count(*) filter (where status = 'cancelled')
  ) into result from orders;
  return result;
end;
$$;

-- Full-text product search
create or replace function search_products(search_query text)
returns setof products language sql as $$
  select * from products
  where is_active = true
    and to_tsvector('english', name || ' ' || description || ' ' || array_to_string(tags, ' '))
        @@ plainto_tsquery('english', search_query);
$$;
```

---

## Row Level Security Policies

```sql
-- Enable RLS on all tables
alter table profiles         enable row level security;
alter table products         enable row level security;
alter table orders           enable row level security;
alter table carts            enable row level security;
alter table wishlists        enable row level security;
alter table notifications    enable row level security;
alter table contact_messages enable row level security;

-- Helper: check if current user is admin
create or replace function is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles: users read/update own row; admins read all
create policy "Users manage own profile"
  on profiles for all using (id = auth.uid());
create policy "Admins manage all profiles"
  on profiles for all using (is_admin());

-- products: public read of active; admins write
create policy "Public read active products"
  on products for select using (is_active = true);
create policy "Admins manage products"
  on products for all using (is_admin());

-- orders: public insert (guest checkout); users read own; admins all
create policy "Public insert orders"
  on orders for insert with check (true);
create policy "Users read own orders"
  on orders for select using (
    session_id = auth.uid()::text
    or session_id = (select email from profiles where id = auth.uid())
  );
create policy "Admins manage orders"
  on orders for all using (is_admin());

-- carts: users manage own cart
create policy "Users manage own cart"
  on carts for all using (user_id = auth.uid());

-- wishlists: users manage own wishlist
create policy "Users manage own wishlist"
  on wishlists for all using (user_id = auth.uid());

-- notifications: users read own; admins all
create policy "Users read own notifications"
  on notifications for select using (user_id = auth.uid()::text);
create policy "Users update own notifications"
  on notifications for update using (user_id = auth.uid()::text);
create policy "Public insert notifications"
  on notifications for insert with check (true);
create policy "Admins manage notifications"
  on notifications for all using (is_admin());

-- contact_messages: public insert; admins manage
create policy "Public insert contact messages"
  on contact_messages for insert with check (true);
create policy "Admins manage contact messages"
  on contact_messages for all using (is_admin());
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Auth round-trip

*For any* valid email and password, signing up and then signing in with those credentials should return a valid session with a non-null access token.

**Validates: Requirements 4.1, 4.2**

---

### Property 2: Guest profile upsert idempotence

*For any* guest email, calling the guest upsert operation twice with the same email should result in exactly one `profiles` row with `is_guest = true` — not two rows.

**Validates: Requirements 4.5**

---

### Property 3: RLS cart isolation

*For any* two distinct logged-in users A and B, user A's Supabase client should never be able to read or write user B's cart rows.

**Validates: Requirements 3.2, 6.1**

---

### Property 4: RLS wishlist isolation

*For any* two distinct logged-in users A and B, user A's Supabase client should never be able to read or write user B's wishlist rows.

**Validates: Requirements 3.3, 7.1**

---

### Property 5: Product filter correctness

*For any* category filter value, all products returned by the filtered query should have `category` equal to that value and `is_active = true`.

**Validates: Requirements 5.1, 5.2**

---

### Property 6: Price range filter correctness

*For any* minPrice and maxPrice values, all products returned should have `price >= minPrice` and `price <= maxPrice`.

**Validates: Requirements 5.3**

---

### Property 7: Cart item persistence round-trip

*For any* logged-in user and product, adding a product to the cart and then fetching the cart should return a cart that contains that product with the correct quantity, size, and color.

**Validates: Requirements 6.1, 6.6**

---

### Property 8: Cart merge completeness

*For any* guest cart with N items and a user cart with M items (no overlapping products), after merging the guest cart into the user cart, the resulting cart should contain at least N + M items.

**Validates: Requirements 6.5**

---

### Property 9: Order placement creates notification

*For any* valid order submission, after the order is inserted into `orders`, a corresponding row should exist in `notifications` with `type = 'order_placed'` and `user_id` matching the order's `session_id`.

**Validates: Requirements 8.1, 8.2**

---

### Property 10: Order status update creates notification

*For any* order status change by an admin (to `shipped`, `delivered`, or `cancelled`), a `notifications` row of type `status_update` should be inserted for the customer's `user_id`.

**Validates: Requirements 8.6**

---

### Property 11: Storage upload returns valid public URL

*For any* image file uploaded to the `product-images` bucket, the returned public URL should be a valid HTTPS URL that resolves to the uploaded file.

**Validates: Requirements 9.1, 9.2**

---

### Property 12: Notification delivery via Realtime

*For any* `notifications` INSERT event for a subscribed user, the Realtime channel callback should fire with the new notification payload within the active browser session.

**Validates: Requirements 13.1, 13.4**

---

## Error Handling

| Scenario | Handling |
|---|---|
| Missing env vars at client init | Throw descriptive error at module load time |
| Supabase auth error (wrong password) | Surface `error.message` from Supabase response to UI |
| RLS policy violation (403) | Catch `error.code === 'PGRST301'`, show "Access denied" |
| Storage upload type/size violation | Validate MIME type and size client-side before upload; show inline error |
| Network error during DB call | Catch and display user-friendly retry message |
| Edge Function email failure | Log error, return success to client (non-blocking) |
| Guest cart merge conflict (same product) | Increment `qty` rather than duplicate the item |
| Order with empty cart | Validate cart length > 0 before calling Supabase insert |
| Invalid Pakistani phone/province | Client-side validation before order insert (mirrors existing `validateCustomer`) |

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are used. Unit tests verify specific examples and edge cases; property-based tests verify universal properties across many generated inputs.

### Testing Framework

- **Unit tests**: [Vitest](https://vitest.dev/) — already compatible with the Vite build setup in both apps
- **Property-based tests**: [fast-check](https://fast-check.io/) — TypeScript/JavaScript PBT library, integrates with Vitest

### Unit Tests

Unit tests cover:
- `supabaseClient.js` — throws when env vars are missing
- Auth helper functions — session parsing, role extraction
- Cart merge logic — guest cart + user cart deduplication
- Order validation — `validateCustomer` function (phone regex, province list, address length)
- Contact form validation — name, email, message required fields
- Storage helpers — MIME type and file size validation

### Property-Based Tests

Each property from the Correctness Properties section is implemented as a single property-based test using fast-check. Minimum 100 iterations per test.

Test annotation format:
```js
// Feature: supabase-migration, Property 5: Product filter correctness
// Validates: Requirements 5.1, 5.2
test.prop([fc.string(), fc.array(fc.record({ category: fc.string(), is_active: fc.boolean() }))])(
  'all returned products match the category filter',
  async (category, products) => { ... }
)
```

### Property Test Configuration

```js
// vitest.config.js
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
```

Each property test runs with `{ numRuns: 100 }` (fast-check default) and is tagged with the feature name and property number for traceability.

### Integration Tests

Integration tests against a local Supabase instance (via `supabase start` CLI) verify:
- RLS policies enforce cart and wishlist isolation between users
- Order insert triggers notification insert
- Auth trigger creates `profiles` row on signup
