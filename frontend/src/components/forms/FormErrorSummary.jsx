export default function FormErrorSummary({
  message,
  title = "Kiểm tra lại thông tin",
}) {
  if (!message) {
    return null;
  }

  return (
    <div aria-live="polite" className="eg-form-error-summary" role="alert">
      <p className="eg-form-error-summary-title">{title}</p>
      <p className="eg-form-error-summary-message">{message}</p>
    </div>
  );
}
