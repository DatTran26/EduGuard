function readApiEnvelope(data) {
  if (!data || typeof data !== "object") {
    return { message: null, success: undefined };
  }

  if (typeof data.message === "string" && data.message.trim()) {
    return { message: data.message.trim(), success: data.success };
  }

  if (data.data && typeof data.data === "object" && typeof data.data.message === "string") {
    return { message: data.data.message.trim(), success: data.data.success };
  }

  return { message: null, success: data.success };
}

export function resolveApiErrorMessage(error, fallback = "Đã có lỗi xảy ra trong lúc gọi API.") {
  if (error instanceof Error && error.userMessage) {
    return error.userMessage;
  }

  const status = error?.response?.status;
  const { message: apiMessage } = readApiEnvelope(error?.response?.data);

  if (apiMessage) {
    return apiMessage;
  }

  if (typeof error?.response?.data === "string" && error.response.data.trim()) {
    return error.response.data.trim();
  }

  if (status === 403) {
    return "Bạn không có quyền thực hiện thao tác này. Hãy đăng xuất và đăng nhập lại nếu quyền vừa được cập nhật.";
  }

  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (status === 404) {
    return "Không tìm thấy dữ liệu yêu cầu.";
  }

  if (status === 400) {
    return "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.";
  }

  if (status >= 500) {
    return "Máy chủ đang gặp sự cố. Vui lòng thử lại sau.";
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    const raw = error.message.trim();
    if (/^Request failed with status code \d+$/i.test(raw)) {
      return fallback;
    }
    return raw;
  }

  return fallback;
}

export function createApiClientError(error, fallback) {
  const message = resolveApiErrorMessage(error, fallback);
  const nextError = new Error(message);
  nextError.status = error?.response?.status;
  nextError.userMessage = message;
  nextError.details = Array.isArray(error?.response?.data?.errors) ? error.response.data.errors : [];
  return nextError;
}
