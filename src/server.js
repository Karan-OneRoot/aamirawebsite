import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import { router as apiRouter } from "./v1/routes.js";
import swaggerUi from "swagger-ui-express";
import openapi from "./docs/openapi.json" assert { type: "json" };

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1", apiRouter);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});
