import { Router } from "express";
import { productsRouter } from "./routes/products.js";
import { usersRouter } from "./routes/users.js";
import { preferencesRouter } from "./routes/preferences.js";
import { categoriesRouter } from "./routes/categories.js";
import { ordersRouter } from "./routes/orders.js";
import { authRouter } from "./routes/auth.js";

export const router = Router();

router.use("/products", productsRouter);
router.use("/users", usersRouter);
router.use("/preferences", preferencesRouter);
router.use("/categories", categoriesRouter);
router.use("/orders", ordersRouter);
router.use("/auth", authRouter);
