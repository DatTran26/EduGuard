import Badge from "../../../components/common/Badge";

const RISK_VARIANTS = {
  Normal: "neutral",
  Watch: "caution",
  Warning: "danger",
  Critical: "danger",
};

const RISK_LABELS = {
  Normal: "Bình thường",
  Watch: "Cần theo dõi",
  Warning: "Rủi ro cao",
  Critical: "Cần xem xét",
};

export default function RiskBadge({ riskLevel = "Normal", score = 0 }) {
  return (
    <Badge title="Điểm nghi ngờ tích lũy từ các vi phạm" variant={RISK_VARIANTS[riskLevel] ?? "neutral"}>
      {RISK_LABELS[riskLevel] ?? riskLevel} · {score} điểm
    </Badge>
  );
}
