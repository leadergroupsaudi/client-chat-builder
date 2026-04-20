export const FALLBACK_AUDIO_MIME_TYPE = 'audio/webm';

const AUDIO_MIME_TYPE_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
  'audio/mp4;codecs=mp4a.40.2',
] as const;

export function getSupportedAudioMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return undefined;
  }

  return AUDIO_MIME_TYPE_CANDIDATES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
}

export function createCompatibleMediaRecorder(stream: MediaStream): MediaRecorder {
  const mimeType = getSupportedAudioMimeType();
  return mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
}

export function getRecorderOutputMimeType(recorder: MediaRecorder): string {
  return recorder.mimeType || getSupportedAudioMimeType() || FALLBACK_AUDIO_MIME_TYPE;
}
