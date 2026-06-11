// Component này hiển thị trạng thái rỗng để page không bị trống trơn khi chưa có dữ liệu.
export default function EmptyState({ title, description, action }) {
  return (
    <div className="eg-empty-state">
      <span className="text-sm font-semibold uppercase tracking-[0.12em] text-secondary">
        Chưa có dữ liệu
      </span>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-primary">{title}</h3>
        <p className="max-w-2xl text-sm leading-6 text-secondary">{description}</p>
      </div>
      {action}
    </div>
  );
}
