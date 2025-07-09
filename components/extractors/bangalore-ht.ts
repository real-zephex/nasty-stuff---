import * as cheerio from "cheerio";
import RawHtmlExtractor from "./common";
import newsExtractor from "../gemini";
import { BN, HTnewsInformation, NewsOBJ } from "../types";

const BangaloreNewsHT = async (): Promise<BN> => {
  const urls = [
    "https://www.hindustantimes.com/cities/bengaluru-news/page-1",
    "https://www.hindustantimes.com/cities/bengaluru-news/page-2",
  ];

  const rawDataArr = await Promise.all(
    urls.map((url) => RawHtmlExtractor({ url }))
  );

  if (rawDataArr.some((rawData) => !rawData.status || !rawData.html)) {
    console.error("Something happened here !");
    return {
      status: false,
      data: null,
    };
  }

  const horzCardsArr = await Promise.all(
    rawDataArr.map(async (el) => await idsFetcher(el.html!))
  );

  const formattedText = horzCardsArr
    .flat()
    .map((article) => {
      if (!article.title) return "";
      return `Title: ${article.title}\nPublished: ${article.date || "N/A"}\n${
        article.description || ""
      }\n---\n`;
    })
    .join("\n");

  // const combinedHorzCards = rawDataArr
  //   .map((rawData) => {
  //     const $ = cheerio.load(rawData.html!);
  //     return $("#dataHolder > div.cartHolder.listView").toString();
  //   })
  //   .join("");

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
  const cards = $("#dataHolder > div.cartHolder.listView.track.timeAgo");

  const items: { id: string | undefined; title: string; data_id: string }[] =
    [];

  cards.each((idx, card) => {
    const id = $(card).find("a.storyLink").attr("href");
    const title = $(card).find("h3.hdg3 > a").text().trim();
    const data_id = $(card).find("h3.hdg3 > a").attr("data-articleid")!;
    items.push({ id, title, data_id });
  });

  const rawNewsArray = await Promise.all(
    items.map(async (el) => {
      const res = await fetch(
        `https://goodproxy.goodproxy.workers.dev/fetch?url=https://api.hindustantimes.com/api/app/detailfeed/v1/${el.data_id}`
      );
      if (!res.ok) {
        return {};
      }
      const data: HTnewsInformation = await res.json();
      return {
        title: data.content.sectionItems.headLine,
        city: data.content.sectionItems.city,
        date: data.content.sectionItems.publishedDate,
        description: data.content.sectionItems.storyText,
        keywords: data.content.sectionItems.keywords,
      };
    })
  );

  return rawNewsArray;
};
export default BangaloreNewsHT;
