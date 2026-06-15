// Component này bọc checkbox với label và helper text để các setting boolean nhìn đồng bộ hơn.
export default function CheckboxField({
  id,
  label,
  helperText,
  checked = false,
  onChange,
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3 rounded-[16px] border border-border bg-neutral px-4 py-4"
    >
      <input
        id={id}
        checked={checked}
        className="mt-1 h-4 w-4 accent-[var(--color-tertiary)]"
        onChange={onChange}
        type="checkbox"
      />
      <span className="space-y-1">
        <span className="block text-sm font-semibold text-primary">{label}</span>
        {helperText ? <span className="block text-sm leading-6 text-secondary">{helperText}</span> : null}
      </span>
    </label>
  );
}
