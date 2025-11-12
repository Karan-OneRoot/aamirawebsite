import { Router } from "express";
import { query } from "../../db/pool.js";
import { requireAuth } from "../../middleware/auth.js";

export const ordersRouter = Router();

// Create order with items; expects items: [{ product_id, quantity }]
ordersRouter.post("/", requireAuth, async (req, res) => {
  const client = await (await import("../../db/pool.js")).pool.connect();
  try {
    const { user_id, items, currency } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "items is required and must be non-empty" });
    }

    await client.query("BEGIN");

    // Fetch product prices
    const ids = items.map((i) => i.product_id);
    const { rows: products } = await client.query(
      `SELECT id, price FROM products WHERE id = ANY($1::bigint[])`,
      [ids]
    );
    const productMap = new Map(products.map((p) => [String(p.id), p]));

    let subtotalCents = 0;
    const normalizedItems = items.map((i) => {
      const p = productMap.get(String(i.product_id));
      if (!p) throw new Error(`Product ${i.product_id} not found`);
      const unitPriceCents = Math.round(Number(p.price) * 100);
      const quantity = Math.max(1, Number(i.quantity || 1));
      subtotalCents += unitPriceCents * quantity;
      return {
        product_id: i.product_id,
        quantity,
        unit_price_cents: unitPriceCents,
      };
    });

    const taxCents = Math.round(subtotalCents * 0.1); // 10% example
    const shippingCents = 0;
    const totalCents = subtotalCents + taxCents + shippingCents;

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (user_id, status, subtotal_cents, tax_cents, shipping_cents, total_cents, currency)
       VALUES ($1, 'pending', $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        user_id ?? null,
        subtotalCents,
        taxCents,
        shippingCents,
        totalCents,
        currency || "USD",
      ]
    );
    const order = orderRows[0];

    for (const item of normalizedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.product_id, item.quantity, item.unit_price_cents]
      );
      // decrement stock
      await client.query(
        `UPDATE products SET stock_quantity = stock_quantity - $2, updated_at = now() WHERE id = $1`,
        [item.product_id, item.quantity]
      );
    }

    await client.query("COMMIT");
    res.status(201).json(order);
  } catch (e) {
    await (async () => {
      try {
        await client.query("ROLLBACK");
      } catch {}
    })();
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

ordersRouter.get("/:id", async (req, res) => {
  const { rows } = await query("SELECT * FROM orders WHERE id = $1", [
    req.params.id,
  ]);
  if (rows.length === 0) return res.status(404).json({ error: "Not found" });
  const order = rows[0];
  const { rows: items } = await query(
    `SELECT oi.*, p.name, p.sku
     FROM order_items oi JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1
     ORDER BY oi.id`,
    [req.params.id]
  );
  res.json({ ...order, items });
});
