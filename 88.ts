export default {
  async fetch(request: Request): Promise<Response> {
    try {
      const { searchParams } = new URL(request.url);
      const inputUrl = searchParams.get("url");

      if (!inputUrl) {
        return new Response("❌ 缺少 url 参数", { status: 400 });
      }

      const videoId = await extractVideoId(inputUrl);
      const downloadUrl = await getOriginalVideoUrl(videoId);

      return new Response(downloadUrl);
    } catch (err: any) {
      return new Response("❌ 解析失败：" + err.message, { status: 500 });
    }
  },
};

// 提取视频 ID：支持分享链接和短链
async function extractVideoId(inputUrl: string): Promise<string> {
  if (/video\/(\d+)/.test(inputUrl)) {
    const match = inputUrl.match(/video\/(\d+)/);
    if (match) return match[1];
  }

  // 短链跳转，提取 ID
  const resp = await fetch(inputUrl, {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    },
  });

  const html = await resp.text();
  const match = html.match(/video\/(\d{10,20})/);
  if (!match) throw new Error("无法提取视频 ID");
  return match[1];
}

// 通过官方接口获取原画下载链接
async function getOriginalVideoUrl(videoId: string): Promise<string> {
  const apiUrl = `https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids=${videoId}`;
  const resp = await fetch(apiUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    },
  });

  const json = await resp.json();
  const urlList =
    json?.item_list?.[0]?.video?.download_addr?.url_list;

  if (!urlList || urlList.length === 0) {
    throw new Error("无法获取原画链接");
  }

  return urlList[0]; // 原画地址
}
