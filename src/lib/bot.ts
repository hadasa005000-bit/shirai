import { db } from "@/lib/db";
import slugify from "slugify";

const YT_API_BASE = "https://www.googleapis.com/youtube/v3";

type YouTubeVideo = {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
};

async function fetchChannelUploads(channelId: string, apiKey: string): Promise<YouTubeVideo[]> {
  const searchUrl = `${YT_API_BASE}/search?key=${apiKey}&channelId=${channelId}&part=snippet&order=date&maxResults=10&type=video`;
  const res = await fetch(searchUrl);
  if (!res.ok) throw new Error(`YouTube API error (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return (data.items ?? []).map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
  }));
}

async function fetchSearchResults(query: string, apiKey: string): Promise<YouTubeVideo[]> {
  const searchUrl = `${YT_API_BASE}/search?key=${apiKey}&q=${encodeURIComponent(
    query
  )}&part=snippet&order=date&maxResults=10&type=video`;
  const res = await fetch(searchUrl);
  if (!res.ok) throw new Error(`YouTube API error (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return (data.items ?? []).map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
  }));
}

async function resolveArtist(name: string) {
  const existing = await db.artist.findUnique({ where: { name } });
  if (existing) return existing.id;
  const created = await db.artist.create({
    data: { name, slug: slugify(name, { lower: true, strict: true }) + "-" + Date.now().toString(36) },
  });
  return created.id;
}

export async function runBot() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const log = await db.botRunLog.create({ data: {} });
  let found = 0;
  let added = 0;
  const errors: string[] = [];

  if (!apiKey) {
    errors.push("YOUTUBE_API_KEY לא מוגדר בסביבה — אין אפשרות לסרוק.");
    await db.botRunLog.update({
      where: { id: log.id },
      data: { finishedAt: new Date(), found, added, errors: errors.join(" | ") },
    });
    return { found, added, errors };
  }

  const sources = await db.botSource.findMany({ where: { active: true } });

  for (const source of sources) {
    try {
      const videos =
        source.type === "youtube_channel"
          ? await fetchChannelUploads(source.value, apiKey)
          : await fetchSearchResults(source.value, apiKey);

      found += videos.length;

      for (const video of videos) {
        const existing = await db.song.findFirst({ where: { youtubeId: video.videoId } });
        if (existing) continue;

        const artistId = await resolveArtist(video.channelTitle);

        await db.song.create({
          data: {
            title: video.title,
            artistId,
            categoryId: source.defaultCategoryId,
            youtubeId: video.videoId,
            status: "PENDING",
            source: "bot",
            sourceUrl: `https://youtube.com/watch?v=${video.videoId}`,
          },
        });
        added += 1;
      }

      await db.botSource.update({ where: { id: source.id }, data: { lastRunAt: new Date() } });
    } catch (err: any) {
      errors.push(`${source.label}: ${err.message}`);
    }
  }

  await db.botRunLog.update({
    where: { id: log.id },
    data: { finishedAt: new Date(), found, added, errors: errors.join(" | ") || null },
  });

  return { found, added, errors };
}
