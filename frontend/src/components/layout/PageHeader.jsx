// Component này hiển thị tiêu đề trang theo cùng một format để các page nhìn thống nhất hơn.
export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-3">
        {eyebrow ? (
          <p className="text-[0.82rem] font-semibold uppercase tracking-[0.12em] text-secondary">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-2">
          <h1 className="text-[2.6rem] font-semibold leading-tight tracking-tight text-primary">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-base leading-relaxed text-secondary">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
