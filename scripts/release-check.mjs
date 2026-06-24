import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function fail(message) {
  console.error(`[release-check] ${message}`);
  process.exit(1);
}

const packageJson = JSON.parse(read("package.json"));
const packageLock = JSON.parse(read("package-lock.json"));
const readme = read("README.MD");
const changelog = read("CHANGELOG.md");
const version = packageJson.version;

if (packageLock.version !== version) {
  fail(`package-lock.json root version (${packageLock.version}) does not match package.json (${version})`);
}

if (packageLock.packages?.[""]?.version !== version) {
  fail(
    `package-lock.json package root version (${packageLock.packages?.[""]?.version}) does not match package.json (${version})`
  );
}

if (!readme.includes(`> **Current release:** v${version}`)) {
  fail(`README.MD does not advertise current release ${version}`);
}

if (!changelog.includes(`## [${version}] —`)) {
  fail(`CHANGELOG.md does not contain an entry for ${version}`);
}

console.log(`[release-check] release metadata is consistent for ${version}`);
