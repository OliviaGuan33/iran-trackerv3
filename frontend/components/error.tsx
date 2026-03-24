export function ErrorBlock({ label = "数据加载失败，请检查后端是否启动。" }: { label?: string }) {
  return <div className="error">{label}</div>;
}
