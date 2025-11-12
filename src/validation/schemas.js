import { z } from "zod";

export const registerSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const productCreateSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  price: z.number().nonnegative().default(0),
  stock_quantity: z.number().int().nonnegative().default(0),
  description: z.string().optional(),
  category_id: z.number().int().positive().optional(),
});

export const productUpdateSchema = productCreateSchema.partial();
