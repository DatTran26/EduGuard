import { FiMic, FiMicOff, FiVideo, FiVideoOff } from "react-icons/fi";
import Button from "../../../components/common/Button";
import { cn } from "../../../utils/cn";

export default function MediaStreamControls({
  isCameraOn = false,
  isMicOn = false,
  onToggleCamera,
  onToggleMicrophone,
  showMicrophone = true,
  className = "",
}) {
  return (
    <div className={cn("flex flex-wrap justify-center gap-2", className)}>
      <Button
        aria-pressed={isCameraOn}
        onClick={onToggleCamera}
        type="button"
        variant={isCameraOn ? "secondary" : "danger"}
      >
        {isCameraOn ? <FiVideo aria-hidden /> : <FiVideoOff aria-hidden />}
        {isCameraOn ? "Tắt camera" : "Bật camera"}
      </Button>

      {showMicrophone ? (
        <Button
          aria-pressed={isMicOn}
          onClick={onToggleMicrophone}
          type="button"
          variant={isMicOn ? "secondary" : "danger"}
        >
          {isMicOn ? <FiMic aria-hidden /> : <FiMicOff aria-hidden />}
          {isMicOn ? "Tắt micro" : "Bật micro"}
        </Button>
      ) : null}
    </div>
  );
}
