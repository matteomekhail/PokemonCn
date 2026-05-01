import type { NextConfig } from "next"
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare"
import path from "node:path"
import { fileURLToPath } from "node:url"

const appDir = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(appDir, "../..")

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: workspaceRoot,
  },
  // Registry JSON is served from /r/* — keep it as static asset and add CORS so
  // `pnpm dlx shadcn add https://pokemoncn.dev/r/<name>.json` works from anywhere.
  async headers() {
    return [
      {
        source: "/r/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Cache-Control", value: "public, max-age=300, s-maxage=3600" },
        ],
      },
    ]
  },
}

// Required so `next dev` can access Cloudflare bindings (R2, KV, etc).
initOpenNextCloudflareForDev()

export default nextConfig
