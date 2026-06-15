// Component này dùng cho activity, lịch sắp tới hoặc notification theo kiểu danh sách dọc.
export default function TimelineList({ items = [], emptyMessage = "Chưa có dữ liệu." }) {
  if (items.length === 0) {
    return <p className="text-sm text-secondary">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-[16px] border border-border bg-neutral p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-primary">{item.title}</p>
            {item.meta ? <p className="text-sm text-secondary">{item.meta}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
