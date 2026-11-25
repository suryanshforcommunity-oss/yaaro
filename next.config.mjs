/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Suppress Webpack cache big string serialization warnings in console
    config.infrastructureLogging = {
      level: 'error',
    }
    return config
  },
}

export default nextConfig
