# Requirements Document

## Introduction

This document defines the requirements for migrating the Celestra Jewelry e-commerce platform from its current Express.js + MongoDB + Socket.io + Multer/Sharp backend to a Supabase-powered architecture. The migration replaces the custom Node.js backend with Supabase Auth, Supabase PostgreSQL, Supabase Realtime, and Supabase Storage. The React + Vite frontend (storefront and admin dashboard) will communicate directly with Supabase using the Supabase JS client, eliminating the need for a custom REST API server.

## Glossary

- **Supabase_Client**: The `@supabase/supabase-js` singleton instance used by both the storefront frontend and the admin dashboard to communicate with Supabase services.
- **Storefront**: The customer-facing React + Vite application located in `frontend/`.
- **Dashboard**: The admin React + Vite application located in `dashboard/client/`.
- **Auth**: Supabase Authentication service replacing the current JWT + bcryptjs system.
- **DB**: Supabase PostgreSQL database replacing MongoDB.
- **Storage**: Supabase Storage service replacing Multer + Sharp file uploads.
- **Realtime**: Supabase Realtime service replacing Socket.io for live notifications.
- **RLS**: Row Level Security — PostgreSQL policies enforced by Supabase to restrict data access per user role.
- **Guest_User**: A shopper who checks out without creating an account.
- **Admin_User**: A user with `role = 'admin'` in the `profiles` table, with full dashboard access.
- **Product**: A jewelry item with name, description, price, cost price, images, category, stock, sizes, colors, tags, and active status.
- **Order**: A customer purchase record with items, totals, customer details, and a status workflow.
- **Cart**: A collection of product items associated with a logged-in user or stored in localStorage for guests.
- **Wishlist**: A saved list of products associated with a logged-in user.
- **Notification**: An in-app message sent to a user or admin about order events.
- **ContactMessage**: A message submitted via the contact form by a site visitor.

---

## Requirements

### Requirement 1: Supabase Client Setup

**User Story:** As a developer, I want a single, shared Supabase client instance in both the Storefront and Dashboard, so that all Supabase service calls are consistent and centrally configured.

#### Acceptance Criteria

1. THE Supabase_Client SHALL be initialised using the project URL and anon public key sourced from environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).
2. THE Supabase_Client SHALL be exported as a singleton from a dedicated utility file (`src/utils/supabaseClient.js`) in both the Storefront and Dashboard.
3. WHEN the environment variables are missing, THE Supabase_Client SHALL throw a descriptive error at initialisation time.
4. THE Storefront AND Dashboard SHALL each have their own independent Supabase_Client instance configured with their respective environment variables.

---

### Requirement 2: Database Schema

**User Story:** As a developer, I want a PostgreSQL schema in Supabase that mirrors all existing MongoDB collections, so that all application data is stored relationally with proper constraints and indexes.

#### Acceptance Criteria

1. THE DB SHALL contain a `profiles` table with columns: `id` (UUID, references `auth.users`), `name`, `email`, `phone`, `province`, `city`, `address`, `is_guest` (boolean), `role` (enum: `admin`, `user`), `created_at`.
2. THE DB SHALL contain a `products` table with columns: `id` (UUID), `name`, `description`, `price`, `cost_price`, `images` (text array), `category`, `stock`, `sizes` (text array), `colors` (text array), `tags` (text array), `rating`, `num_reviews`, `is_active` (boolean), `created_at`, `updated_at`.
3. THE DB SHALL contain an `orders` table with columns: `id` (UUID), `session_id`, `order_type` (enum: `online`, `manual`), `items` (JSONB), `total`, `total_cost`, `profit`, `customer` (JSONB), `status` (enum: `pending COD`, `shipped`, `delivered`, `cancelled`, `completed`), `created_at`.
4. THE DB SHALL contain a `carts` table with columns: `id` (UUID), `user_id` (UUID, references `profiles.id`), `items` (JSONB), `total`, `status` (enum: `pending`, `completed`), `created_at`, `updated_at`.
5. THE DB SHALL contain a `wishlists` table with columns: `id` (UUID), `user_id` (UUID, references `profiles.id`), `product_ids` (UUID array), `created_at`, `updated_at`.
6. THE DB SHALL contain a `notifications` table with columns: `id` (UUID), `user_id` (text), `title`, `body`, `order_id` (UUID, nullable), `type` (enum: `order_placed`, `order_cancelled`, `status_update`), `is_read` (boolean), `created_at`.
7. THE DB SHALL contain a `contact_messages` table with columns: `id` (UUID), `name`, `email`, `subject`, `message`, `replied` (boolean), `replied_at` (timestamptz, nullable), `is_read` (boolean), `created_at`, `updated_at`.
8. THE DB SHALL define indexes on `products(category, price)`, `products` full-text search on `name`, `description`, `tags`, `orders(session_id, created_at)`, `orders(status, created_at)`, `notifications(user_id, created_at)`.

