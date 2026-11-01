/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  productionBrowserSourceMaps: false,
  // The shared hosting kills big builds ("Array buffer allocation failed"),
  // so keep build memory low: no on-disk webpack cache, leaner webpack, and
  // no type-check pass inside `next build` (run `npm run lint` for types).
  typescript: { ignoreBuildErrors: true },
  experimental: { webpackMemoryOptimizations: true },
  webpack(config) {
    config.cache = false;
    return config;
  },
};
const buildWorkers = Number(process.env.KIRAYE_BUILD_WORKERS || 0);
if (Number.isInteger(buildWorkers) && buildWorkers >= 1 && buildWorkers <= 8) {
  nextConfig.experimental = {
    ...nextConfig.experimental,
    cpus: buildWorkers,
    memoryBasedWorkersCount: false,
  };
}
export default nextConfig;
