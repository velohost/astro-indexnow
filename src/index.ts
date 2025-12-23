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
  options: IndexNowOptions
): AstroIntegration {
  return {
    name: "astro-indexnow",

    hooks: {
      "astro:build:done": async ({ dir, config }) => {
        if (options?.enabled === false) {
          console.log("[astro-indexnow] disabled");
          return;
        }

        if (!options?.key) {
          throw new Error(
            "[astro-indexnow] Missing IndexNow key. Provide it in astro.config.mjs."
          );
        }

        const site =
          options.siteUrl ??
          (config.site
            ? config.site.replace(/\/$/, "")
            : null);

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

        // TEMP output (next step will replace this)
        console.log("[astro-indexnow] detected pages:");
        for (const url of urls) {
          console.log(" -", url);
        }
      },
    },
  };
}