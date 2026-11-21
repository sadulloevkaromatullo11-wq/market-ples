-- Дукон marketplace — схемаи PostgreSQL.
-- Агар DATABASE_URL бошад, сервер ҷадвали app_state-ро худаш месозад
-- ва тамоми ҳолати барномаро дар як сатри JSONB нигоҳ медорад.
-- Ҷадвалҳои поёнӣ модели муносибатии ояндаанд.

CREATE TABLE IF NOT EXISTS app_state (
  id          INTEGER PRIMARY KEY,
  data        JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  telegram_id   BIGINT UNIQUE,
  first_name    TEXT NOT NULL,
  last_name     TEXT DEFAULT '',
  username      TEXT,
  photo         TEXT,
  phone         TEXT DEFAULT '',
  role          TEXT NOT NULL CHECK (role IN ('buyer', 'vendor', 'admin')),
  status        TEXT NOT NULL CHECK (status IN ('active', 'blocked')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vendors (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  shop_name     TEXT NOT NULL,
  description   TEXT DEFAULT '',
  status        TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'blocked')),
  commission    NUMERIC(5,4) NOT NULL DEFAULT 0.08,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  parent_id   INTEGER REFERENCES categories(id),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT
);

CREATE TABLE products (
  id              SERIAL PRIMARY KEY,
  vendor_id       INTEGER NOT NULL REFERENCES vendors(id),
  category_id     INTEGER NOT NULL REFERENCES categories(id),
  name            TEXT NOT NULL,
  description     TEXT DEFAULT '',
  price           NUMERIC(12,2) NOT NULL,
  discount_price  NUMERIC(12,2),
  stock           INTEGER NOT NULL DEFAULT 0,
  images          JSONB NOT NULL DEFAULT '[]',
  attributes      JSONB NOT NULL DEFAULT '[]',
  emoji           TEXT,
  hue             TEXT,
  featured        BOOLEAN NOT NULL DEFAULT false,
  status          TEXT NOT NULL CHECK (status IN ('pending', 'published', 'rejected', 'archived')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reviews (
  id          SERIAL PRIMARY KEY,
  product_id  INTEGER NOT NULL REFERENCES products(id),
  user_id     INTEGER NOT NULL REFERENCES users(id),
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text        TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);

CREATE TABLE addresses (
  id        SERIAL PRIMARY KEY,
  user_id   INTEGER NOT NULL REFERENCES users(id),
  district  TEXT NOT NULL,
  text      TEXT NOT NULL,
  lat       DOUBLE PRECISION,
  lng       DOUBLE PRECISION
);

CREATE TABLE orders (
  id              INTEGER PRIMARY KEY,
  group_id        TEXT NOT NULL,
  user_id         INTEGER NOT NULL REFERENCES users(id),
  vendor_id       INTEGER NOT NULL REFERENCES vendors(id),
  status          TEXT NOT NULL CHECK (status IN ('processing', 'shipping', 'delivered', 'cancelled')),
  payment_method  TEXT NOT NULL CHECK (payment_method IN ('cash', 'card')),
  payment_status  TEXT NOT NULL CHECK (payment_status IN ('unpaid', 'paid', 'cod')),
  card_last4      TEXT,
  address         JSONB NOT NULL,
  items           JSONB NOT NULL,
  subtotal        NUMERIC(12,2) NOT NULL,
  delivery        NUMERIC(12,2) NOT NULL,
  commission      NUMERIC(12,2) NOT NULL,
  total           NUMERIC(12,2) NOT NULL,
  note            TEXT DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX orders_user_idx ON orders(user_id);
CREATE INDEX orders_vendor_idx ON orders(vendor_id);
CREATE INDEX products_status_idx ON products(status);

CREATE TABLE notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE banners (
  id        SERIAL PRIMARY KEY,
  title     TEXT NOT NULL,
  subtitle  TEXT,
  tone      TEXT,
  href      TEXT
);
