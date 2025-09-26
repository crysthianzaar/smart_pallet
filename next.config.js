/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Configuração ESLint - desabilitar durante builds
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
