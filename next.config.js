/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com', 'platform-lookaside.fbsbx.com'],
  },
  webpack: (config, { isServer }) => {
    // Fix for Three.js and React Three Fiber
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }
    
    // Handle Three.js modules
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      type: 'asset/resource',
    })

    return config
  },
}

module.exports = nextConfig
