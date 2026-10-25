/** @type {import('next').NextConfig} */
const nextConfig = { output: "standalone" };
const buildWorkers = Number(process.env.KIRAYE_BUILD_WORKERS || 0);
if (Number.isInteger(buildWorkers) && buildWorkers >= 1 && buildWorkers <= 8) {
  nextConfig.experimental = { cpus: buildWorkers, memoryBasedWorkersCount: false };
}
export default nextConfig;
