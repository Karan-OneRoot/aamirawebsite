import { Router } from "express";
import { query } from "../../db/pool.js";

export const preferencesRouter = Router();

preferencesRouter.get("/:userId", async (req, res) => {
  const { rows } = await query(
    "SELECT preference_key, preference_value FROM user_preferences WHERE user_id = $1 ORDER BY preference_key",
    [req.params.userId]
  );
  res.json(rows);
});

preferencesRouter.put("/:userId/:key", async (req, res) => {
  const { userId, key } = req.params;
  const { value } = req.body;
  try {
    const { rows } = await query(
      `INSERT INTO user_preferences (user_id, preference_key, preference_value)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, preference_key)
       DO UPDATE SET preference_value = EXCLUDED.preference_value, updated_at = now()
       RETURNING id, user_id, preference_key, preference_value, created_at, updated_at`,
      [userId, key, value ?? null]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

preferencesRouter.delete("/:userId/:key", async (req, res) => {
  const result = await query(
    "DELETE FROM user_preferences WHERE user_id = $1 AND preference_key = $2",
    [req.params.userId, req.params.key]
  );
  if (result.rowCount === 0)
    return res.status(404).json({ error: "Not found" });
  res.status(204).send();
});
