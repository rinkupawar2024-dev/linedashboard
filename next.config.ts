import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export. Every page is prerendered to plain HTML/CSS/JS in ./out.
  // Nothing here needs a Node runtime at request time — there are no API
  // routes, no server actions, no middleware, and no image optimisation — so
  // the whole app can be served as files from any static host.
  output: 'export',

  // Emit `rejection/index.html` rather than `rejection.html` so every route
  // resolves as a directory. Static hosts serve a directory's index.html but
  // will 404 on a bare `/rejection`, which breaks hard refreshes and bookmarks.
  trailingSlash: true,

  reactCompiler: true,
  turbopack: {
    // Pin the project root. Without this Turbopack walks up to the parent
    // directory, warns about the package-lock.json it finds there, and watches
    // a wider filesystem than the app actually needs.
    root: path.join(__dirname),
  },
  experimental: {
    // Run the React Compiler natively inside Turbopack rather than through the
    // Babel transform.
    turbopackRustReactCompiler: true,
  },
};

export default nextConfig;
