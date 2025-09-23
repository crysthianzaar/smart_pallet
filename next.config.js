/** @type {import('next').NextConfig} */
const nextConfig = {
  // Desabilitar Turbopack e usar webpack tradicional
  experimental: {
    turbo: false,
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  // Configurações para PWA
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Configuração para SQLite
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('better-sqlite3');
    }
    return config;
  },
}

module.exports = nextConfig
