// cPanel / CloudLinux Passenger entry point. The site is built on GitHub; this
// file only loads server settings and starts the prebuilt Next.js server.
const { existsSync, readFileSync } = require("node:fs");
const { join } = require("node:path");

// Settings from .env files next to this file (never overrides values that the
// hosting panel already provides).
for (const name of [".env.production.local", ".env.local", ".env.production", ".env"]) {
  const file = join(__dirname, name);
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || line.trim().startsWith("#")) continue;
    let value = match[2];
    if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
    if (process.env[match[1]] === undefined) process.env[match[1]] = value;
  }
}

// Lets the leader panel start a backup with the script that lives next to this file.
process.env.KIRAYE_APP_DIR = process.env.KIRAYE_APP_DIR || __dirname;

const server = join(__dirname, ".next", "standalone", "server.js");
if (!existsSync(server)) {
  console.error("Production build is missing. Deploy the 'site' branch from cPanel Git Version Control.");
  process.exit(1);
}

// Keep the port supplied by the hosting platform; only normalize the bind host.
process.env.HOSTNAME = process.env.KIRAYE_BIND_HOST || "0.0.0.0";
require(server);
