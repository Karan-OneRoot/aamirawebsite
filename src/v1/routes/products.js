import { Router } from "express";
import { query } from "../../db/pool.js";
import {
  productCreateSchema,
  productUpdateSchema,
} from "../../validation/schemas.js";

export const productsRouter = Router();

productsRouter.get("/", async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const pageSize = Math.min(
    Math.max(parseInt(req.query.pageSize || "20", 10), 1),
    100
  );
  const offset = (page - 1) * pageSize;

  const { rows } = await query(
    `SELECT p.*, c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     ORDER BY p.id DESC
     LIMIT $1 OFFSET $2`,
    [pageSize, offset]
  );
  res.json({ page, pageSize, items: rows });
});

productsRouter.get("/:id", async (req, res) => {
  const { rows } = await query(
    `SELECT p.*, c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = $1`,
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

productsRouter.post("/", async (req, res) => {
  const parsed = productCreateSchema.safeParse({
    ...req.body,
    price: req.body?.price !== undefined ? Number(req.body.price) : undefined,
    stock_quantity:
      req.body?.stock_quantity !== undefined
        ? Number(req.body.stock_quantity)
        : undefined,
    category_id:
      req.body?.category_id !== undefined
        ? Number(req.body.category_id)
        : undefined,
  });
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.flatten() });
  const { name, sku, price, stock_quantity, description, category_id } =
    parsed.data;
  try {
    const { rows } = await query(
      `INSERT INTO products (name, sku, price, stock_quantity, description, category_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        name,
        sku,
        price ?? 0,
        stock_quantity ?? 0,
        description ?? null,
        category_id ?? null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

productsRouter.put("/:id", async (req, res) => {
  const parsed = productUpdateSchema.safeParse({
    ...req.body,
    price: req.body?.price !== undefined ? Number(req.body.price) : undefined,
    stock_quantity:
      req.body?.stock_quantity !== undefined
        ? Number(req.body.stock_quantity)
        : undefined,
    category_id:
      req.body?.category_id !== undefined
        ? Number(req.body.category_id)
        : undefined,
  });
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.flatten() });
  const { name, sku, price, stock_quantity, description, category_id } =
    parsed.data;
  try {
    const { rows } = await query(
      `UPDATE products SET
         name = COALESCE($2, name),
         sku = COALESCE($3, sku),
         price = COALESCE($4, price),
         stock_quantity = COALESCE($5, stock_quantity),
         description = COALESCE($6, description),
         category_id = COALESCE($7, category_id),
         updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [
        req.params.id,
        name ?? null,
        sku ?? null,
        price ?? null,
        stock_quantity ?? null,
        description ?? null,
        category_id ?? null,
      ]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

productsRouter.delete("/:id", async (req, res) => {
  const result = await query("DELETE FROM products WHERE id = $1", [
    req.params.id,
  ]);
  if (result.rowCount === 0)
    return res.status(404).json({ error: "Not found" });
  res.status(204).send();
});
