// Component này dùng cho activity, lịch sắp tới hoặc notification theo kiểu danh sách dọc.
export default function TimelineList({ items = [], emptyMessage = "Chưa có dữ liệu." }) {
  if (items.length === 0) {
    return <p className="text-sm text-secondary">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="eg-timeline-item">
          <span className="eg-timeline-dot" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm font-semibold text-primary leading-snug">{item.title}</p>
              {item.meta ? (
                <p className="shrink-0 text-xs text-secondary whitespace-nowrap">{item.meta}</p>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