---

### Requirement 3: Row Level Security Policies

**User Story:** As a system architect, I want RLS policies on all tables so that users can only access their own data and admins have full access, without requiring a custom backend to enforce authorization.

#### Acceptance Criteria

1. THE DB SHALL enable RLS on all tables: `profiles`, `products`, `orders`, `carts`, `wishlists`, `notifications`, `contact_messages`.
2. WHEN a logged-in user reads or writes to `carts`, THE DB SHALL permit access only if `carts.user_id` matches `auth.uid()`.
3. WHEN a logged-in user reads or writes to `wishlists`, THE DB SHALL permit access only if `wishlists.user_id` matches `auth.uid()`.
4. WHEN a logged-in user reads `notifications`, THE DB SHALL permit access only if `notifications.user_id` matches `auth.uid()`.
5. THE DB SHALL allow public read access to `products` where `is_active = true`.
6. WHEN a user has `role = 'admin'` in `profiles`, THE DB SHALL grant full read and write access to all tables.
7. THE DB SHALL allow public insert access to `orders` (to support guest checkout).
8. THE DB SHALL allow public insert access to `contact_messages`.
9. WHEN a logged-in user reads `orders`, THE DB SHALL permit access only if `orders.session_id` matches `auth.uid()` or the user's email.

---

### Requirement 4: Authentication Migration

**User Story:** As a user, I want to register, log in, and manage my session using Supabase Auth, so that my account is securely managed without a custom JWT implementation.

#### Acceptance Criteria

1. WHEN a user submits a signup form with name, email, and password, THE Auth SHALL create a new Supabase auth user and THE DB SHALL insert a corresponding `profiles` row with `role = 'user'`.
2. WHEN a user submits a login form with email and password, THE Auth SHALL return a session with an access token stored in the browser.
3. WHEN a user logs out, THE Auth SHALL invalidate the session and clear all local auth state.
4. WHEN a session expires, THE Auth SHALL automatically refresh the access token using the refresh token without requiring user action.
5. WHEN a guest user provides name, email, and shipping details at checkout, THE DB SHALL upsert a `profiles` row with `is_guest = true` and return the profile ID.
6. WHEN a guest user later signs up with the same email, THE Auth SHALL convert the guest profile to a full account by setting `is_guest = false` and storing the hashed password via Supabase Auth.
7. WHEN an admin logs into the Dashboard, THE Auth SHALL verify the user's session and THE DB SHALL confirm `role = 'admin'` in `profiles` before granting dashboard access.
8. IF a user attempts to access a protected route without a valid session, THEN THE Auth SHALL redirect the user to the login page.

---

### Requirement 5: Product Catalog

**User Story:** As a shopper, I want to browse, search, and filter products, so that I can find jewelry items that match my preferences.

#### Acceptance Criteria

1. WHEN a shopper requests the product list, THE DB SHALL return all products where `is_active = true`.
2. WHEN a shopper filters by category, THE DB SHALL return only products matching that category.
3. WHEN a shopper filters by price range, THE DB SHALL return only products with `price` between the specified minimum and maximum.
4. WHEN a shopper searches by keyword, THE DB SHALL return products where the keyword matches `name`, `description`, `category`, or `tags` using full-text search.
5. WHEN a shopper requests a single product by ID, THE DB SHALL return the full product record or a not-found error.
6. THE DB SHALL return the distinct list of active product categories for use in filter UI.
7. THE DB SHALL return the minimum and maximum price of active products for use in the price range filter.

---

### Requirement 6: Cart Management

**User Story:** As a shopper, I want to manage a shopping cart that persists across sessions, so that I can add, update, and remove items before checkout.

