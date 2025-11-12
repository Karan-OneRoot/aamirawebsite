import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "",
  database: process.env.PGDATABASE || "aamira",
  ssl:
    process.env.PGSSL === "require" ? { rejectUnauthorized: false } : undefined,
});

export const query = (text, params) => pool.query(text, params);
