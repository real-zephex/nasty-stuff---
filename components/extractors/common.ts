const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0",
};

interface rhe {
  status: boolean;
  html: string | null;
}

const RawHtmlExtractor = async ({ url }: { url: string }): Promise<rhe> => {
  const res = await fetch(url, { headers, method: "GET" });
  if (!res.ok) {
    console.error("Something happened here - 2 !");
    return {
      status: false,
      html: null,
    };
  }

  const text = await res.text();

  return {
    status: true,
    html: text,
  };
};

export default RawHtmlExtractor;
