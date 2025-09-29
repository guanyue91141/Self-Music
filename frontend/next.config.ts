import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 移除 standalone 输出以解决 Windows 构建问题
  // output: 'standalone',
  // 允许的开发环境跨域请求
  allowedDevOrigins: [
    '118.26.38.42',
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'xg.guanyue.fun',
    'music.guanyue.fun'
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'p1.music.126.net', // 网易云音乐图片域名
      },
      {
        protocol: 'https',
        hostname: 'p2.music.126.net', // 网易云音乐图片域名
      },
      {
        protocol: 'https',
        hostname: 'p3.music.126.net', // 网易云音乐图片域名
      },
      {
        protocol: 'https',
        hostname: 'p4.music.126.net', // 网易云音乐图片域名
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // 示例图片域名
      },
      // 添加更多允许的图片域名
    ],
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

};

export default nextConfig;
