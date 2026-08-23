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

/** נירמול כותרת לזיהוי כפילויות (אותו שיר שהועלה בכמה ערוצים). */
export function normalizeTitle(title: string): string {
  return title
    .replace(/\(.*?\)|\[.*?\]/g, " ")
    .replace(/official|video|clip|hd|4k|lyrics|prod|mix|remix/gi, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}
