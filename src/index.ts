import type { AstroIntegration } from "astro";

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
      "astro:build:done": async () => {
        if (options?.enabled === false) {
          console.log("[astro-indexnow] disabled");
          return;
        }

        if (!options?.key) {
          throw new Error(
            "[astro-indexnow] Missing IndexNow key. Run `npx astro add astro-indexnow`."
          );
        }

        console.log("[astro-indexnow] build completed");
      },
    },
  };
}