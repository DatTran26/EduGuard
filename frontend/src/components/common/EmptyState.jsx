function EmptyStateIcon() {
  return (
    <span
      aria-hidden="true"
      className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-border bg-surface text-secondary"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M6 7.5h12M6 12h8m-8 4.5h5M5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 17.25V6.75A2.25 2.25 0 0 1 5.25 4.5Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    </span>
  );
}

// Component này hiển thị trạng thái rỗng để page không bị trống trơn khi chưa có dữ liệu.
export default function EmptyState({ title, description, action }) {
  return (
    <div className="eg-empty-state">
      <EmptyStateIcon />
      <span className="text-sm font-semibold uppercase tracking-[0.12em] text-secondary">
        Chưa có dữ liệu
      </span>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-primary">{title}</h3>
        {description ? <p className="max-w-2xl text-sm leading-6 text-secondary">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
