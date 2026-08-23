import { NextRequest } from "next/server";

/**
 * הסקריפט המקומי לא מתחבר עם session של מנהל — יש לו מפתח משלו
 * (SCRIPT_API_KEY במשתני הסביבה), נפרד לגמרי מהסיסמה שלכם. אפשר
 * לבטל/להחליף אותו בכל רגע ב-Render בלי שזה ישפיע על הכניסה הרגילה שלכם.
 */
export function checkScriptAuth(req: NextRequest): boolean {
  const key = req.headers.get("x-script-key");
  const expected = process.env.SCRIPT_API_KEY;
  if (!expected) return false; // אם לא הוגדר מפתח בשרת — לחסום הכל, בלי יוצא מן הכלל
  return key === expected;
}
