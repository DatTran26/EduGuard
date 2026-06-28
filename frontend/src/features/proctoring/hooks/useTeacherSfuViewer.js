import { useCallback, useEffect, useRef, useState } from "react";
import { ConnectionState, Room, RoomEvent, Track } from "livekit-client";
import { proctoringApi } from "../../../api/proctoringApi";
import { resolveLiveKitUrl } from "../../../config/livekitConfig";
import { buildLiveKitConnectOptions } from "../utils/livekitRtcConfig";
import {
  buildMediaStreamFromTrack,
  mergeTrackIntoStream,
  parseAttemptIdFromIdentity,
} from "../utils/sfuHelpers";

function upsertParticipantStream(previousMap, attemptId, updater) {
  const current = previousMap[attemptId] ?? { stream: null, status: "connecting" };
  const next = updater(current);
  if (!next) {
    const { [attemptId]: _removed, ...rest } = previousMap;
    return rest;
  }
  return { ...previousMap, [attemptId]: next };
}

export function useTeacherSfuViewer({ examId, enabled, maxTiles = 9, enableAudio = false }) {
  const roomRef = useRef(null);
  const iceServersRef = useRef([{ urls: "stun:stun.l.google.com:19302" }]);
  const [sfuEnabled, setSfuEnabled] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [streamsByAttemptId, setStreamsByAttemptId] = useState({});

  const cleanupRoom = useCallback(() => {
    const room = roomRef.current;
    roomRef.current = null;
    if (room) {
      room.removeAllListeners();
      room.disconnect().catch(() => {});
    }
    setStreamsByAttemptId({});
    setConnectionStatus("idle");
  }, []);

  const handleTrackSubscribed = useCallback(
    (track, publication, participant) => {
      const attemptId = parseAttemptIdFromIdentity(participant.identity);
      if (!attemptId) {
        return;
      }

      if (track.kind === Track.Kind.Audio && !enableAudio) {
        return;
      }

      if (track.kind !== Track.Kind.Video && track.kind !== Track.Kind.Audio) {
        return;
      }

      setStreamsByAttemptId((previousMap) => {
        const activeVideoCount = Object.values(previousMap).filter(
          (entry) => entry.status === "connected" && entry.stream?.getVideoTracks().length,
        ).length;

        if (
          track.kind === Track.Kind.Video &&
          !previousMap[attemptId]?.stream?.getVideoTracks().length &&
          activeVideoCount >= maxTiles
        ) {
          return previousMap;
        }

        return upsertParticipantStream(previousMap, attemptId, (current) => ({
          stream: mergeTrackIntoStream(current.stream, track),
          status: "connected",
        }));
      });
    },
    [enableAudio, maxTiles],
  );

  const handleTrackUnsubscribed = useCallback((track, _publication, participant) => {
    const attemptId = parseAttemptIdFromIdentity(participant.identity);
    if (!attemptId || !track?.mediaStreamTrack) {
      return;
    }

    setStreamsByAttemptId((previousMap) =>
      upsertParticipantStream(previousMap, attemptId, (current) => {
        const nextStream = new MediaStream(
          current.stream?.getTracks().filter((existingTrack) => existingTrack.id !== track.mediaStreamTrack.id) ?? [],
        );
        if (!nextStream.getTracks().length) {
          return null;
        }
        return { stream: nextStream, status: "connected" };
      }),
    );
  }, []);

  const handleParticipantConnected = useCallback((participant) => {
    const attemptId = parseAttemptIdFromIdentity(participant.identity);
    if (!attemptId) {
      return;
    }

    setStreamsByAttemptId((previousMap) =>
      upsertParticipantStream(previousMap, attemptId, () => ({
        stream: null,
        status: "connecting",
      })),
    );

    participant.trackPublications.forEach((publication) => {
      if (publication.track) {
        handleTrackSubscribed(publication.track, publication, participant);
      }
    });
  }, [handleTrackSubscribed]);

  const handleParticipantDisconnected = useCallback((participant) => {
    const attemptId = parseAttemptIdFromIdentity(participant.identity);
    if (!attemptId) {
      return;
    }

    setStreamsByAttemptId((previousMap) => upsertParticipantStream(previousMap, attemptId, () => null));
  }, []);

  useEffect(() => {
    if (!enabled || !examId) {
      cleanupRoom();
      return undefined;
    }

    let isDisposed = false;

    async function connect() {
      setConnectionStatus("connecting");
      try {
        const configResponse = await proctoringApi.getSfuConfig();
        if (!configResponse.data?.enabled) {
          if (!isDisposed) {
            setSfuEnabled(false);
            setConnectionStatus("disabled");
          }
          return;
        }

        iceServersRef.current = configResponse.data.iceServers ?? iceServersRef.current;

        const tokenResponse = await proctoringApi.getTeacherSfuToken(examId);
        if (isDisposed) {
          return;
        }

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });
        roomRef.current = room;

        room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
        room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
        room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
        room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
        room.on(RoomEvent.ConnectionStateChanged, (state) => {
          if (state === ConnectionState.Connected) {
            setConnectionStatus("connected");
          } else if (state === ConnectionState.Reconnecting) {
            setConnectionStatus("connecting");
          } else if (state === ConnectionState.Disconnected) {
            setConnectionStatus("idle");
          }
        });

        const liveKitUrl = resolveLiveKitUrl(tokenResponse.data.url);
        await room.connect(
          liveKitUrl,
          tokenResponse.data.token,
          buildLiveKitConnectOptions(iceServersRef.current),
        );

        room.remoteParticipants.forEach((participant) => {
          handleParticipantConnected(participant);
        });

        if (!isDisposed) {
          setSfuEnabled(true);
          setConnectionStatus("connected");
        }
      } catch {
        if (!isDisposed) {
          setSfuEnabled(false);
          setConnectionStatus("error");
        }
      }
    }

    connect();

    return () => {
      isDisposed = true;
      cleanupRoom();
    };
  }, [
    cleanupRoom,
    enabled,
    examId,
    handleParticipantConnected,
    handleParticipantDisconnected,
    handleTrackSubscribed,
    handleTrackUnsubscribed,
  ]);

  const getStreamForAttempt = useCallback(
    (attemptId) => streamsByAttemptId[attemptId]?.stream ?? null,
    [streamsByAttemptId],
  );

  const getStatusForAttempt = useCallback(
    (attemptId) => streamsByAttemptId[attemptId]?.status ?? "idle",
    [streamsByAttemptId],
  );

  const activeRemoteStream = useCallback(
    (attemptId) => {
      const entry = streamsByAttemptId[attemptId];
      return entry?.status === "connected" ? entry.stream : null;
    },
    [streamsByAttemptId],
  );

  return {
    sfuEnabled,
    connectionStatus,
    streamsByAttemptId,
    getStreamForAttempt,
    getStatusForAttempt,
    activeRemoteStream,
    buildMediaStreamFromTrack,
  };
}
