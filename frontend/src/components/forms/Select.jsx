import FormField from "./FormField";
import { cn } from "../../utils/cn";

// Component này render select theo đúng style chung của dự án để form không bị lệch nhau.
export default function Select({
  id,
  label,
  helperText,
  error,
  required = false,
  options = [],
  className,
  ...props
}) {
  return (
    <FormField
      id={id}
      label={label}
      helperText={helperText}
      error={error}
      required={required}
    >
      {({ describedBy }) => (
        <select
          id={id}
          className={cn("eg-input", className)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FormField>
  );
}
