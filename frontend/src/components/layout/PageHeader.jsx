// Component này hiển thị tiêu đề trang theo cùng một format để các page nhìn thống nhất hơn.
import "./PageHeader.css";

export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="eg-page-header">
      <div className="space-y-4">
        {eyebrow ? (
          <p className="eg-page-eyebrow">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-3">
          <h1 className="eg-page-title">
            {title}
          </h1>
          {description ? (
            <p className="eg-page-description">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3 lg:justify-end">{actions}</div> : null}
    </div>
  );
}
