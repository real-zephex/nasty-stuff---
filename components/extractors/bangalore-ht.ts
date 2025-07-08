import * as cheerio from "cheerio";
import RawHtmlExtractor from "./common";
import newsExtractor from "../gemini";

interface BNT {
  status: boolean;
  data: any | null;
}

const BangaloreNewsHT = async (): Promise<BNT> => {
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

  const combinedHorzCards = rawDataArr
    .map((rawData) => {
      const $ = cheerio.load(rawData.html!);
      return $("#dataHolder > div.cartHolder.listView").toString();
    })
    .join("");

  const structuredData = await newsExtractor({
    props: { rawText: combinedHorzCards },
  });

  return {
    status: true,
    data: structuredData,
  };
};

export default BangaloreNewsHT;
