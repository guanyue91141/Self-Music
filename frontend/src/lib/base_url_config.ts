/**
 * API基础URL配置
 * 替代环境变量配置，更简单直接
 */

// 开发环境配置
const DEV_API_BASE = 'http://localhost:8000/api';

// 生产环境配置
const PROD_API_BASE = 'https://music.guanyue.fun/api';

// 根据环境自动选择API基础URL
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? PROD_API_BASE 
  : DEV_API_BASE;

// 导出配置信息，方便调试
export const API_CONFIG = {
  isProduction: process.env.NODE_ENV === 'production',
  baseUrl: API_BASE_URL,
  devUrl: DEV_API_BASE,
  prodUrl: PROD_API_BASE,
} as const;

// 调试信息
if (typeof window !== 'undefined') {
  console.log('API配置:', API_CONFIG);
} 