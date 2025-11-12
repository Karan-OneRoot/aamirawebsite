import { Router } from "express";
import { query } from "../../db/pool.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (_req, res) => {
  const { rows } = await query("SELECT * FROM categories ORDER BY id DESC");
  res.json(rows);
});

categoriesRouter.post("/", async (req, res) => {
  const { name, slug, description } = req.body;
  try {
    const { rows } = await query(
      "INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) RETURNING *",
      [name, slug, description ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

categoriesRouter.put("/:id", async (req, res) => {
  const { name, slug, description } = req.body;
  try {
    const { rows } = await query(
      `UPDATE categories SET
         name = COALESCE($2, name),
         slug = COALESCE($3, slug),
         description = COALESCE($4, description),
         updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [req.params.id, name ?? null, slug ?? null, description ?? null]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

categoriesRouter.delete("/:id", async (req, res) => {
  const result = await query("DELETE FROM categories WHERE id = $1", [
    req.params.id,
  ]);
  if (result.rowCount === 0)
    return res.status(404).json({ error: "Not found" });
  res.status(204).send();
});
