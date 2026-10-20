// Bind consistently on cPanel/VPS as well as local development.
process.env.HOSTNAME = process.env.KIRAYE_BIND_HOST || "0.0.0.0";
await import("../.next/standalone/server.js");
