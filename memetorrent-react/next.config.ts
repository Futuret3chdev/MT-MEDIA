import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mysql2'],
  async rewrites() {
    return [
      {
        source: '/games/api/discord-callback.php',
        destination: '/api/oauth/discord/callback',
      },
    ];
  },
  async redirects() {
    const folders = [
      '/games/unix/tap',
      '/games/unix/1',
      '/games/unix/puck',
      '/games/unix/fruitninja',
      '/games/unix/dash',
      '/games/unix/chicken',
      '/games/unix/soccer',
      '/games/unix/taptap',
      '/games/2',
      '/games/racer',
      '/games/pocket',
      '/games/gallery',
    ];
    return [
      { source: '/claims.html', destination: '/claims', permanent: true },
      { source: '/casino-floor', destination: '/casino-floor/index.html', permanent: false },
      { source: '/casino-floor/', destination: '/casino-floor/index.html', permanent: false },
      ...folders.flatMap((p) => [
        { source: p, destination: `${p}/index.html`, permanent: false },
        { source: `${p}/`, destination: `${p}/index.html`, permanent: false },
      ]),
    ];
  },
};

export default nextConfig;
