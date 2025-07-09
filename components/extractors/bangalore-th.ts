import * as cheerio from "cheerio";
import RawHtmlExtractor from "./common";
import newsExtractor from "../gemini";
import { BN, NewsOBJ } from "../types";

const BangaloreNewsTH = async (): Promise<BN> => {
  const urls = [
    "https://www.thehindu.com/news/cities/bangalore/",
    "https://www.thehindu.com/news/cities/bangalore/?page=2",
  ];

  const rawDataArr = await Promise.all(
    urls.map((url) => RawHtmlExtractor({ url }))
  );

  if (rawDataArr.some((rawData) => !rawData.status || !rawData.html)) {
    console.error("Failed to fetch news from The Hindu - bangalore-th.ts");
    return {
      status: false,
      data: null,
    };
  }

  const horzCardsArr = await Promise.all(
    rawDataArr.map(async (el) => await idsFetcher(el.html!))
  );

  // Format the news array into text that can be processed by the news extractor
  const formattedText = horzCardsArr
    .flat()
    .map((article) => {
      if (!article.title) return "";
      return `Title: ${article.title}\nPublished: ${
        article.publishTime || "N/A"
      }\n${article.description || ""}\n---\n`;
    })
    .join("\n");

  const structuredData: NewsOBJ[] = await newsExtractor({
    props: { rawText: formattedText },
  });

  return {
    status: true,
    data: structuredData,
  };
};

const idsFetcher = async (raw_html: string) => {
  const $ = cheerio.load(raw_html);
  const cards = $(
    "div.container > div.row > div.result > div.element.row-element"
  );
  const items: { id: string | undefined; title: string }[] = [];
  cards.each((idx, card) => {
    const id = $(card).find("a").attr("href");
    const title = $(card)
      .find("div.right-content > h3.title.big > a")
      .text()
      .trim();
    items.push({ id, title });
  });

  const rawNewsArray = await Promise.all(
    items.map(async (el) => {
      const res = await RawHtmlExtractor({ url: el.id! });
      if (!res.status || !res.html) {
        return {};
      }

      const $ = cheerio.load(res.html);
      const newsBlock = $("div.container > div.row > div.storyline");

      const title = $(newsBlock).find("h1.title").text().trim();
      const publishTime = $(newsBlock).find("div.update-publish-time").text();
      const description = $(newsBlock)
        .find("div.articlebodycontent > #schemaDiv")
        .text();

      return {
        title,
        publishTime,
        description,
      };
    })
  );

  return rawNewsArray;
};

export default BangaloreNewsTH;
