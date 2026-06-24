import type { AstroIntegration } from "astro";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

export interface IndexNowOptions {
  key?: string;
  siteUrl?: string;
  enabled?: boolean;
  cacheDir?: string;
  dryRun?: boolean;
  logMode?: "quiet" | "normal" | "verbose";
  submissionMode?: "changed" | "all";
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
      logger.debug(`creating cache directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }

    const exists = fs.existsSync(cachePath);
    logger.debug(
      `cache exists: ${exists} (${cachePath})`
    );

    if (!exists) {
      logger.debug("creating cache file");
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
    logger.debug("loading cache file");
    try {
      return JSON.parse(fs.readFileSync(cachePath, "utf8"));
    } catch {
      logger.warn("cache file unreadable, resetting");
      return {};
    }
  }

  function saveCache(logger: any, data: Record<string, string>) {
    logger.debug("writing cache file");
    fs.writeFileSync(cachePath, JSON.stringify(data, null, 2), "utf8");
  }

  function chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  function isQuiet() {
    return options.logMode === "quiet";
  }

  function isVerbose() {
    return options.logMode === "verbose";
  }

  function logInfo(logger: any, message: string) {
    if (!isQuiet()) logger.info(message);
  }

  function logWarn(logger: any, message: string) {
    if (!isQuiet()) logger.warn(message);
  }

  function logVerbose(logger: any, message: string) {
    if (isVerbose()) logger.info(message);
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

        logVerbose(logger,
          `project root: ${projectRoot}`
        );

        ensureCacheFile(logger);
      },

      /* -----------------------------------------------
         Build done
         ----------------------------------------------- */
      "astro:build:done": async ({ dir, logger }) => {
        if (options.enabled === false) {
          logInfo(logger, "disabled");
          return;
        }

        if (!options.key) {
          throw new Error("[astro-indexnow] Missing IndexNow key");
        }

        if (!site) {
          throw new Error("[astro-indexnow] Missing site URL");
        }

        ensureCacheFile(logger);

        const outDir = fileURLToPath(dir instanceof URL ? dir : new URL(dir));

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

        logVerbose(logger, "page diff:");
        for (const url of Object.keys(nextCache)) {
          const state =
            previousCache[url] === nextCache[url]
              ? "unchanged"
              : "new/changed";
          if (isVerbose()) {
            logVerbose(logger, ` - ${url} (${state})`);
          }
        }

        const urlsToSubmit =
          options.submissionMode === "all"
            ? Object.keys(nextCache)
            : changedUrls;

        if (urlsToSubmit.length === 0) {
          logInfo(
            logger,
            "no changed URLs detected, skipping submission"
          );
          saveCache(logger, nextCache);
          return;
        }

        const batches = chunk(urlsToSubmit, INDEXNOW_BATCH_SIZE);

        logInfo(
          logger,
          `submitting ${urlsToSubmit.length} URL(s) in ${batches.length} batch(es) [mode=${options.submissionMode ?? "changed"}]`
        );

        if (isVerbose()) {
          logVerbose(logger, "planned URL list:");
          for (const url of urlsToSubmit) {
            logVerbose(logger, ` - ${url}`);
          }
        }

        if (options.dryRun) {
          logInfo(logger, "dry run enabled, skipping submission");
          return;
        }

        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];

          logVerbose(
            logger,
            `submitting batch ${i + 1}/${batches.length} (${batch.length} URLs)`
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
              logWarn(
                logger,
                `batch ${i + 1} failed (${response.status})`
              );
            }
          } catch {
            logWarn(
              logger,
              `batch ${i + 1} submission failed (network error)`
            );
          }
        }

        saveCache(logger, nextCache);

        logInfo(
          logger,
          `IndexNow submission complete`
        );
      },
    },
  };
}
