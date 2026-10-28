// cPanel / CloudLinux Passenger entry point. Build the Next.js app first.
const { existsSync } = require("node:fs");
const { join } = require("node:path");

const server = join(__dirname, ".next", "standalone", "server.js");
if (!existsSync(server)) {
  console.error("Production build is missing. Run npm run build in the application directory, then restart the app in cPanel.");
  process.exit(1);
}

// Keep the port supplied by the hosting platform; only normalize the bind host.
process.env.HOSTNAME = process.env.KIRAYE_BIND_HOST || "0.0.0.0";
require(server);
