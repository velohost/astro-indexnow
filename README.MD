# astro-indexnow

A **production‑grade Astro integration** that automatically submits **only new or changed pages**
to **IndexNow** after each build.

This package is designed for **modern CI/CD pipelines**, **Docker-based deployments**, and
**large static sites**, while remaining fully deterministic and explicit.

> **Current release:** v2.3.5  
> **Stateful by design. `changed` by default, `all` available. Batch-safe. CI-aware.**

---

## Compatibility Matrix

| Platform | Supported | Notes |
| --- | --- | --- |
| Astro | 4.x, 5.x, 6.x, 7.x | Build-time integration works in static and hybrid builds |
| Node.js | `>=22.12.0` | Matches Astro v7 runtime floor |
| Static builds | Yes | Primary supported use case |
| Hybrid builds | Yes | Works for prerendered output generated at build time |
| SSR request-time submission | No | Use a webhook or server-side helper instead |

---

## What is IndexNow?

[IndexNow](https://www.indexnow.org/) is a protocol supported by search engines such as **Bing**
and **Yandex** that allows websites to proactively notify search engines when URLs are **added,
updated, or removed**.

Instead of waiting for crawlers, your site tells search engines exactly which URLs changed.

---

## Key Features

- 🚀 Submits URLs to IndexNow **at build time**
- 🔍 **Detects changed pages automatically** using HTML hashing
- 🧠 Stores a small on-disk cache to avoid re-submitting unchanged URLs
- 📦 **Batches submissions** safely (IndexNow 10,000 URL limit)
- 🔀 Optional `submissionMode` lets you choose `changed` or `all`
- 🧪 Optional `dryRun` plans submissions without sending requests
- 🗣 Optional `logMode` controls verbosity with `quiet`, `normal`, and `verbose`
- 📦 Optional `batchSize` lets you lower the submit batch size for testing
- 🔁 Optional retry controls let you tune transient failure handling
- 🧪 Fully **CI/CD and Docker safe**
- 🔒 No secrets prompted, stored, or mutated
- 🧩 No client-side or runtime code added
- 🧼 Quiet by default, verbose when Astro logging is enabled

---

## Installation

```bash
npm install astro-indexnow
```

Or using Astro’s helper:

```bash
npx astro add astro-indexnow
```

> **Note**  
> Like other Astro integrations, `astro add` installs the package but does **not**
> inject configuration values. Configuration is always explicit.

---

## Step 1 — Get your IndexNow key

Generate an IndexNow API key here:

👉 https://www.bing.com/indexnow/getstarted

You will receive:
- an **API key**
- instructions to create a **key verification file**

---

## Step 2 — Create the key file (required)

IndexNow requires proof that you own the site.

Create a text file named **`<YOUR_KEY>.txt`** in your Astro `public/` directory.

### Example

If your key is:

```
abcd1234
```

Create:

```
public/abcd1234.txt
```

With **exactly this content**:

```
abcd1234
```

Astro will automatically copy this file into the build output.

> ⚠️ The integration does **not** create this file for you.

---

## Step 3 — Configure Astro

Add both your site URL and the integration to `astro.config.mjs`.

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import indexnow from "astro-indexnow";

export default defineConfig({
  site: "https://example.com",
  integrations: [
    indexnow({
      key: process.env.INDEXNOW_KEY,
    }),
  ],
});
```

Using environment variables is **strongly recommended** for CI/CD.

This release is backwards compatible with earlier supported package versions.
Older npm versions are not deprecated by default; they remain supported until a future major release introduces a breaking change.

## Migration Notes

### From v1

- v1 submitted all generated pages after each build
- v2 and later add cache-based changed-only submissions
- if you upgrade from v1, the first build may submit more URLs because the cache starts empty

### From v2

- v2.1 added `cacheDir`
- v2.3 added `submissionMode`, `dryRun`, `logMode`, `batchSize`, and retry controls
- the current build-time behavior remains compatible with static and hybrid builds

---

## How It Works

On every `astro build`, the integration:

1. Walks the final HTML output directory
2. Hashes each generated `index.html`
3. Compares hashes against a stored cache
4. Detects which URLs are **new or changed**
5. Submits **only those URLs** to IndexNow
6. Updates the cache after a successful build

This ensures:
- No duplicate submissions
- No unnecessary API calls
- Accurate change detection based on real output

## What Gets Submitted

Only generated HTML pages are scanned and considered for submission.

Included:
- generated `index.html` pages
- static pages emitted into the final build output

Ignored:
- assets
- RSS or XML feeds
- JavaScript bundles
- images
- any other non-HTML outputs

This integration does not inspect source files directly. It only works from final build output.

---

## State & Cache File (Important)

To detect changes between builds, the integration stores a small cache file:

```
.astro-indexnow-cache.json
```

This file:
- Is created automatically
- Contains only URL → hash mappings
- Contains **no secrets**
- Is safe to inspect, commit, or delete

Deleting the file simply causes the next build to treat all pages as new.

---

## CI/CD & Git Deployments (Very Important)

### If you deploy via Git (CI/CD):

You **must commit** `.astro-indexnow-cache.json` to your repository.

Why:
- CI environments are ephemeral
- Without the cache, every build looks like a first build
- All URLs would be re-submitted

**Recommended:**

```gitignore
# DO NOT ignore this file
!.astro-indexnow-cache.json
```

### If you deploy on a persistent server:

If your build directory persists between builds (e.g. rsync, SSH, in-place deploy),
you **should not commit** the cache file. It will persist naturally.

---

## Logging Behaviour

- **Info logs**: high-level results (submitted, skipped, disabled)
- **Debug logs**: cache operations, diffs, batching
- **Warnings**: network or API failures

Use Astro’s verbose logging to see internal details:

```bash
astro build --verbose
```

---

## Configuration Options

### `key` (required)

Type: `string`

Your IndexNow API key.

---

### `enabled` (optional)

Type: `boolean`  
Default: `true`

Set to `false` to disable submissions entirely.

```js
indexnow({ enabled: false })
```

---

### `dryRun` (optional)

Type: `boolean`
Default: `false`

When `true`, the integration performs discovery, diffing, and batching, then logs the plan without sending any IndexNow requests.
Dry runs do not mutate the cache file.

```js
indexnow({
  dryRun: true,
})
```

---

### `logMode` (optional)

Type: `"quiet" | "normal" | "verbose"`
Default: `"normal"`

Controls how much the integration logs:

- `quiet` suppresses info and warning logs
- `normal` keeps high-level info and warnings, but not URL lists
- `verbose` includes cache, diff, and the full planned URL list

```js
indexnow({
  logMode: "verbose",
})
```

---

### `cacheDir` (optional)

Type: `string`  
Default: `process.cwd()`

The directory where the `.astro-indexnow-cache.json` file will be stored. Can be an absolute path or relative to the project root.

Example: `./node_modules/.astro`

---

### `submissionMode` (optional)

Type: `"changed" | "all"`
Default: `"changed"`

Controls which URLs are submitted after a build:

- `changed` submits only new or modified pages
- `all` submits every generated page in the current build output

```js
indexnow({
  submissionMode: "all",
})
```

---

### `batchSize` (optional)

Type: `number`
Default: `10000`

Controls how many URLs are submitted per IndexNow request.

- The default matches IndexNow’s documented limit
- Lower values are useful for testing or constrained environments

```js
indexnow({
  batchSize: 100,
})
```

---

### `retryAttempts` (optional)

Type: `number`
Default: `3`

Controls how many times a failed batch submission is retried.

---

### `retryBaseDelayMs` (optional)

Type: `number`
Default: `1000`

Controls the starting delay for exponential backoff between retries.

---

### `retryMaxDelayMs` (optional)

Type: `number`
Default: `8000`

Controls the maximum backoff delay between retries.

---

## IndexNow Limits & Batching

- IndexNow allows **up to 10,000 URLs per request**
- This integration automatically batches submissions
- Large sites are handled safely without configuration

---

## Behavioural Guarantees

- No runtime JavaScript added
- No mutation of Astro config
- No prompts or side effects
- No reliance on Git history
- Deterministic output-based change detection
- Intended for static and hybrid builds, not SSR request-time submission
- Build-time only; use a webhook or server-side flow for SSR updates

---

## Philosophy

This integration follows the same design principles as official Astro integrations
such as `@astrojs/sitemap`:

- Explicit configuration
- Predictable behaviour
- No magic or hidden state
- Production-first design

---

## Contributors

- Thanks to **@web-projects-lab** for adding the configurable `cacheDir` option.

---

## Maintainer

Built and maintained by **Velohost**  
UK-based, privacy-first infrastructure & developer tooling.

https://velohost.co.uk/

---

## License

MIT
