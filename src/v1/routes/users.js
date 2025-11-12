import { Router } from "express";
import { query } from "../../db/pool.js";

export const usersRouter = Router();

usersRouter.get("/", async (_req, res) => {
  const { rows } = await query(
    "SELECT id, full_name, email, phone, address, created_at, updated_at FROM users ORDER BY id DESC"
  );
  res.json(rows);
});

usersRouter.get("/:id", async (req, res) => {
  const { rows } = await query(
    "SELECT id, full_name, email, phone, address, created_at, updated_at FROM users WHERE id = $1",
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

usersRouter.post("/", async (req, res) => {
  const { full_name, email, phone, address } = req.body;
  try {
    const { rows } = await query(
      "INSERT INTO users (full_name, email, phone, address) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, phone, address, created_at, updated_at",
      [full_name, email, phone ?? null, address ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

usersRouter.put("/:id", async (req, res) => {
  const { full_name, email, phone, address } = req.body;
  try {
    const { rows } = await query(
      `UPDATE users SET
         full_name = COALESCE($2, full_name),
         email = COALESCE($3, email),
         phone = COALESCE($4, phone),
         address = COALESCE($5, address),
         updated_at = now()
       WHERE id = $1
       RETURNING id, full_name, email, phone, address, created_at, updated_at`,
      [
        req.params.id,
        full_name ?? null,
        email ?? null,
        phone ?? null,
        address ?? null,
      ]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

usersRouter.delete("/:id", async (req, res) => {
  const result = await query("DELETE FROM users WHERE id = $1", [
    req.params.id,
  ]);
  if (result.rowCount === 0)
    return res.status(404).json({ error: "Not found" });
  res.status(204).send();
});
