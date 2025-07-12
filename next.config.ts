/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/game',
        permanent: false,
      },
    ]
  },
}

export default nextConfig;