import { db } from "@/lib/db";
import slugify from "slugify";
import { classifySlug, normalizeTitle, suggestNewCategory } from "@/lib/classify";

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
  return false;
}

type YouTubeVideo = {
  videoId: string;
  title: string;
  channelTitle: string;
  channelId: string;
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
      channelId: item.snippet?.channelId ?? "",
      publishedAt: item.snippet?.publishedAt ?? new Date().toISOString(),
      description: item.snippet?.description ?? "",
    }));
}

async function ytFetch(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube API error (${res.status}): ${await res.text()}`);
  return res.json();
}

/**
 * סריקת ערוץ דרך פלייליסט ה"הועלה" שלו (playlistItems) עולה יחידת מכסה
 * אחת בלבד — לעומת 100 יחידות בקריאת search.list. מזהה הפלייליסט הזה
 * מתקבל תמיד מ-UC בתחילת מזהה הערוץ, מוחלף ב-UU.
 */
async function fetchChannelUploads(channelId: string, apiKey: string): Promise<YouTubeVideo[]> {
  if (!channelId.startsWith("UC")) return [];
  const uploadsPlaylistId = "UU" + channelId.slice(2);
  const url = `${YT_API_BASE}/playlistItems?key=${apiKey}&playlistId=${uploadsPlaylistId}&part=snippet&maxResults=15`;
  const data = await ytFetch(url);
  return (data.items ?? [])
    .map((item: any) => ({
      videoId: item.snippet?.resourceId?.videoId ?? "",
      title: item.snippet?.title ?? "",
      channelTitle: item.snippet?.videoOwnerChannelTitle ?? item.snippet?.channelTitle ?? "",
      channelId: item.snippet?.videoOwnerChannelId ?? channelId,
      publishedAt: item.snippet?.publishedAt ?? new Date().toISOString(),
      // בפלייליסט ה"הועלה" התיאור המלא כבר כלול, אין צורך בקריאה נוספת
      description: item.snippet?.description ?? "",
    }))
    .filter((v: YouTubeVideo) => v.videoId);
}

/** חיפוש חופשי (מילות מפתח) — היחיד שבאמת דורש את search.list היקר. */
async function fetchSearchResults(query: string, apiKey: string): Promise<YouTubeVideo[]> {
  const url = `${YT_API_BASE}/search?key=${apiKey}&q=${encodeURIComponent(
    query
  )}&part=snippet&order=date&maxResults=15&type=video`;
  const list = mapItems((await ytFetch(url)).items);
  if (list.length === 0) return list;

  // search.list מחזיר תיאור מקוצר — קריאה אחת נוספת (עולה יחידה אחת בלבד,
  // לא לכל וידאו בנפרד) שולפת את התיאור המלא לכל הסרטונים יחד.
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

async function fetchVideos(source: { type: string; value: string }, apiKey: string) {
  if (source.type === "youtube_channel") return fetchChannelUploads(source.value, apiKey);
  if (source.type === "youtube_trending") return fetchTrending(source.value || "IL", apiKey);
  // חיפוש שהוזן עם שנה קבועה מתעדכן אוטומטית לשנה הנוכחית בזמן ריצה
  return fetchSearchResults(withCurrentYear(source.value), apiKey);
}

/** מחליף כל מופע של שנה בת 4 ספרות (למשל "2026") בשנה הנוכחית בפועל. */
function withCurrentYear(query: string): string {
  const year = new Date().getFullYear().toString();
  return query.replace(/20\d{2}/, year);
}

/**
 * מצעד הטרנדים של יוטיוב ישראל, מסונן לקטגוריית מוזיקה (10) — עולה יחידת
 * מכסה אחת בלבד. מביא כל מה שפופולרי עכשיו במוזיקה בישראל, בלי תלות
 * ברשימת שמות קבועה. שים לב: זה כולל מוזיקה ישראלית כללית ולא רק
 * חסידית/דתית — לכן כל שיר עדיין עובר אצלכם ל-✓/✗ לפני פרסום, וממנו
 * (בכוונה) לא נוצרים מקורות קבועים חדשים אוטומטית.
 */
async function fetchTrending(regionCode: string, apiKey: string): Promise<YouTubeVideo[]> {
  const url = `${YT_API_BASE}/videos?key=${apiKey}&chart=mostPopular&regionCode=${regionCode}&videoCategoryId=10&part=snippet&maxResults=25`;
  const data = await ytFetch(url);
  return (data.items ?? [])
    .map((item: any) => ({
      videoId: item.id ?? "",
      title: item.snippet?.title ?? "",
      channelTitle: item.snippet?.channelTitle ?? "",
      channelId: item.snippet?.channelId ?? "",
      publishedAt: item.snippet?.publishedAt ?? new Date().toISOString(),
      description: item.snippet?.description ?? "",
    }))
    .filter((v: YouTubeVideo) => v.videoId);
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

async function resolveArtist(name: string): Promise<{ id: string; isNew: boolean }> {
  const clean = (name || "לא ידוע").trim();
  const existing = await db.artist.findUnique({ where: { name: clean } });
  if (existing) return { id: existing.id, isNew: false };
  const created = await db.artist
    .create({
      data: {
        name: clean,
        slug: slugify(clean, { lower: true, strict: true }) || "artist",
      },
    })
    .catch(async () =>
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
  return { id: created.id, isNew: true };
}

/**
 * זמר/מקהלה חדשים שהתגלו — מוסיפים גם חיפוש-מילת-מפתח על שמם (בנוסף
 * לערוץ עצמו), כדי לתפוס שיתופי פעולה וסינגלים שהועלו בערוצים אחרים,
 * לא רק בערוץ הבית שלהם.
 */
async function autoAddArtistSearchSource(artistName: string) {
  const query = `${artistName} שיר חדש`;
  const existing = await db.botSource.findFirst({ where: { type: "youtube_search", value: query } });
  if (existing) return;
  await db.botSource.create({
    data: {
      label: `אוטומטי — חיפוש ${artistName}`,
      type: "youtube_search",
      value: query,
    },
  });
}

async function resolveCategoryId(text: string, fallbackId: string | null) {
  // 1. קטגוריות קבועות מוכרות (כמו קודם)
  const slug = classifySlug(text);
  if (slug) {
    const category = await db.category.findUnique({ where: { slug } });
    if (category) return category.id;
  }

  // 2. הצעות קטגוריה שכבר אושרו ע"י מנהל — משתמשים בהן ישירות
  const approved = await db.categorySuggestion.findMany({ where: { status: "APPROVED" } });
  const hay = text.toLowerCase();
  for (const s of approved) {
    if (s.categoryId && hay.includes(s.keyword.toLowerCase())) return s.categoryId;
  }

  // 3. נושא חדש שעדיין אין לו קטגוריה — מציעים למנהל, לא יוצרים לבד
  const candidate = suggestNewCategory(text);
  if (candidate) {
    const existing = await db.categorySuggestion.findUnique({ where: { name: candidate.name } });
    if (!existing) {
      await db.categorySuggestion.create({
        data: { name: candidate.name, keyword: candidate.keyword, matchCount: 1 },
      });
    } else if (existing.status === "PENDING") {
      await db.categorySuggestion.update({
        where: { id: existing.id },
        data: { matchCount: { increment: 1 } },
      });
    }
    // REJECTED — לא מוצע שוב, לא נוגעים בו
  }

  return fallbackId;
}

/**
 * מילים בשם ערוץ שמסמנות שזה כנראה לא ערוץ מוזיקה (חדשות, גופים ציבוריים,
 * מוסדות וכו') — כדי שהבוט לא יוסיף אותם אוטומטית כמקור קבוע רק כי הם
 * הופיעו פעם אחת בתוצאות חיפוש. אפשר להרחיב את הרשימה בהמשך.
 */
const CHANNEL_BLOCKLIST = [
  "חדשות", "כאן", "ערוץ 7", "בשבע", "כיפה", "משטרת ישראל", "משטרה",
  "מועצה אזורית", "מועצה מקומית", "עיריית", "דיור מוגן", "בית ספר",
  "ישיבת", "תלמוד תורה", "וואטסאפ", "whatsapp", "news", "radio", "רדיו",
  "טלוויזיה", "עיתון", "תאגיד השידור",
];

function looksLikeNonMusicChannel(channelTitle: string): boolean {
  const lower = channelTitle.toLowerCase();
  return CHANNEL_BLOCKLIST.some((word) => lower.includes(word.toLowerCase()));
}

/**
 * הרחבה עצמית: אם שיר שהתקבל מגיע מערוץ שעדיין אין לו מקור "youtube_channel"
 * קבוע, יוצרים לו אחד אוטומטית. כך בריצה הבאה הבוט כבר סורק את כל הערוץ
 * של אותו זמר/מקהלה, לא רק את הסרטון הבודד שנמצא בחיפוש — בלי שהמנהל
 * יצטרך להוסיף אותו ידנית. ערוצים שנראים כמו חדשות/גופים ציבוריים לא
 * נוספים, גם אם שיר בודד שלהם עבר את הסינון.
 */
async function autoAddChannelSource(channelId: string, channelTitle: string, categoryId: string | null) {
  if (!channelId) return;
  if (looksLikeNonMusicChannel(channelTitle)) return;
  const existing = await db.botSource.findFirst({
    where: { type: "youtube_channel", value: channelId },
  });
  if (existing) return;

  await db.botSource.create({
    data: {
      label: `אוטומטי — ${channelTitle}`,
      type: "youtube_channel",
      value: channelId,
      defaultCategoryId: categoryId,
    },
  });
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

        const normalized = normalizeTitle(video.title);
        if (normalized.length > 4) {
          const similar = await db.song.findFirst({
            where: {
              title: { contains: normalized.split(" ").slice(0, 3).join(" "), mode: "insensitive" },
            },
          });
          if (similar) continue;
        }

        const { id: artistId, isNew: isNewArtist } = await resolveArtist(video.channelTitle);
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

        // הרחבה עצמית — רק ממקורות חיפוש מילות-מפתח מקוריים (לא ממצעד
        // הטרנדים ולא מערוצים שכבר נוספו), כדי לשמור על התאמה לקהל היעד
        // ולא להזרים אוטומטית מוזיקה כללית לתוך רשימת המקורות הקבועה.
        if (source.type === "youtube_search") {
          await autoAddChannelSource(video.channelId, video.channelTitle, categoryId);
          if (isNewArtist) {
            await autoAddArtistSearchSource(video.channelTitle);
          }
        }
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
