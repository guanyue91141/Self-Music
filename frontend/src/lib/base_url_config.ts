/**
 * API基础URL配置
 * 替代环境变量配置，更简单直接
 */

// 统一使用/api路径，由服务器端反向代理
const API_BASE = '/api';

// 根据环境自动选择API基础URL
export const API_BASE_URL = API_BASE;

// 导出配置信息，方便调试
export const API_CONFIG = {
  isProduction: process.env.NODE_ENV === 'production',
  baseUrl: API_BASE_URL,
  devUrl: API_BASE,
  prodUrl: API_BASE,
} as const;

// 调试信息
if (typeof window !== 'undefined') {
  console.log('API配置:', API_CONFIG);
} 