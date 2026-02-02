/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Strict Mode（開発時のバグ検出）
  reactStrictMode: true,

  // Vercel ビルド時は ESLint で失敗しない（本番デプロイ用）
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ビルド時の TypeScript 型エラーで失敗しない（本番デプロイ用。ローカルでは npm run type-check で確認）
  typescript: {
    ignoreBuildErrors: true,
  },

  // 画像最適化設定
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.example.com',
      },
      // Gravatarアバター
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
      },
    ],
  },

  // 実験的機能
  experimental: {
    // サーバーアクション
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // 環境変数の公開設定
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
  },

  // リダイレクト設定
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },

  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