#### Acceptance Criteria

1. WHEN a logged-in user adds a product to the cart, THE DB SHALL upsert the item into the `carts` table for that user.
2. WHEN a logged-in user removes an item from the cart, THE DB SHALL update the `carts` row to exclude that item.
3. WHEN a logged-in user updates item quantity, THE DB SHALL update the `qty` field for that item in the cart.
4. WHEN a guest user adds a product to the cart, THE Storefront SHALL store the cart in `localStorage` without a database call.
5. WHEN a guest user logs in or signs up, THE Storefront SHALL merge the `localStorage` guest cart into the user's database cart.
6. WHEN a cart item references a product variant (size or color), THE DB SHALL store `selected_size` and `selected_color` alongside the item.
7. WHEN an order is successfully placed, THE DB SHALL update the cart `status` to `completed`.

---

### Requirement 7: Wishlist Management

**User Story:** As a logged-in shopper, I want to save products to a wishlist, so that I can revisit items I am interested in.

#### Acceptance Criteria

1. WHEN a logged-in user adds a product to the wishlist, THE DB SHALL upsert the product ID into the user's `wishlists` row.
2. WHEN a logged-in user removes a product from the wishlist, THE DB SHALL remove the product ID from the user's `wishlists` row.
3. WHEN a logged-in user fetches the wishlist, THE DB SHALL return the full product details for all saved product IDs.
4. WHEN a guest user attempts to add to the wishlist, THE Storefront SHALL prompt the user to log in.

---

### Requirement 8: Order Management

**User Story:** As a shopper, I want to place and track orders, so that I can purchase jewelry and monitor delivery status.

#### Acceptance Criteria

1. WHEN a shopper submits a checkout form with valid customer details and a non-empty cart, THE DB SHALL insert a new `orders` row with `status = 'pending COD'`.
2. WHEN an order is placed, THE DB SHALL insert a `notifications` row of type `order_placed` for the user.
3. WHEN a shopper requests their order history, THE DB SHALL return all orders where `session_id` matches the user's ID or email.
4. WHEN a shopper cancels a pending order, THE DB SHALL update the order `status` to `cancelled` and insert a `notifications` row of type `order_cancelled`.
5. IF the customer details fail validation (invalid phone, missing address, unsupported province), THEN THE Storefront SHALL display descriptive error messages without submitting the order.
6. WHEN an admin updates an order status to `shipped`, `delivered`, or `cancelled`, THE DB SHALL update the `orders` row and insert a `notifications` row of type `status_update` for the customer.

---

### Requirement 9: Image Upload via Supabase Storage

**User Story:** As an admin, I want to upload product images that are stored in Supabase Storage, so that images are reliably hosted without a custom file server.

#### Acceptance Criteria

1. WHEN an admin uploads an image file, THE Storage SHALL store the file in a dedicated `product-images` bucket.
2. WHEN an image is uploaded, THE Storage SHALL return a public URL that is stored in the `products.images` array.
3. THE Storage SHALL accept only image MIME types (image/jpeg, image/png, image/webp, image/gif).
4. THE Storage SHALL enforce a maximum file size of 10 MB per upload.
5. WHEN an admin deletes a product, THE Storage SHALL remove all associated image files from the `product-images` bucket.
6. WHERE the admin dashboard uploads images, THE Dashboard SHALL use the Supabase_Client Storage API directly without routing through a custom backend.

---

### Requirement 10: Admin Product Management

**User Story:** As an admin, I want to create, update, and delete products from the dashboard, so that I can manage the store catalog.

#### Acceptance Criteria

1. WHEN an admin creates a product with valid fields, THE DB SHALL insert a new row into `products`.
2. WHEN an admin updates a product, THE DB SHALL update the corresponding `products` row.
3. WHEN an admin deletes a product, THE DB SHALL set `is_active = false` on the `products` row (soft delete).
4. WHEN an admin fetches the product list in the dashboard, THE DB SHALL return all products regardless of `is_active` status, with pagination support.
5. WHEN an admin updates product stock, THE DB SHALL update the `stock` field on the `products` row.

---

### Requirement 11: Admin Order Management

**User Story:** As an admin, I want to view and manage all orders, so that I can process shipments and handle customer issues.

#### Acceptance Criteria

