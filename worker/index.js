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

    // ── Proxy mode: stream media back with download headers ──
    if (isProxy && instaUrl) {
      try {
        const mediaRes = await fetch(instaUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Referer": "https://www.instagram.com/",
          }
        });
        const responseHeaders = new Headers(mediaRes.headers);
        responseHeaders.set("Access-Control-Allow-Origin", "*");
        if (instaUrl.includes(".mp4") || mediaRes.headers.get("Content-Type")?.includes("video")) {
          responseHeaders.set("Content-Disposition", `attachment; filename="instagram-video-${Date.now()}.mp4"`);
        }
        return new Response(mediaRes.body, { status: mediaRes.status, headers: responseHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Proxy failed: " + e.message }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    if (!instaUrl) {
      return new Response(
        JSON.stringify({ error: "Instagram URL required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanUrl = instaUrl.split("?")[0].replace(/\/$/, "");

    let video = "";
    let thumbnail = "";
    const errors = [];

    // ── Strategy 1: RapidAPI Instagram Downloader (instagram-downloader-download-videos-reels-stories4.p.rapidapi.com) ──
    try {
      const r = await fetch(
        `https://social-media-video-downloader.p.rapidapi.com/smvd/get/all?url=${encodeURIComponent(cleanUrl)}`,
        {
          headers: {
            "X-RapidAPI-Key": "a0186d2de0msh9b3d0cbdb87b1fdp1c96d9jsna43ed7e06bdc",
            "X-RapidAPI-Host": "social-media-video-downloader.p.rapidapi.com",
          },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (r.ok) {
        const d = await r.json();
        const links = d?.links || [];
        const mp4 = links.find(l => l.type === "mp4" || (l.url && l.url.includes(".mp4")));
        if (mp4?.url) { video = mp4.url; thumbnail = d?.picture || ""; }
      } else {
        errors.push("Strategy1 HTTP " + r.status);
      }
    } catch (e) { errors.push("Strategy1: " + e.message); }

    // ── Strategy 2: SaveFrom / SnapSave style API ──
    if (!video) {
      try {
        const r = await fetch(
          `https://instagram-downloader-download-videos-reels-stories4.p.rapidapi.com/fetch/?url=${encodeURIComponent(cleanUrl)}`,
          {
            headers: {
              "X-RapidAPI-Key": "a0186d2de0msh9b3d0cbdb87b1fdp1c96d9jsna43ed7e06bdc",
              "X-RapidAPI-Host": "instagram-downloader-download-videos-reels-stories4.p.rapidapi.com",
            },
            signal: AbortSignal.timeout(8000),
          }
        );
        if (r.ok) {
          const d = await r.json();
          if (d?.video_url) { video = d.video_url; thumbnail = d?.thumbnail_url || ""; }
          else if (d?.url) { video = d.url; thumbnail = d?.thumbnail || ""; }
        } else {
          errors.push("Strategy2 HTTP " + r.status);
        }
      } catch (e) { errors.push("Strategy2: " + e.message); }
    }

    // ── Strategy 3: Insta-Downloader via RapidAPI ──
    if (!video) {
      try {
        const r = await fetch(
          `https://instagram-downloader2.p.rapidapi.com/download?url=${encodeURIComponent(cleanUrl)}`,
          {
            headers: {
              "X-RapidAPI-Key": "a0186d2de0msh9b3d0cbdb87b1fdp1c96d9jsna43ed7e06bdc",
              "X-RapidAPI-Host": "instagram-downloader2.p.rapidapi.com",
            },
            signal: AbortSignal.timeout(8000),
          }
        );
        if (r.ok) {
          const d = await r.json();
          if (d?.data?.url) { video = d.data.url; thumbnail = d?.data?.thumbnail || ""; }
          else if (Array.isArray(d?.data)) {
            const item = d.data.find(x => x.type === "video" || x.url?.includes(".mp4"));
            if (item?.url) { video = item.url; thumbnail = item.thumbnail || ""; }
          }
        } else {
          errors.push("Strategy3 HTTP " + r.status);
        }
      } catch (e) { errors.push("Strategy3: " + e.message); }
    }

    // ── Strategy 4: SnapInsta / SaveInsta public API ──
    if (!video) {
      try {
        const r = await fetch("https://snapinsta.io/api/ajaxSearch", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://snapinsta.io/",
            "Origin": "https://snapinsta.io",
          },
          body: `q=${encodeURIComponent(cleanUrl)}&t=media&lang=en`,
          signal: AbortSignal.timeout(8000),
        });
        if (r.ok) {
          const d = await r.json();
          if (d?.data) {
            // Parse HTML response to extract video URL
            const urlMatch = d.data.match(/href="(https[^"]+\.mp4[^"]*?)"/);
            if (urlMatch?.[1]) { video = urlMatch[1].replace(/&amp;/g, "&"); }
            const thumbMatch = d.data.match(/src="(https[^"]+\.(jpg|jpeg|webp)[^"]*?)"/);
            if (thumbMatch?.[1]) { thumbnail = thumbMatch[1].replace(/&amp;/g, "&"); }
          }
        } else {
          errors.push("Strategy4 HTTP " + r.status);
        }
      } catch (e) { errors.push("Strategy4: " + e.message); }
    }

    // ── Strategy 5: SaveVideo.me API ──
    if (!video) {
      try {
        const r = await fetch(`https://savevideo.me/api/?url=${encodeURIComponent(cleanUrl)}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Referer": "https://savevideo.me/",
          },
          signal: AbortSignal.timeout(8000),
        });
        if (r.ok) {
          const text = await r.text();
          const videoMatch = text.match(/"url":"(https[^"]+\.mp4[^"]*)"/);
          if (videoMatch?.[1]) { video = videoMatch[1].replace(/\\u0026/g, "&").replace(/\\/g, ""); }
        } else {
          errors.push("Strategy5 HTTP " + r.status);
        }
      } catch (e) { errors.push("Strategy5: " + e.message); }
    }

    // ── Strategy 6: Instagram Embed (fallback, may work for some regions) ──
    if (!video) {
      try {
        const embedUrl = `${cleanUrl}/embed/captioned/?cr=1&v=12&wp=1080`;
        const r = await fetch(embedUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.instagram.com/",
          },
          signal: AbortSignal.timeout(8000),
        });
        if (r.ok) {
          const html = await r.text();
          const videoPatterns = [
            /"video_url":"(https[^"]+)"/,
            /"playable_url":"(https[^"]+)"/,
            /"contentUrl":"(https[^"]+)"/,
            /videoSrc\s*=\s*"(https[^"]+)"/,
          ];
          for (const pat of videoPatterns) {
            const m = html.match(pat);
            if (m?.[1]) {
              video = m[1].replace(/\\u0026/g, "&").replace(/\\/g, "");
              if (video.includes(".mp4")) break;
            }
          }
          if (!thumbnail) {
            const tMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
            if (tMatch?.[1]) thumbnail = tMatch[1];
          }
        } else {
          errors.push("Strategy6 HTTP " + r.status);
        }
      } catch (e) { errors.push("Strategy6: " + e.message); }
    }

    // ── Response ──
    if (!video) {
      return new Response(JSON.stringify({
        success: false,
        error: "Could not extract media. Instagram may have blocked all routes. Try again in a minute.",
        debug: errors.join(" | "),
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      video: video.replace(/\\u0026/g, "&").replace(/\\/g, ""),
      thumbnail: (thumbnail || "").replace(/\\u0026/g, "&").replace(/\\/g, ""),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  },
};
