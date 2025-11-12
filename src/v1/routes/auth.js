import { Router } from "express";
import { query } from "../../db/pool.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { registerSchema, loginSchema } from "../../validation/schemas.js";

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.flatten() });
  const { full_name, email, password, phone, address } = parsed.data;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (full_name, email, password_hash, phone, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, phone, address, created_at`,
      [full_name, email, passwordHash, phone ?? null, address ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password } = parsed.data;
  const { rows } = await query(
    "SELECT id, full_name, email, password_hash FROM users WHERE email = $1",
    [email]
  );
  if (rows.length === 0)
    return res.status(401).json({ error: "invalid credentials" });

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash || "");
  if (!ok) return res.status(401).json({ error: "invalid credentials" });

  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  res.json({
    token,
    user: { id: user.id, full_name: user.full_name, email: user.email },
  });
});
