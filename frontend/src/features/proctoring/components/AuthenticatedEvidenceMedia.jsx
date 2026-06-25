import { useEffect, useState } from "react";
import axiosClient from "../../../api/axiosClient";

function isVideoEvidence(fileUrl, evidenceType) {
  const source = `${fileUrl ?? ""} ${evidenceType ?? ""}`;
  return /\.(webm|mp4)$/i.test(source) || /clip|video/i.test(source);
}

export default function AuthenticatedEvidenceMedia({ attemptId, evidenceId, fileUrl, evidenceType, className }) {
  const [mediaUrl, setMediaUrl] = useState(null);
  const [failed, setFailed] = useState(false);
  const isVideo = isVideoEvidence(fileUrl, evidenceType);

  useEffect(() => {
    if (!attemptId || !evidenceId) {
      return undefined;
    }

    let cancelled = false;
    let objectUrl;

    const downloadPath = fileUrl?.startsWith("/api/")
      ? fileUrl.replace(/^\/api/, "")
      : `/attempts/${attemptId}/proctoring/evidence/${evidenceId}/file`;

    axiosClient
      .get(downloadPath, { responseType: "blob" })
      .then((response) => {
        if (cancelled) {
          return;
        }

        objectUrl = URL.createObjectURL(response.data);
        setMediaUrl(objectUrl);
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [attemptId, evidenceId, fileUrl]);

  if (failed) {
    return <div className={`flex items-center justify-center bg-surface-sunken text-xs text-secondary ${className ?? ""}`}>Không tải được bằng chứng</div>;
  }

  if (!mediaUrl) {
    return <div className={`animate-pulse bg-surface-sunken ${className ?? ""}`} />;
  }

  if (isVideo) {
    return <video className={className} controls src={mediaUrl} />;
  }

  return <img alt={evidenceType || "Evidence"} className={className} src={mediaUrl} />;
}
