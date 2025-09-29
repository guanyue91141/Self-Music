import type { Metadata } from "next";
import "./globals.css";
import "@/styles/performance.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AudioManager } from "@/components/audio-manager";
import { BottomPlayer } from "@/components/bottom-player";
import { PageWrapper } from "@/components/page-wrapper";

export const metadata: Metadata = {
  title: "Self-Music - 音乐流媒体平台",
  description: "现代化的音乐流媒体网站，专注于提供优美的播放体验",
  themeColor: "#000000",
  openGraph: {
    title: "Self-Music - 音乐流媒体平台",
    description: "现代化的音乐流媒体网站，专注于提供优美的播放体验",
    type: "website",
  },
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/icon.png" />

      </head>
      <body
        className="antialiased font-sans"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* 全局音频管理器 */}
          <AudioManager />
          
          {/* 页面内容 - 智能底部内边距管理 */}
          <PageWrapper>
            {children}
          </PageWrapper>
          
          {/* 底部播放器 */}
          <BottomPlayer />
        </ThemeProvider>
      </body>
    </html>
  );
}
