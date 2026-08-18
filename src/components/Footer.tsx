export default function Footer() {
  return (
    <footer className="bg-ink text-parchment/60 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8 text-sm flex flex-col sm:flex-row justify-between gap-3">
        <p>© {new Date().getFullYear()} היכל הניגון — קטלוג שירים חסידיים וחרדיים.</p>
        <p>הקישורים לצפייה ולהורדה מובילים למקורות חיצוניים (יוטיוב / דרייב).</p>
      </div>
    </footer>
  );
}
