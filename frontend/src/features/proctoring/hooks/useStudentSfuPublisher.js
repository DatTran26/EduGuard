import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent } from "livekit-client";
import { proctoringApi } from "../../../api/proctoringApi";

export function useStudentSfuPublisher({
  attemptId,
  enabled,
  mediaStream,
  cameraReady = false,
  enableAudio = false,
}) {
  const roomRef = useRef(null);
  const iceServersRef = useRef([{ urls: "stun:stun.l.google.com:19302" }]);
  const publishedTrackIdsRef = useRef([]);
  const [isConnected, setIsConnected] = useState(false);

  const cleanupRoom = useCallback(() => {
    publishedTrackIdsRef.current = [];
    setIsConnected(false);
    const room = roomRef.current;
    roomRef.current = null;
    if (room) {
      room.removeAllListeners();
      room.disconnect().catch(() => {});
    }
  }, []);

  const publishLocalTracks = useCallback(async () => {
    const room = roomRef.current;
    const stream = mediaStream?.current;
    if (!room || !stream || !cameraReady) {
      return;
    }

    const tracksToPublish = stream.getTracks().filter((track) => {
      if (track.kind === "audio" && !enableAudio) {
        return false;
      }
      return track.readyState === "live";
    });

    for (const track of tracksToPublish) {
      if (publishedTrackIdsRef.current.includes(track.id)) {
        continue;
      }
      await room.localParticipant.publishTrack(track, {
        name: track.kind === "video" ? "camera" : "microphone",
        simulcast: track.kind === "video",
      });
      publishedTrackIdsRef.current.push(track.id);
    }
  }, [cameraReady, enableAudio, mediaStream]);

  useEffect(() => {
    if (!enabled || !attemptId) {
      cleanupRoom();
      return undefined;
    }

    let isDisposed = false;

    async function connectAndPublish() {
      try {
        const configResponse = await proctoringApi.getSfuConfig();
        if (!configResponse.data?.enabled) {
          return;
        }

        iceServersRef.current = configResponse.data.iceServers ?? iceServersRef.current;

        const tokenResponse = await proctoringApi.getStudentSfuToken(attemptId);
        if (isDisposed) {
          return;
        }

        const room = new Room();
        roomRef.current = room;
        room.on(RoomEvent.LocalTrackPublished, () => {});
        room.on(RoomEvent.Disconnected, () => {
          publishedTrackIdsRef.current = [];
        });

        await room.connect(tokenResponse.data.url, tokenResponse.data.token, {
          autoSubscribe: false,
          rtcConfig: { iceServers: iceServersRef.current },
        });

        if (!isDisposed) {
          setIsConnected(true);
          await publishLocalTracks();
        }
      } catch {
        cleanupRoom();
      }
    }

    connectAndPublish();

    return () => {
      isDisposed = true;
      cleanupRoom();
    };
  }, [attemptId, cleanupRoom, enabled, publishLocalTracks]);

  useEffect(() => {
    if (!enabled || !cameraReady) {
      return;
    }
    publishLocalTracks().catch(() => {});
  }, [cameraReady, enabled, publishLocalTracks]);

  return { cleanupRoom, isConnected };
}
