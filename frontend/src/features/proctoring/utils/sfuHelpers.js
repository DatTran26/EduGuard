const ATTEMPT_IDENTITY_PATTERN = /^attempt-(\d+)$/i;

export function parseAttemptIdFromIdentity(identity) {
  const match = ATTEMPT_IDENTITY_PATTERN.exec(identity ?? "");
  return match ? Number(match[1]) : null;
}

export function buildMediaStreamFromTrack(track) {
  if (!track?.mediaStreamTrack) {
    return null;
  }
  const stream = new MediaStream();
  stream.addTrack(track.mediaStreamTrack);
  return stream;
}

export function mergeTrackIntoStream(existingStream, track) {
  if (!track?.mediaStreamTrack) {
    return existingStream ?? null;
  }

  const stream = existingStream ?? new MediaStream();
  const hasTrack = stream
    .getTracks()
    .some((existingTrack) => existingTrack.id === track.mediaStreamTrack.id);
  if (!hasTrack) {
    stream.addTrack(track.mediaStreamTrack);
  }
  return stream;
}
