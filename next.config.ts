import type { NextConfig } from "next";

// Set by the GitHub Pages deploy workflow so the app is built for
// https://sankycz.github.io/3d-knowledge-voyager/ without affecting
// local `next dev` / `next build`, which stay rooted at "/".
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoBasePath = "/3d-knowledge-voyager";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGithubPages ? repoBasePath : undefined,
  assetPrefix: isGithubPages ? `${repoBasePath}/` : undefined,
  images: { unoptimized: true },
};

export default nextConfig;
