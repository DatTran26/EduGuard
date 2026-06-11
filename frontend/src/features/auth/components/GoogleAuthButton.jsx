import Button from "../../../components/common/Button";

// Nút này gom giao diện đăng nhập/đăng ký Google để 2 màn auth không bị lặp JSX quá nhiều.
export default function GoogleAuthButton({
  disabled = false,
  isLoading = false,
  label = "Tiếp tục với Google",
  onClick,
}) {
  return (
    <Button className="w-full justify-center gap-3" disabled={disabled} onClick={onClick} variant="secondary">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[0.92rem] font-bold text-[#4285F4] shadow-sm">
        G
      </span>
      {isLoading ? "Đang mở Google..." : label}
    </Button>
  );
}
