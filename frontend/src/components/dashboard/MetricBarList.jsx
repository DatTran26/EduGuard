// Component này hiển thị một danh sách số liệu có thanh phần trăm để dashboard bớt khô và dễ quét hơn.
export default function MetricBarList({ items = [], emptyMessage = "Chưa có dữ liệu." }) {
  if (items.length === 0) {
    return <p className="text-sm text-secondary">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-primary">{item.label}</p>
            <div className="text-right">
              <p className="text-sm font-semibold text-primary">{item.value}</p>
              {item.helperText ? <p className="text-xs text-secondary">{item.helperText}</p> : null}
            </div>
          </div>
          <div className="h-2 rounded-full bg-neutral">
            <div
              className="h-full rounded-full bg-tertiary transition-[width] duration-300"
              style={{ width: `${item.percentage ?? 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
