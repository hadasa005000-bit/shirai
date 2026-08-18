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

/** נירמול כותרת לזיהוי כפילויות (אותו שיר שהועלה בכמה ערוצים). */
export function normalizeTitle(title: string): string {
  return title
    .replace(/\(.*?\)|\[.*?\]/g, " ")
    .replace(/official|video|clip|hd|4k|lyrics|prod|mix|remix/gi, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}
