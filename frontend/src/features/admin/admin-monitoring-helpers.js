export const ADMIN_MONITORING_SEVERITY_OPTIONS = [
  { label: "Tất cả mức độ", value: "" },
  { label: "Cao", value: "high" },
  { label: "Trung bình", value: "medium" },
  { label: "Thấp", value: "low" },
];

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

export function buildIncidentTypeOptions(cheatingTypes = []) {
  return [
    { label: "Tất cả loại vi phạm", value: "" },
    ...cheatingTypes.map((item) => ({
      label: item.label,
      value: item.label,
    })),
  ];
}

export function getRiskLevelByValue(value) {
  const normalizedValue = Number(value) || 0;

  if (normalizedValue >= 10) {
    return "high";
  }

  if (normalizedValue >= 5) {
    return "medium";
  }

  return "low";
}

export function getRiskBadgeVariant(value) {
  const riskLevel = getRiskLevelByValue(value);

  if (riskLevel === "high") {
    return "danger";
  }

  if (riskLevel === "medium") {
    return "caution";
  }

  return "info";
}

export function getRiskLabel(value) {
  const riskLevel = getRiskLevelByValue(value);

  if (riskLevel === "high") {
    return "Cao";
  }

  if (riskLevel === "medium") {
    return "Trung bình";
  }

  return "Thấp";
}

function matchesSearch(searchTerm, values = []) {
  const normalizedSearchTerm = normalizeText(searchTerm);

  if (!normalizedSearchTerm) {
    return true;
  }

  return values.some((value) => normalizeText(value).includes(normalizedSearchTerm));
}

export function filterMonitoringCollection(items = [], { searchTerm = "", severity = "" }) {
  return items.filter((item) => {
    const riskValue = Number(item.totalSuspicion ?? item.suspicionScore ?? 0);

    if (severity && getRiskLevelByValue(riskValue) !== severity) {
      return false;
    }

    return matchesSearch(searchTerm, [
      item.title,
      item.examTitle,
      item.studentName,
      item.classroomName,
      ...(Array.isArray(item.classroomNames) ? item.classroomNames : []),
    ]);
  });
}

export function filterRecentIncidents(items = [], { searchTerm = "", severity = "", incidentType = "" }) {
  return items.filter((item) => {
    if (incidentType && item.type !== incidentType) {
      return false;
    }

    if (severity && getRiskLevelByValue(item.suspicionPoint) !== severity) {
      return false;
    }

    return matchesSearch(searchTerm, [item.type, item.studentName, item.examTitle, item.classroomName]);
  });
}

export function filterCheatingTypeBars(items = [], incidentType = "") {
  if (!incidentType) {
    return items;
  }

  return items.filter((item) => item.label === incidentType);
}