1. WHEN an admin fetches orders, THE DB SHALL return all orders with pagination, sorted by `created_at` descending.
2. WHEN an admin updates an order status, THE DB SHALL update the `orders.status` field and trigger a `notifications` insert for the customer.
3. WHEN an admin creates a manual order, THE DB SHALL insert an `orders` row with `order_type = 'manual'`.
4. WHEN an admin fetches dashboard stats, THE DB SHALL return total revenue, total orders, completed orders, pending orders, cancelled orders, total users, and last-7-days daily revenue/order counts using aggregation queries.

---

### Requirement 12: Admin User Management

**User Story:** As an admin, I want to view and manage customer accounts, so that I can support customers and maintain data quality.

#### Acceptance Criteria

1. WHEN an admin fetches the user list, THE DB SHALL return all `profiles` rows with `role = 'user'`, with pagination.
2. WHEN an admin deletes a user, THE DB SHALL delete the `profiles` row and THE Auth SHALL delete the corresponding Supabase auth user.
3. WHEN an admin views a customer, THE DB SHALL return the customer's order history alongside their profile.

---

### Requirement 13: Real-time Notifications via Supabase Realtime

**User Story:** As a user and admin, I want to receive in-app notifications in real time when order events occur, so that I am immediately informed without refreshing the page.

#### Acceptance Criteria

1. WHEN a new `notifications` row is inserted for a logged-in user, THE Realtime SHALL push the notification to the user's active browser session.
2. WHEN a logged-in user marks a notification as read, THE DB SHALL update `notifications.is_read = true` for that notification.
3. WHEN an admin marks all notifications as read, THE DB SHALL update `is_read = true` for all admin notification rows.
4. WHEN a new order is placed, THE Realtime SHALL push a notification to all active admin sessions.
5. WHEN a Realtime subscription is established, THE Storefront AND Dashboard SHALL subscribe to the `notifications` table filtered by the current user's ID.

---

### Requirement 14: Contact Form

**User Story:** As a site visitor, I want to submit a contact message, so that I can reach the store owner with questions or feedback.

#### Acceptance Criteria

1. WHEN a visitor submits the contact form with name, email, subject, and message, THE DB SHALL insert a new `contact_messages` row.
2. WHEN an admin views the contact inbox, THE DB SHALL return all `contact_messages` rows sorted by `created_at` descending.
3. WHEN an admin replies to a contact message, THE DB SHALL update `contact_messages.replied = true` and `replied_at` to the current timestamp.
4. WHEN an admin marks a contact message as read, THE DB SHALL update `contact_messages.is_read = true`.

---

### Requirement 15: Email Notifications

**User Story:** As a shopper, I want to receive transactional emails for order events, so that I am informed about my order status outside the app.

#### Acceptance Criteria

1. WHEN an order is placed, THE System SHALL send an order confirmation email to the customer's email address.
2. WHEN an order status changes to `shipped`, THE System SHALL send a shipping notification email to the customer.
3. WHEN an order status changes to `delivered`, THE System SHALL send a delivery confirmation email to the customer.
4. WHEN an order is cancelled, THE System SHALL send a cancellation email to the customer.
5. WHERE email sending fails, THE System SHALL log the error and continue processing without failing the primary operation.
6. THE System SHALL send emails using a Supabase Edge Function or an external email service (e.g., Resend or Nodemailer via a lightweight server), replacing the current Nodemailer + Gmail SMTP setup.

---

### Requirement 16: Frontend Refactoring

**User Story:** As a developer, I want the Storefront and Dashboard to communicate directly with Supabase, so that the custom Express.js backend can be fully removed.

#### Acceptance Criteria

1. THE Storefront SHALL replace all `axios` calls to the custom backend with Supabase_Client calls.
2. THE Dashboard SHALL replace all `axios` calls to the custom backend with Supabase_Client calls.
3. THE Storefront SHALL remove `axiosInstance.js` and replace it with the Supabase_Client.
4. THE Dashboard SHALL remove its `api.js` axios wrapper and replace it with the Supabase_Client.
5. WHEN the migration is complete, THE System SHALL not require the `backend/` Express.js server to be running for any frontend functionality.
6. THE Storefront AND Dashboard SHALL read Supabase credentials exclusively from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables.
