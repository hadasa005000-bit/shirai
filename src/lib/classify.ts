/**
 * סיווג אוטומטי של שיר לנושא לפי מילות מפתח בכותרת/בתיאור.
 * הבוט משתמש בזה כדי לסדר שירים חדשים לפי נושאים בלי התערבות אדם.
 */
const RULES: { slug: string; keywords: string[] }[] = [
  { slug: "shabbat", keywords: ["שבת", "קבלת שבת", "זמירות", "מלווה מלכה", "לכה דודי"] },
  { slug: "wedding", keywords: ["חתונה", "חתן", "כלה", "שבע ברכות", "מצוה טאנץ"] },
  { slug: "hitorerut", keywords: ["התעורר", "תשובה", "אלול", "סליחות", "נשמה", "תפילה", "אבינו"] },
  { slug: "simcha", keywords: ["שמח", "ריקוד", "הורה", "פורים", "מדליי", "דאנס", "טיש"] },
  { slug: "kids", keywords: ["ילדים", "מקהלת", "ילד", "גן", "חיידר"] },
  { slug: "acapella", keywords: ["אקפלה", "acapella", "a cappella", "ספירת העומר"] },
  { slug: "bein-hazmanim", keywords: ["בין הזמנים", "קעמפ", "מחנה", "טיול"] },
];

export function classifySlug(text: string): string | null {
  const hay = text.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => hay.includes(k.toLowerCase()))) return rule.slug;
  }
  return null;
}

/**
 * נושאים שאינם עדיין קטגוריה קבועה באתר, אבל חוזרים מספיק כדי שיהיה
 * שווה להציע ליצור להם קטגוריה. הבוט לא יוצר אותם לבד — רק מציע,
 * דרך CategorySuggestion, וממתין לאישור מנהל ב-/admin/categories.
 */
const CANDIDATE_TOPICS: { name: string; keyword: string }[] = [
  { name: "פסח", keyword: "פסח" },
  { name: "חנוכה", keyword: "חנוכה" },
  { name: "סוכות", keyword: "סוכות" },
  { name: "שבועות", keyword: "שבועות" },
  { name: 'ל"ג בעומר', keyword: "לג בעומר" },
  { name: "ימים נוראים", keyword: "ראש השנה" },
  { name: "יום כיפור", keyword: "יום כיפור" },
  { name: "תשעה באב", keyword: "תשעה באב" },
  { name: "יום ירושלים", keyword: "יום ירושלים" },
  { name: "יום העצמאות", keyword: "יום העצמאות" },
  { name: "פורים", keyword: "פורים" },
];

/** מחזיר הצעת נושא חדש (שם + מילת המפתח שמצאה אותו), או null אם אין. */
export function suggestNewCategory(text: string): { name: string; keyword: string } | null {
  const hay = text.toLowerCase().replace(/["'׳]/g, "");
  for (const topic of CANDIDATE_TOPICS) {
    if (hay.includes(topic.keyword.toLowerCase())) return topic;
  }
  return null;
}

/** נירמול טקסט להשוואת שמות אמנים — מוריד גרשיים/מרכאות ומקטין רווחים כפולים. */
function normalizeForArtistMatch(text: string): string {
  return text
    .replace(/["'׳״]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * מזהה אילו אמנים "מוכרים" (כאלה שכבר קיימים בטבלת Artist) מוזכרים
 * בטקסט (בד"כ כותרת הסרטון). זה מה שתופס מחרוזות/דואטים כמו
 * "חיים ישראל ויעקב שוואקי - מחרוזת" — שני השמות מזוהים יחד, ובהמשך
 * (בבוט) השיר משויך לשניהם, כדי שהוא לא "יתפספס" ויישאר רק תחת אחד מהם.
 *
 * שמות קצרים מדי (פחות מ-3 תווים) לא נבדקים, כדי למנוע התאמות שווא
 * (למשל שם אמן בן 2 אותיות שמופיע בטעות בתוך מילה אחרת).
 */
export function detectArtistMentions<T extends { id: string; name: string }>(
  text: string,
  artists: T[]
): T[] {
  const hay = normalizeForArtistMatch(text);
  const found: T[] = [];
  for (const artist of artists) {
    const name = normalizeForArtistMatch(artist.name);
    if (name.length < 3) continue;
    if (hay.includes(name)) found.push(artist);
  }
  return found;
}

/** נירמול כותרת לזיהוי כפילויות (אותו שיר שהועלה בכמה ערוצים). */
export function normalizeTitle(title: string): string {
  return title
    .replace(/\(.*?\)|\[.*?\]/g, " ")
    .replace(/official|video|clip|hd|4k|lyrics|prod|mix|remix/gi, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}
