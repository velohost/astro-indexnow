# Changelog

All notable changes to **astro-indexnow** will be documented in this file.

This project follows **Semantic Versioning**:
- MAJOR: breaking or behavioural changes
- MINOR: new features, backwards compatible
- PATCH: bug fixes and internal improvements

---

## [2.1.1] — 2026-03-31

### 🛠 Fixed

- **Windows path resolution**
  - Use `fileURLToPath()` to avoid duplicate drive letters when resolving `outDir`

### ✅ Compatibility

- **Astro v6** added to peer dependency range

---

## [2.1.0] — 2026-01-21

### ✨ Added

- **Configurable cache directory**
  - New `cacheDir` option lets you store `.astro-indexnow-cache.json` anywhere (absolute or project-relative)
  - Automatically creates the cache directory if missing, making it CI/CD friendly

### 🔄 Changed

- README updated with `cacheDir` docs and usage example

### ✅ Compatibility

- Backwards compatible: defaults to the project root when `cacheDir` is omitted

---

## [2.0.0] — 2026-01-07

### 🚀 Major release — stateful, production-grade IndexNow integration

This release introduces **changed-only URL submission**, making the integration suitable for
real-world production use, CI/CD pipelines, Docker deployments, and large static sites.

### ✨ Added

- **Deterministic change detection**
  - HTML output hashing (`sha256`) per generated page
  - Only new or modified URLs are submitted to IndexNow

- **Persistent build cache**
  - Introduced `.astro-indexnow-cache.json`
  - Stores URL → hash mappings
  - Enables accurate diffs across builds

- **IndexNow batching**
  - Automatic batching up to IndexNow’s 10,000 URL limit
  - Safe for large sites without configuration

- **CI/CD–aware design**
  - Works correctly in ephemeral build environments
  - Explicit documentation for Git-based deployments

- **Improved logging**
  - Quiet by default
  - Debug-level logs for internal operations
  - Clear, high-level info logs for outcomes

### 🔒 Behavioural Guarantees

- No runtime JavaScript added to sites
- No mutation of Astro configuration
- No reliance on Git history or timestamps
- No secrets stored in cache
- Deterministic behaviour based on final HTML output

### ⚠️ Important notes

- When deploying via Git-based CI/CD, the cache file
  `.astro-indexnow-cache.json` **must be committed**
  to enable changed-only submissions.
- Deleting the cache will cause the next build to treat all pages as new.

---

## [1.0.1] — 2025-12-27

### 🛠 Maintenance release

- Internal refactors
- Improved error handling
- No behavioural changes

---

## [1.0.0] — 2025-12-26

### 🎉 Initial release

- Basic Astro integration for IndexNow
- Submits all generated pages after build
- Stateless behaviour
- No change detection or batching

---

## Future plans

Planned improvements (no timeline):

- Optional dry-run mode
- Sitemap-driven discovery
- Additional logging controls

---

For questions or issues, please visit:  
https://github.com/velohost/astro-indexnow/issues
