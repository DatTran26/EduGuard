const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRequiredText(value, message) {
  return String(value ?? "").trim() ? "" : message;
}

export function validateEmailAddress(
  value,
  {
    requiredMessage = "Email không được để trống.",
    invalidMessage = "Email không hợp lệ.",
  } = {},
) {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    return requiredMessage;
  }

  return EMAIL_PATTERN.test(normalizedValue) ? "" : invalidMessage;
}

export function validateMinLength(value, minLength, message) {
  return String(value ?? "").trim().length >= minLength ? "" : message;
}

export function validateNumberField(
  value,
  {
    requiredMessage = "Trường này không được để trống.",
    invalidMessage = "Giá trị không hợp lệ.",
    min,
    minMessage,
    integer = false,
    integerMessage,
  } = {},
) {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    return requiredMessage;
  }

  const numericValue = Number(normalizedValue);

  if (!Number.isFinite(numericValue)) {
    return invalidMessage;
  }

  if (integer && !Number.isInteger(numericValue)) {
    return integerMessage || invalidMessage;
  }

  if (typeof min === "number" && numericValue < min) {
    return minMessage || invalidMessage;
  }

  return "";
}

function findFirstValidationError(value) {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nestedError = findFirstValidationError(item);

      if (nestedError) {
        return nestedError;
      }
    }
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      const nestedError = findFirstValidationError(item);

      if (nestedError) {
        return nestedError;
      }
    }
  }

  return "";
}

export function getFirstValidationError(errors) {
  return findFirstValidationError(errors);
}

export function hasValidationErrors(errors) {
  return Boolean(getFirstValidationError(errors));
}
