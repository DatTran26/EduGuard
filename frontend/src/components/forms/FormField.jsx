// Hàm này ghép id mô tả và id lỗi để input đọc được bằng accessibility.
function buildDescribedBy(id, helperText, error) {
  const describedBy = [];

  if (helperText) {
    describedBy.push(`${id}-helper`);
  }

  if (error) {
    describedBy.push(`${id}-error`);
  }

  return describedBy.join(" ") || undefined;
}

// Component này chịu trách nhiệm bọc label, input và phần báo lỗi thành một field hoàn chỉnh.
export default function FormField({
  id,
  label,
  helperText,
  error,
  required = false,
  children,
}) {
  const describedBy = buildDescribedBy(id, helperText, error);
  const content =
    typeof children === "function" ? children({ id, describedBy }) : children;

  return (
    <div className="space-y-0">
      <label className="eg-label" htmlFor={id}>
        {label} {required ? <span className="text-danger">*</span> : null}
      </label>
      {content}
      {helperText ? (
        <p id={`${id}-helper`} className="eg-helper-text">
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="eg-error-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
