import type { AstroIntegration } from "astro";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export interface IndexNowOptions {
  key: string;
  siteUrl?: string;
  enabled?: boolean;
}

export default function indexNow(
  options: IndexNowOptions = {}
): AstroIntegration {
  let site: string | null = null;

  return {
    name: "astro-indexnow",

    hooks: {
      "astro:config:setup": ({ config }) => {
        site =
          options.siteUrl ??
          (config.site ? config.site.replace(/\/$/, "") : null);
      },

      "astro:build:done": async ({ dir }) => {
        if (options.enabled === false) {
          console.log("[astro-indexnow] disabled");
          return;
        }

        if (!options.key) {
          throw new Error(
            "[astro-indexnow] Missing IndexNow key. Provide it in astro.config.mjs."
          );
        }

        if (!site) {
          throw new Error(
            "[astro-indexnow] Missing `site` in astro.config.mjs (or siteUrl option)."
          );
        }

        const outDir = fileURLToPath(dir);
        const urls: string[] = [];

        function walk(currentDir: string) {
          const entries = fs.readdirSync(currentDir, {
            withFileTypes: true,
          });

          for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);

            if (entry.isDirectory()) {
              walk(fullPath);
            }

            if (entry.isFile() && entry.name === "index.html") {
              const relativePath = path
                .relative(outDir, fullPath)
                .replace(/index\.html$/, "")
                .replace(/\\/g, "/");

              const url =
                site + "/" + relativePath.replace(/^\/+/, "");

              urls.push(url);
            }
          }
        }

        walk(outDir);

        // ✅ KEEP EXISTING LOGGING
        console.log("[astro-indexnow] detected pages:");
        for (const url of urls) {
          console.log(" -", url);
        }

        if (urls.length === 0) {
          console.log("[astro-indexnow] no pages detected, skipping submission");
          return;
        }

        // ✅ INDEXNOW SUBMISSION (new)
        try {
          const response = await fetch("https://api.indexnow.org/indexnow", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              host: new URL(site).host,
              key: options.key,
              keyLocation: `${site}/${options.key}.txt`,
              urlList: urls,
            }),
          });

          if (!response.ok) {
            console.warn(
              `[astro-indexnow] IndexNow request failed (${response.status})`
            );
            return;
          }

          console.log(
            `[astro-indexnow] successfully submitted ${urls.length} URLs to IndexNow`
          );
        } catch (err) {
          console.warn(
            "[astro-indexnow] IndexNow submission failed (network error)"
          );
        }
      },
    },
  };
}