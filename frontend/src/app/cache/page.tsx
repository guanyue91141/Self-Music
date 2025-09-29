export default function CachePage() {
  // 不显示任何内容，因为我们已经移除了缓存功能
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">缓存管理</h1>
      <div className="text-center py-8 text-muted-foreground">
        <p>缓存功能已停用</p>
      </div>
    </div>
  );
}