import { db } from "@/lib/db";
import slugify from "slugify";
import { classifySlug, normalizeTitle } from "@/lib/classify";

const YT_API_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * תבנית קישור ההורדה האוטומטי כשלא נמצא קישור דרייב בתיאור הסרטון.
 * אפשר לשנות דרך משתנה הסביבה DOWNLOAD_LINK_TEMPLATE (המקום של מזהה
 * הסרטון מסומן ב-{id}).
 */
const DOWNLOAD_TEMPLATE =
  process.env.DOWNLOAD_LINK_TEMPLATE || "https://www.ssyoutube.com/watch?v={id}";

/** האם הבוט מפרסם ישר לאתר או שולח לאישור מנהל — נשלט מהדשבורד (/admin/bot). */
async function getAutoPublish(): Promise<boolean> {
  const settings = await db.appSettings.findUnique({ where: { id: "singleton" } });
  if (settings) return settings.botAutoPublish;
  // עד שמישהו ישמור הגדרה מהדשבורד, ברירת המחדל הבטוחה היא "לא לפרסם לבד"
  return false;
}

type YouTubeVideo = {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  description: string;
};

function mapItems(items: any[]): YouTubeVideo[] {
  return (items ?? [])
    .filter((item) => item.id?.videoId || item.id)
    .map((item) => ({
      videoId: typeof item.id === "string" ? item.id : item.id.videoId,
      title: item.snippet?.title ?? "",
      channelTitle: item.snippet?.channelTitle ?? "",
      publishedAt: item.snippet?.publishedAt ?? new Date().toISOString(),
      description: item.snippet?.description ?? "",
    }));
}

async function ytFetch(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube API error (${res.status}): ${await res.text()}`);
  return res.json();
}

async function fetchVideos(source: { type: string; value: string }, apiKey: string) {
  const base =
    source.type === "youtube_channel"
      ? `${YT_API_BASE}/search?key=${apiKey}&channelId=${source.value}&part=snippet&order=date&maxResults=15&type=video`
      : `${YT_API_BASE}/search?key=${apiKey}&q=${encodeURIComponent(
          source.value
        )}&part=snippet&order=date&maxResults=15&type=video`;

  const list = mapItems((await ytFetch(base)).items);
  if (list.length === 0) return list;

  // שליפת התיאור המלא — שם מסתתרים לרוב קישורי ההורדה לדרייב.
  const ids = list.map((v) => v.videoId).join(",");
  try {
    const details = await ytFetch(`${YT_API_BASE}/videos?key=${apiKey}&id=${ids}&part=snippet`);
    const byId = new Map<string, string>(
      (details.items ?? []).map((i: any) => [i.id, i.snippet?.description ?? ""])
    );
    for (const v of list) v.description = byId.get(v.videoId) || v.description;
  } catch {
    // ממשיכים עם התיאור החלקי מה-search
  }
  return list;
}

/** מחפש קישור הורדה אמיתי בתיאור הסרטון (דרייב / דרופבוקס / mp3 ישיר). */
export function extractDownloadLink(description: string): string | null {
  const patterns = [
    /https?:\/\/drive\.google\.com\/\S+/i,
    /https?:\/\/(?:www\.)?dropbox\.com\/\S+/i,
    /https?:\/\/\S+\.mp3/i,
  ];
  for (const re of patterns) {
    const match = description.match(re);
    if (match) return match[0].replace(/[),.]+$/, "");
  }
  return null;
}

async function resolveArtist(name: string) {
  const clean = (name || "לא ידוע").trim();
  const existing = await db.artist.findUnique({ where: { name: clean } });
  if (existing) return existing.id;
  const created = await db.artist.create({
    data: {
      name: clean,
      slug: slugify(clean, { lower: true, strict: true }) || "artist",
    },
  }).catch(async () =>
    db.artist.create({
      data: {
        name: clean,
        slug:
          (slugify(clean, { lower: true, strict: true }) || "artist") +
          "-" +
          Date.now().toString(36),
      },
    })
  );
  return created.id;
}

async function resolveCategoryId(text: string, fallbackId: string | null) {
  const slug = classifySlug(text);
  if (slug) {
    const category = await db.category.findUnique({ where: { slug } });
    if (category) return category.id;
  }
  return fallbackId;
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

  const autoPublish = await getAutoPublish();
  const sources = await db.botSource.findMany({ where: { active: true } });

  for (const source of sources) {
    try {
      const videos = await fetchVideos(source, apiKey);
      found += videos.length;

      for (const video of videos) {
        if (!video.videoId) continue;

        const byId = await db.song.findFirst({ where: { youtubeId: video.videoId } });
        if (byId) continue;

        // זיהוי כפילויות: אותו שיר שהועלה בערוץ אחר
        const normalized = normalizeTitle(video.title);
        if (normalized.length > 4) {
          const similar = await db.song.findFirst({
            where: { title: { contains: normalized.split(" ").slice(0, 3).join(" "), mode: "insensitive" } },
          });
          if (similar) continue;
        }

        const artistId = await resolveArtist(video.channelTitle);
        const categoryId = await resolveCategoryId(
          `${video.title} ${video.description}`,
          source.defaultCategoryId
        );
        const driveLink =
          extractDownloadLink(video.description) ||
          DOWNLOAD_TEMPLATE.replace("{id}", video.videoId);

        await db.song.create({
          data: {
            title: video.title,
            artistId,
            categoryId,
            youtubeId: video.videoId,
            driveLink,
            description: video.description.slice(0, 2000) || null,
            status: autoPublish ? "PUBLISHED" : "PENDING",
            publishedAt: autoPublish ? new Date(video.publishedAt) : null,
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
