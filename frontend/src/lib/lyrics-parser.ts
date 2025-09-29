// 歌词解析工具函数
export interface LyricLine {
  time: number;
  text: string;
}

export interface GroupedLyricLine {
  time: number;
  texts: string[]; // 支持多个文本（多语种）
}

export function parseLRC(lrcContent: string): GroupedLyricLine[] {
  const lines = lrcContent.split('\n');
  const lyrics: LyricLine[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // 匹配时间标签格式 [mm:ss.xx] 或 [mm:ss.xxx]
    const timeMatch = trimmedLine.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    
    if (timeMatch) {
      const minutes = parseInt(timeMatch[1], 10);
      const seconds = parseInt(timeMatch[2], 10);
      // 使用 padEnd 来统一处理2位或3位毫秒，确保始终是3位数
      const milliseconds = parseInt(timeMatch[3].padEnd(3, '0'), 10);
      const text = timeMatch[4].trim();
      
      // 统一按毫秒计算时间
      const time = minutes * 60 + seconds + milliseconds / 1000;
      
      if (text) { // 只添加有文本内容的行
        lyrics.push({ time, text });
      }
    }
  }

  // 按时间排序
  lyrics.sort((a, b) => a.time - b.time);

  // 将具有相同时间戳的歌词分组
  const groupedLyrics: GroupedLyricLine[] = [];
  for (let i = 0; i < lyrics.length; i++) {
    const current = lyrics[i];
    const result: GroupedLyricLine = {
      time: current.time,
      texts: [current.text]
    };

    // 检查后续是否有相同时间戳的歌词
    while (i + 1 < lyrics.length && Math.abs(lyrics[i + 1].time - current.time) < 0.01) {
      i++;
      result.texts.push(lyrics[i].text);
    }

    groupedLyrics.push(result);
  }

  return groupedLyrics;
}

export function getCurrentLyricIndex(lyrics: GroupedLyricLine[], currentTime: number): number {
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics[i].time) {
      return i;
    }
  }
  return -1;
}

export function getNextLyricTime(lyrics: GroupedLyricLine[], currentIndex: number): number | null {
  if (currentIndex >= 0 && currentIndex < lyrics.length - 1) {
    return lyrics[currentIndex + 1].time;
  }
  return null;
}