import FormField from "./FormField";
import Input from "../common/Input";

// Component này nối FormField với Input để code ở page gọn hơn và dễ đọc hơn.
export default function TextInput({
  id,
  label,
  helperText,
  error,
  required = false,
  as = "input",
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
        <Input
          id={id}
          as={as}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        />
      )}
    </FormField>
  );
}
