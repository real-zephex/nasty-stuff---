import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import BangaloreNewsHT from "../components/extractors/bangalore-ht";

export const config = {
  runtime: "edge",
};

const app = new Hono().basePath("/api");
app.use(logger(), cors());

app.get("/", async (c) => {
  const content = await BangaloreNewsHT();
  return c.json(content);
});

export default handle(app);
