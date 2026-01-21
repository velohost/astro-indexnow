import type { AstroIntegration } from "astro";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface IndexNowOptions {
  key?: string;
  siteUrl?: string;
  enabled?: boolean;
  cacheDir?: string;
}

export default function indexNow(
  options: IndexNowOptions = {}
): AstroIntegration {
  let site: string | null = null;

  const CACHE_FILENAME = ".astro-indexnow-cache.json";
  const projectRoot = process.cwd();
  const cachePath = options.cacheDir
    ? path.resolve(projectRoot, options.cacheDir, CACHE_FILENAME)
    : path.join(projectRoot, CACHE_FILENAME);

  const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
  const INDEXNOW_BATCH_SIZE = 10_000;

  /* =========================================================
     Helpers
     ========================================================= */

  function ensureCacheFile(logger: any) {
    const dir = path.dirname(cachePath);
    if (!fs.existsSync(dir)) {
      logger.debug(`[astro-indexnow] creating cache directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }

    const exists = fs.existsSync(cachePath);
    logger.debug(
      `[astro-indexnow] cache exists: ${exists} (${cachePath})`
    );

    if (!exists) {
      logger.debug("[astro-indexnow] creating cache file");
      fs.writeFileSync(cachePath, "{}", "utf8");
    }
  }

  function hashFile(filePath: string): string {
    const contents = fs.readFileSync(filePath);
    const hash = crypto.createHash("sha256");
    hash.update(contents);
    return `sha256:${hash.digest("hex")}`;
  }

  function loadCache(logger: any): Record<string, string> {
    logger.debug("[astro-indexnow] loading cache file");
    try {
      return JSON.parse(fs.readFileSync(cachePath, "utf8"));
    } catch {
      logger.warn("[astro-indexnow] cache file unreadable, resetting");
      return {};
    }
  }

  function saveCache(logger: any, data: Record<string, string>) {
    logger.debug("[astro-indexnow] writing cache file");
    fs.writeFileSync(cachePath, JSON.stringify(data, null, 2), "utf8");
  }

  function chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /* =========================================================
     Integration
     ========================================================= */

  return {
    name: "astro-indexnow",

    hooks: {
      /* -----------------------------------------------
         Setup
         ----------------------------------------------- */
      "astro:config:setup": ({ config, logger }) => {
        site =
          options.siteUrl ??
          (config.site ? config.site.replace(/\/$/, "") : null);

        logger.debug(
          `[astro-indexnow] project root: ${projectRoot}`
        );

        ensureCacheFile(logger);
      },

      /* -----------------------------------------------
         Build done
         ----------------------------------------------- */
      "astro:build:done": async ({ dir, logger }) => {
        if (options.enabled === false) {
          logger.info("[astro-indexnow] disabled");
          return;
        }

        if (!options.key) {
          throw new Error("[astro-indexnow] Missing IndexNow key");
        }

        if (!site) {
          throw new Error("[astro-indexnow] Missing site URL");
        }

        ensureCacheFile(logger);

        const outDir = new URL(dir).pathname;

        const previousCache = loadCache(logger);
        const nextCache: Record<string, string> = {};
        const changedUrls: string[] = [];

        function walk(currentDir: string) {
          for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
            const fullPath = path.join(currentDir, entry.name);

            if (entry.isDirectory()) walk(fullPath);

            if (entry.isFile() && entry.name === "index.html") {
              const relativePath = path
                .relative(outDir, fullPath)
                .replace(/index\.html$/, "")
                .replace(/\\/g, "/");

              const url =
                site + "/" + relativePath.replace(/^\/+/, "");

              const hash = hashFile(fullPath);
              nextCache[url] = hash;

              if (previousCache[url] !== hash) {
                changedUrls.push(url);
              }
            }
          }
        }

        walk(outDir);

        logger.debug("[astro-indexnow] page diff:");
        for (const url of Object.keys(nextCache)) {
          const state =
            previousCache[url] === nextCache[url]
              ? "unchanged"
              : "new/changed";
          logger.debug(` - ${url} (${state})`);
        }

        if (changedUrls.length === 0) {
          logger.info(
            "[astro-indexnow] no changed URLs detected, skipping submission"
          );
          saveCache(logger, nextCache);
          return;
        }

        const batches = chunk(changedUrls, INDEXNOW_BATCH_SIZE);

        logger.info(
          `[astro-indexnow] submitting ${changedUrls.length} changed URLs in ${batches.length} batch(es)`
        );

        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];

          logger.debug(
            `[astro-indexnow] submitting batch ${i + 1}/${batches.length} (${batch.length} URLs)`
          );

          try {
            const response = await fetch(INDEXNOW_ENDPOINT, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                host: new URL(site).host,
                key: options.key,
                keyLocation: `${site}/${options.key}.txt`,
                urlList: batch,
              }),
            });

            if (!response.ok) {
              logger.warn(
                `[astro-indexnow] batch ${i + 1} failed (${response.status})`
              );
            }
          } catch {
            logger.warn(
              `[astro-indexnow] batch ${i + 1} submission failed (network error)`
            );
          }
        }

        saveCache(logger, nextCache);

        logger.info(
          `[astro-indexnow] IndexNow submission complete`
        );
      },
    },
  };
}