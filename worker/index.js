import * as cheerio from "cheerio";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    let instaUrl = url.searchParams.get("url");
    const isProxy = url.searchParams.get("proxy") === "true";

    if (isProxy && instaUrl) {
      const mediaRes = await fetch(instaUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Referer": "https://www.instagram.com/",
        }
      });
      
      const responseHeaders = new Headers(mediaRes.headers);
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      
      // If it's a video, force download
      if (instaUrl.includes(".mp4") || mediaRes.headers.get("Content-Type")?.includes("video")) {
        responseHeaders.set("Content-Disposition", `attachment; filename="instagram-video-${Date.now()}.mp4"`);
      }

      return new Response(mediaRes.body, {
        status: mediaRes.status,
        headers: responseHeaders,
      });
    }

    if (!instaUrl) {
      return new Response(
        JSON.stringify({ error: "Instagram URL required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const cleanUrl = instaUrl.split("?")[0].replace(/\/$/, "");
      const shortcode = extractShortcode(cleanUrl);

      if (!shortcode) {
        throw new Error("Invalid Instagram URL. Please provide a post or reel link.");
      }

      let video = "";
      let thumbnail = "";

      const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1"
      ];
      const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

      const fetchIG = (url, extraHeaders = {}) => fetch(url, {
        headers: {
          "User-Agent": randomUA,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
          "Referer": "https://www.instagram.com/",
          ...extraHeaders
        }
      });

      // Strategy 1: Embed Page (Most reliable for videos)
      try {
        const embedUrl = `${cleanUrl}/embed/captioned/?cr=1&v=12&wp=1080`;
        const eRes = await fetchIG(embedUrl);
        if (eRes.ok) {
          const html = await eRes.text();
          const { v, t } = parseHtml(html);
          if (v) video = v;
          if (t) thumbnail = t;
        }
      } catch (e) { console.error("Embed Strategy failed"); }

      // Strategy 2: GraphQL / API v1 (If embed fails)
      if (!video) {
        try {
          const mediaId = shortcodeToId(shortcode);
          const aRes = await fetchIG(`https://www.instagram.com/api/v1/media/${mediaId}/info/`, {
            "X-IG-App-ID": "936619743392459",
            "X-Requested-With": "XMLHttpRequest"
          });
          if (aRes.ok) {
            const aData = await aRes.json();
            const item = aData?.items?.[0];
            if (item) {
              video = item.video_versions?.[0]?.url || "";
              thumbnail = item.image_versions2?.candidates?.[0]?.url || thumbnail;
            }
          }
        } catch (e) { console.error("API v1 Strategy failed"); }
      }

      // Strategy 3: Scrape Main Page
      if (!video) {
        try {
          const pRes = await fetchIG(cleanUrl);
          if (pRes.ok) {
            const html = await pRes.text();
            const { v, t } = parseHtml(html);
            if (v) video = v;
            if (t && !thumbnail) thumbnail = t;
          }
        } catch (e) { console.error("Scrape Strategy failed"); }
      }

      if (!video && !thumbnail) {
        throw new Error("Could not extract media. The post might be private or restricted.");
      }

      return new Response(JSON.stringify({ 
        success: true,
        video: video.replace(/\\u0026/g, "&").replace(/\\/g, ""), 
        thumbnail: thumbnail.replace(/\\u0026/g, "&").replace(/\\/g, "") 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};

function extractShortcode(url) {
  const m = url.match(/(?:reel|p|tv|reels)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

function shortcodeToId(shortcode) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let id = BigInt(0);
  for (const char of shortcode) {
    id = id * BigInt(64) + BigInt(alphabet.indexOf(char));
  }
  return id.toString();
}

function parseHtml(html) {
  let video = "";
  let thumbnail = "";
  
  // Strategy A: Direct Regex Search (Fastest)
  const videoPatterns = [
    /"video_url":"(https[^"]+)"/,
    /video_url\\":\\"(https[^"]+)\\"/,
    /"playable_url":"(https[^"]+)"/,
    /playable_url\\":\\"(https[^"]+)\\"/,
    /"contentUrl":"(https[^"]+)"/,
    /videoSrc\s*=\s*"(https[^"]+)"/,
    /\"video_url\"\:\"(.*?)\"/
  ];

  for (const pat of videoPatterns) {
    const match = html.match(pat);
    if (match && match[1]) {
      video = match[1].replace(/\\u0026/g, "&").replace(/\\/g, "");
      if (video.includes(".mp4")) break;
    }
  }

  // Strategy B: Script Tag Analysis (Most reliable)
  if (!video) {
    const $ = cheerio.load(html);
    $("script").each((_, script) => {
      const content = $(script).html();
      if (!content) return;

      // Look for JSON objects containing media info
      if (content.includes("video_url") || content.includes("playable_url")) {
        const vMatch = content.match(/"video_url":"(https:[^"]+)"/);
        if (vMatch && vMatch[1]) {
          video = vMatch[1].replace(/\\u0026/g, "&").replace(/\\/g, "");
        }
      }
    });
  }

  const $ = cheerio.load(html);
  if (!video) {
    video = $('meta[property="og:video"]').attr("content") ||
            $('meta[property="og:video:secure_url"]').attr("content") ||
            $('meta[name="twitter:player:stream"]').attr("content") || "";
  }

  thumbnail = $('meta[property="og:image"]').attr("content") ||
              $('meta[name="twitter:image"]').attr("content") ||
              $('meta[property="og:image:secure_url"]').attr("content") || "";

  return { 
    v: video.replace(/\\u0026/g, "&").replace(/\\/g, ""), 
    t: thumbnail.replace(/\\u0026/g, "&").replace(/\\/g, "") 
  };
}
