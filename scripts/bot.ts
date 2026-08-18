/**
 * Standalone entry point for running the bot as a scheduled job
 * (e.g. a Render Cron Job), separate from the web server.
 *
 * Usage:  npm run bot
 * Needs the same env vars as the web app: DATABASE_URL, YOUTUBE_API_KEY.
 */
import { runBot } from "../src/lib/bot";

runBot()
  .then((result) => {
    console.log("Bot run finished:", result);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Bot run failed:", err);
    process.exit(1);
  });
