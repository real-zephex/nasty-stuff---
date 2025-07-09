import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import BangaloreNewsHT from "../components/extractors/bangalore-ht";
import BangaloreNewsTH from "../components/extractors/bangalore-th";
import newsExtractor from "../components/gemini";

export const config = {
  runtime: "edge",
};

const app = new Hono().basePath("/api");
app.use(logger(), cors());

app.get("/", async (c) => {
  const ht_content = await BangaloreNewsHT();
  const th_content = await BangaloreNewsTH();

  const content = JSON.stringify(ht_content) + JSON.stringify(th_content);
  const finalNews = await newsExtractor({
    props: {
      rawText: content,
    },
  });

  return c.json(finalNews);
});

export default handle(app);
