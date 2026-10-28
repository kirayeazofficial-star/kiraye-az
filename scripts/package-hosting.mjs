import { cp, mkdir, readFile, writeFile, access } from "node:fs/promises";
import { resolve, dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = resolve(process.argv[2] || join(root, "dist", "hosting"));
const standalone = join(root, ".next", "standalone");
const buildId = (
  await readFile(join(root, ".next", "BUILD_ID"), "utf8")
).trim();
for (const path of ["server.js", ".next/BUILD_ID", "public", ".next/static"]) {
  await access(join(standalone, path));
}
if (process.platform !== "linux" || process.arch !== "x64") {
  throw new Error(
    "Build the hosting package on Linux x64, matching the cPanel server.",
  );
}
const publicConfig = {
  site: process.env.NEXT_PUBLIC_SITE_URL || "",
  databaseConfigured: !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  ),
};
if (
  !publicConfig.databaseConfigured &&
  !process.argv.includes("--allow-unconfigured")
) {
  throw new Error(
    "Database is not configured. Use --allow-unconfigured only for an explicitly labelled interface/demo package.",
  );
}
// Never overwrite an existing deployment directory or copy the source .env files.
await mkdir(dirname(target), { recursive: true });
await mkdir(target);
await mkdir(join(target, ".next"));
await cp(standalone, join(target, ".next", "standalone"), {
  recursive: true,
  dereference: true,
  filter: (source) => {
    const name = basename(source);
    return name !== ".git" && name !== ".env" && !name.startsWith(".env.");
  },
});
await cp(join(root, "app.js"), join(target, "app.js"));
await writeFile(
  join(target, "HOSTING-INFO.json"),
  JSON.stringify(
    {
      buildId,
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      ...publicConfig,
    },
    null,
    2,
  ),
);
await writeFile(
  join(target, "HOSTING-README.txt"),
  `kirayeal.az — hazır interfeys paketi\n\nApplication root: kirayeal (dəyişmə). Startup file: app.js.\nZIP-in içindəkiləri /home/kiraytfg/kirayeal qovluğuna çıxar.\n.next qovluğu da mütləq çıxarılmalıdır. Sonra Node.js panelində Restart et.\nBuild, dev, start və NPM Install bu hazır paket üçün lazım deyil.\nMövcud node_modules və nodevenv qovluqlarını silmə və köçürmə.\nNODE_OPTIONS: --disable-wasm-trap-handler saxlanıla bilər.\n\nBaza qoşulub: ${publicConfig.databaseConfigured ? "bəli" : "XEYR — yalnız nümunə/interfeys rejimi"}.\n${publicConfig.databaseConfigured ? "Canlı qeydiyyat və göndəriş ayrıca yoxlanmalıdır." : "Real qeydiyyat, giriş və elan göndərişi aktiv deyil. PostgreSQL, hesablar və şəkillərin köçürülməsi bu paketə daxil deyil. Mövcud Supabase məlumatlarını silmə."}\n\nYığım: Node ${process.version}, Linux x64.\nServer: https://kirayeal.az/api/health\n`,
);
console.log(`Hosting package: ${target}`);
console.log(
  `Database configured: ${publicConfig.databaseConfigured ? "yes" : "NO — interface/demo only"}`,
);
