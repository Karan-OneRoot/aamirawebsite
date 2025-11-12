-- PostgreSQL schema: users, products, user_preferences

-- Users table: stores user accounts
CREATE TABLE IF NOT EXISTS users (
	id BIGSERIAL PRIMARY KEY,
	full_name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	password_hash TEXT,
	phone TEXT,
	address TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Products table: stores product catalog and stock
CREATE TABLE IF NOT EXISTS products (
	id BIGSERIAL PRIMARY KEY,
	name TEXT NOT NULL UNIQUE,
	sku TEXT NOT NULL UNIQUE,
	price NUMERIC(12,2) NOT NULL DEFAULT 0,
	stock_quantity INTEGER NOT NULL DEFAULT 0,
	description TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- User preferences: arbitrary key/value preferences per user
CREATE TABLE IF NOT EXISTS user_preferences (
	id BIGSERIAL PRIMARY KEY,
	user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	preference_key TEXT NOT NULL,
	preference_value TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ,
	UNIQUE(user_id, preference_key)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON user_preferences(preference_key);

-- Categories: product taxonomy
CREATE TABLE IF NOT EXISTS categories (
	id BIGSERIAL PRIMARY KEY,
	name TEXT NOT NULL UNIQUE,
	slug TEXT NOT NULL UNIQUE,
	description TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ
);

-- Add optional category to products (simple 1:N). If you prefer M:N, use a join table below.
ALTER TABLE products
	ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Orders and order items
CREATE TABLE IF NOT EXISTS orders (
	id BIGSERIAL PRIMARY KEY,
	user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
	status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, shipped, cancelled
	subtotal_cents BIGINT NOT NULL DEFAULT 0,
	tax_cents BIGINT NOT NULL DEFAULT 0,
	shipping_cents BIGINT NOT NULL DEFAULT 0,
	total_cents BIGINT NOT NULL DEFAULT 0,
	currency TEXT NOT NULL DEFAULT 'USD',
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
	id BIGSERIAL PRIMARY KEY,
	order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
	product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
	quantity INTEGER NOT NULL CHECK (quantity > 0),
	unit_price_cents BIGINT NOT NULL CHECK (unit_price_cents >= 0),
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);


