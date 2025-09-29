'use client';

import { useEffect } from 'react';

// 一个普通的组件，不再处理PWA和Service Worker功能
export function PWAProvider() {
  // 只进行基本的日志记录，不执行任何PWA相关操作
  useEffect(() => {
    console.log('PWA功能已禁用');
  }, []);

  return null;
}