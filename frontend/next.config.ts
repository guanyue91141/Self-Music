import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // 允许的开发环境跨域请求
  allowedDevOrigins: [
    '118.26.38.42', // 添加警告中提到的IP地址
    'localhost',
    '127.0.0.1',
    '0.0.0.0'
  ],
  // Turbopack配置 (修复deprecated警告)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // 开发模式配置
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // 确保热加载模块正常工作
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  // 构建优化
  typescript: {
    // 在构建过程中忽略类型错误
    ignoreBuildErrors: false,
  },
  eslint: {
    // 在构建过程中忽略ESLint错误
    ignoreDuringBuilds: false,
  },
  // PWA基础配置
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP'],
  },
  // 确保 service worker 能被正确访问
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
