export default async function setup({ addIntegration, prompt }: any) {
  const key = await prompt({
    name: "key",
    type: "text",
    message: "Enter your IndexNow API key:",
    validate: (value: string) =>
      value ? true : "IndexNow key is required",
  });

  const siteUrl = await prompt({
    name: "siteUrl",
    type: "text",
    message: "Site URL (e.g. https://example.com):",
  });

  addIntegration({
    name: "astro-indexnow",
    import: "astro-indexnow",
    options: {
      key,
      siteUrl: siteUrl || undefined,
    },
  });
}