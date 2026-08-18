#!/bin/bash
# הרצה: bash push-to-github.sh
# הריצו את זה במחשב שלכם, בתוך תיקיית הפרויקט (heichal-hanigun).
# הסקריפט ישאל אתכם על שם המשתמש והטוקן בטרמינל בלבד — הם לא יישמרו בקובץ.

set -e

read -p "שם המשתמש שלכם ב-GitHub: " GH_USER
read -p "שם הריפו (לדוגמה heichal-hanigun): " GH_REPO
read -s -p "הדביקו כאן את הטוקן (לא יוצג על המסך): " GH_TOKEN
echo

git init
git add .
git commit -m "אתחול הפרויקט" || echo "כבר קיים commit ראשוני, ממשיכים..."
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin "https://${GH_USER}:${GH_TOKEN}@github.com/${GH_USER}/${GH_REPO}.git"
git push -u origin main

# מנקים את הטוקן מהיסטוריית ה-remote כדי שלא יישאר בקובץ config
git remote set-url origin "https://github.com/${GH_USER}/${GH_REPO}.git"

echo "הועלה בהצלחה. זכרו לבטל את הטוקן הישן שהודבק בצ'אט אם עדיין לא ביטלתם."
