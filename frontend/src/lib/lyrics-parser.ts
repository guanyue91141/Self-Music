// 歌词解析工具函数
export interface LyricLine {
  time: number;
  text: string;
}

// 双语歌词行接口
export interface DualLyricLine {
  time: number;
  original: string;
  translation: string;
}

export function parseLRC(lrcContent: string): LyricLine[] {
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
  return lyrics.sort((a, b) => a.time - b.time);
}

// 解析双语歌词
export function parseDualLRC(lrcContent: string): DualLyricLine[] {
  const lines = lrcContent.split('\n');
  const lyrics: LyricLine[] = [];
  const dualLyrics: DualLyricLine[] = [];

  // 首先解析所有歌词行
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
  
  // 分组相同时间戳的歌词
  const timeGrouped: Record<number, string[]> = {};
  for (const lyric of lyrics) {
    const timeKey = lyric.time;
    if (!timeGrouped[timeKey]) {
      timeGrouped[timeKey] = [];
    }
    timeGrouped[timeKey].push(lyric.text);
  }

  // 为每组时间戳创建双语歌词对象
  for (const [timeStr, texts] of Object.entries(timeGrouped)) {
    const time = parseFloat(timeStr);
    if (texts.length >= 2) {
      // 假设第一行为原始歌词，第二行为翻译歌词
      dualLyrics.push({
        time,
        original: texts[0],
        translation: texts[1]
      });
    } else {
      // 如果只有一行则原始歌词和翻译相同
      dualLyrics.push({
        time,
        original: texts[0],
        translation: texts[0]
      });
    }
  }

  return dualLyrics.sort((a, b) => a.time - b.time);
}

export function getCurrentLyricIndex(lyrics: LyricLine[], currentTime: number): number {
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics[i].time) {
      return i;
    }
  }
  return -1;
}

export function getNextLyricTime(lyrics: LyricLine[], currentIndex: number): number | null {
  if (currentIndex >= 0 && currentIndex < lyrics.length - 1) {
    return lyrics[currentIndex + 1].time;
  }
  return null;
}