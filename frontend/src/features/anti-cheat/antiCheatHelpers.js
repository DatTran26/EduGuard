export const ANTI_CHEAT_EVENT_TYPES = {
  tabSwitch: "TAB_SWITCH",
  windowBlur: "WINDOW_BLUR",
  copyPaste: "COPY_PASTE",
  exitFullscreen: "EXIT_FULLSCREEN",
  pageReload: "PAGE_RELOAD",
  disconnected: "DISCONNECTED",
  webcamOff: "WEBCAM_OFF",
  phoneVisible: "PHONE_VISIBLE",
  bookVisible: "BOOK_VISIBLE",
  secondPersonVisible: "SECOND_PERSON_VISIBLE",
  personNotVisible: "PERSON_NOT_VISIBLE",
};

const AUTO_CAPTURE_VIOLATION_TYPES = new Set([
  ANTI_CHEAT_EVENT_TYPES.copyPaste,
  ANTI_CHEAT_EVENT_TYPES.exitFullscreen,
  ANTI_CHEAT_EVENT_TYPES.pageReload,
  ANTI_CHEAT_EVENT_TYPES.webcamOff,
  ANTI_CHEAT_EVENT_TYPES.phoneVisible,
  ANTI_CHEAT_EVENT_TYPES.bookVisible,
  ANTI_CHEAT_EVENT_TYPES.secondPersonVisible,
  ANTI_CHEAT_EVENT_TYPES.personNotVisible,
]);

const ANTI_CHEAT_EVENT_META = {
  TAB_SWITCH: { label: "Chuyển tab", variant: "caution" },
  WINDOW_BLUR: { label: "Mất focus", variant: "caution" },
  COPY_PASTE: { label: "Copy / paste", variant: "danger" },
  EXIT_FULLSCREEN: { label: "Thoát toàn màn hình", variant: "danger" },
  PAGE_RELOAD: { label: "Tải lại trang", variant: "caution" },
  DISCONNECTED: { label: "Mất kết nối", variant: "info" },
  WEBCAM_OFF: { label: "Tắt webcam", variant: "danger" },
  PHONE_VISIBLE: { label: "AI: Điện thoại", variant: "info" },
  BOOK_VISIBLE: { label: "AI: Tài liệu", variant: "danger" },
  SECOND_PERSON_VISIBLE: { label: "AI: Người thứ hai", variant: "caution" },
  PERSON_NOT_VISIBLE: { label: "AI: Không thấy người", variant: "neutral" },
};

export function getAntiCheatEventMeta(type) {
  return ANTI_CHEAT_EVENT_META[type] ?? {
    label: type || "Su kien anti-cheat",
    variant: "info",
  };
}

export function isAutoCaptureViolationType(type) {
  return AUTO_CAPTURE_VIOLATION_TYPES.has(type);
}

export function getSuspicionScoreMeta(score) {
  if (Number(score) >= 15) {
    return {
      label: "Nguy cơ cao",
      variant: "danger",
    };
  }

  if (Number(score) >= 5) {
    return {
      label: "Cần theo dõi",
      variant: "caution",
    };
  }

  return {
    label: "Ổn định",
    variant: "success",
  };
}

export function normalizeAntiCheatEventType(type) {
  if (typeof type === "number") {
    const mappedTypes = [
      ANTI_CHEAT_EVENT_TYPES.tabSwitch,
      ANTI_CHEAT_EVENT_TYPES.windowBlur,
      ANTI_CHEAT_EVENT_TYPES.copyPaste,
      ANTI_CHEAT_EVENT_TYPES.exitFullscreen,
      ANTI_CHEAT_EVENT_TYPES.pageReload,
      ANTI_CHEAT_EVENT_TYPES.disconnected,  
      ANTI_CHEAT_EVENT_TYPES.webcamOff,
    ];

    return mappedTypes[type] ?? "";
  }

  if (!type) {
    return "";
  }

  if (type === "TabSwitch") {
    return ANTI_CHEAT_EVENT_TYPES.tabSwitch;
  }

  if (type === "WindowBlur") {
    return ANTI_CHEAT_EVENT_TYPES.windowBlur;
  }

  if (type === "CopyPaste") {
    return ANTI_CHEAT_EVENT_TYPES.copyPaste;
  }

  if (type === "ExitFullscreen") {
    return ANTI_CHEAT_EVENT_TYPES.exitFullscreen;
  }

  if (type === "PageReload") {
    return ANTI_CHEAT_EVENT_TYPES.pageReload;
  }

  if (type === "Disconnected") {
    return ANTI_CHEAT_EVENT_TYPES.disconnected;
  }

  if (type === "WebcamOff") {
    return ANTI_CHEAT_EVENT_TYPES.webcamOff;
  }

  if (type === "PhoneVisible") {
    return ANTI_CHEAT_EVENT_TYPES.phoneVisible;
  }

  if (type === "BookVisible") {
    return ANTI_CHEAT_EVENT_TYPES.bookVisible;
  }

  if (type === "SecondPersonVisible") {
    return ANTI_CHEAT_EVENT_TYPES.secondPersonVisible;
  }

  if (type === "PersonNotVisible") {
    return ANTI_CHEAT_EVENT_TYPES.personNotVisible;
  }

  return type;
}
