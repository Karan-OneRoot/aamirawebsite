## Database Schema (PostgreSQL) for TablePlus

This project includes a PostgreSQL schema defining three tables that you can view and manage in TablePlus:

- `users`: user accounts and profile details
- `products`: catalog of products and stock levels
- `user_preferences`: key/value preferences per user

The schema is located at `db/schema.sql` and targets PostgreSQL.

### Open in TablePlus (PostgreSQL)

1. Open TablePlus.
2. Click "Create a new connection" and choose PostgreSQL.
3. Enter your server details (Host, Port, User, Password, Database). You can create an empty database first (e.g., `aamira`).
4. Connect to the database.
5. Open a new SQL query window, paste or open the contents of `db/schema.sql`.
6. Run the SQL. The three tables will be created and visible in the sidebar.

### Optional: Run via psql (Windows PowerShell)

If you have the PostgreSQL CLI installed and a database ready:

```bash
psql "host=YOUR_HOST port=5432 dbname=aamira user=YOUR_USER password=YOUR_PASSWORD sslmode=prefer" -f db/schema.sql
```

Then reconnect in TablePlus and refresh the schema.

### Tables Overview

- `users(id BIGSERIAL, full_name, email UNIQUE, phone, address, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)`
- `products(id BIGSERIAL, name UNIQUE, sku UNIQUE, price NUMERIC(12,2), stock_quantity INTEGER, description, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)`
- `user_preferences(id BIGSERIAL, user_id REFERENCES users(id) ON DELETE CASCADE, preference_key, preference_value, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, UNIQUE(user_id, preference_key))`

### Notes

- Uses PostgreSQL types and defaults (e.g., `BIGSERIAL`, `TIMESTAMPTZ`, `now()`).

## REST API (Node.js + Express)

### Setup

1. Ensure PostgreSQL is running and the `aamira` database exists. Run `db/schema.sql` in TablePlus or via `psql`.
2. Create a `.env` file in the project root based on `.env.example`.
3. Install deps and start:

```bash
npm install
npm run start
```

API base URL: `http://localhost:3000/api/v1`

### Environment variables (`.env.example`)

```
PORT=3000
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=aamira
# PGSSL=require
```

### Endpoints (selected)

- Products

  - GET `/api/v1/products` (query: `page`, `pageSize`)
  - GET `/api/v1/products/:id`
  - POST `/api/v1/products` { name, sku, price, stock_quantity, description, category_id }
  - PUT `/api/v1/products/:id` partial update
  - DELETE `/api/v1/products/:id`

- Users

  - GET `/api/v1/users`
  - GET `/api/v1/users/:id`
  - POST `/api/v1/users` { full_name, email, phone?, address? }
  - PUT `/api/v1/users/:id` partial update
  - DELETE `/api/v1/users/:id`

- User Preferences

  - GET `/api/v1/preferences/:userId`
  - PUT `/api/v1/preferences/:userId/:key` { value }
  - DELETE `/api/v1/preferences/:userId/:key`

- Categories

  - GET `/api/v1/categories`
  - POST `/api/v1/categories` { name, slug, description? }
  - PUT `/api/v1/categories/:id`
  - DELETE `/api/v1/categories/:id`

- Orders
  - POST `/api/v1/orders` { user_id?, currency?, items: [{ product_id, quantity }] }
  - GET `/api/v1/orders/:id`
