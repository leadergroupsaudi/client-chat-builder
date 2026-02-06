
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  VoiceAssistantControlBar,
  useLocalParticipant,
  useIsSpeaking,
  VideoTrack,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { LiveKitPopupForm } from '../components/LiveKitPopupForm';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, PhoneOff, User, Video, VideoOff, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track } from 'livekit-client';

function HeartbeatWaveform({
  isActive,
  width = 420,
  height = 70,
  className = '',
}: {
  isActive: boolean;
  width?: number;
  height?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, 'rgba(0, 150, 180, 0)');
      gradient.addColorStop(0.5, 'rgba(0, 150, 180, 0.05)');
      gradient.addColorStop(1, 'rgba(0, 150, 180, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.beginPath();
      ctx.strokeStyle = '#0099AA';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#0099AA';
      ctx.shadowBlur = isActive ? 15 : 5;

      const segmentWidth = 80;
      const offset = offsetRef.current % segmentWidth;

      for (let x = -segmentWidth + offset; x < width + segmentWidth; x++) {
        const localX = ((x + segmentWidth * 10) % segmentWidth);
        let y = centerY;

        if (isActive) {
          if (localX > 20 && localX < 25) {
            y = centerY - 8;
          } else if (localX > 25 && localX < 30) {
            y = centerY + 25 + Math.random() * 5;
          } else if (localX > 30 && localX < 35) {
            y = centerY - 35 - Math.random() * 10;
          } else if (localX > 35 && localX < 40) {
            y = centerY + 15 + Math.random() * 3;
          } else if (localX > 40 && localX < 45) {
            y = centerY - 5;
          } else if (localX > 55 && localX < 60) {
            y = centerY - 10 - Math.random() * 5;
          } else if (localX > 60 && localX < 65) {
            y = centerY + 8 + Math.random() * 3;
          }
        }

        if (x === -segmentWidth + offset) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      ctx.shadowBlur = 0;

      if (isActive) {
        offsetRef.current += 2;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80 ${className}`}
    />
  );
}

function CallTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="px-4 py-2 bg-zinc-900/90 rounded-full text-zinc-300 font-mono text-sm border border-zinc-700/50">
      {formatTime(hours)}:{formatTime(minutes)}:{formatTime(seconds)}
    </div>
  );
}

function CircularAvatar({
  imageUrl,
  label,
  isAI = false,
  isActive = false,
  size = 260,
  children,
}: {
  imageUrl?: string;
  label: string;
  isAI?: boolean;
  isActive?: boolean;
  size?: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        animate={isActive ? { scale: [1, 1.02, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className={`relative rounded-full overflow-hidden border-2 ${isActive ? 'border-cyan-600 shadow-lg shadow-cyan-900/50' : 'border-zinc-600/50'
          }`}
        style={{ width: size, height: size }}
      >
        {children ? (
          <div className="w-full h-full">{children}</div>
        ) : imageUrl ? (
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            {isAI ? (
              <div className="w-full h-full bg-gradient-to-br from-slate-900 to-zinc-900 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-16 h-16 text-cyan-700">
                  <circle cx="50" cy="35" r="20" fill="currentColor" opacity="0.7" />
                  <path d="M25 80 Q50 60 75 80" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
              </div>
            ) : (
              <User className="w-12 h-12 text-zinc-500" />
            )}
          </div>
        )}

        {isAI && isActive && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-cyan-700"
            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
      </motion.div>
      <span className="text-zinc-400 text-sm font-medium tracking-wider">{label}</span>
    </div>
  );
}

function HeartbeatVoiceCall({
  agentLabel,
  agentAvatarUrl,
  onDisconnect,
  onOpenForm,
}: {
  agentLabel: string;
  agentAvatarUrl?: string | null;
  onDisconnect: () => void;
  onOpenForm: () => void;
}) {
  const { state } = useVoiceAssistant();
  const [startTime] = useState(Date.now());
  const {
    localParticipant,
    isMicrophoneEnabled,
    isCameraEnabled,
    cameraTrack,
  } = useLocalParticipant();
  const isUserSpeaking = useIsSpeaking(localParticipant);
  const isAISpeaking = state === 'speaking';

  const localCameraTrackRef = useMemo(() => {
    if (!cameraTrack) return undefined;
    return {
      participant: localParticipant,
      publication: cameraTrack,
      source: Track.Source.Camera,
    };
  }, [cameraTrack, localParticipant]);

  const handleToggleMic = async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (error) {
      console.error('[Video Call] Failed to toggle microphone:', error);
    }
  };

  const handleToggleCamera = async () => {
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (error) {
      console.error('[Video Call] Failed to toggle camera:', error);
    }
  };

  const statusText =
    state === 'listening'
      ? 'Listening...'
      : state === 'speaking'
        ? 'Speaking...'
        : state === 'thinking'
          ? 'Thinking...'
          : 'Connected';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-0 z-40 bg-black text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1a1a1a_0%,#0b0b0b_45%,#000_100%)]" />
      <div className="relative h-full w-full">
        <div className="absolute top-6 left-1/2 -translate-x-1/2">
          <CallTimer startTime={startTime} />
        </div>
        <div className="absolute inset-0 flex flex-col">
          <div className="relative flex-1 grid grid-cols-1 md:grid-cols-2 gap-10 px-6 md:px-16 pt-24 pb-28">
            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-xl h-52 flex items-center justify-center">
                <HeartbeatWaveform isActive={isUserSpeaking} width={520} height={80} />
                <div className="relative z-10">
                  <CircularAvatar label="YOU" isAI={false} isActive={isUserSpeaking} size={260}>
                    {isCameraEnabled && localCameraTrackRef ? (
                      <VideoTrack
                        trackRef={localCameraTrackRef}
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                        playsInline
                      />
                    ) : undefined}
                  </CircularAvatar>
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-xl h-52 flex items-center justify-center">
                <HeartbeatWaveform isActive={isAISpeaking} width={520} height={80} />
                <div className="relative z-10">
                  <CircularAvatar
                    imageUrl={agentAvatarUrl || undefined}
                    label={agentLabel}
                    isAI={true}
                    isActive={isAISpeaking}
                    size={260}
                  />
                </div>
              </div>
            </div>

            <div className="hidden md:block absolute top-20 bottom-20 left-1/2 w-px bg-zinc-800/60" />
          </div>

          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 text-zinc-400 text-sm tracking-wide">
            {statusText}
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-4 px-4 py-2 rounded-full bg-zinc-900/70 border border-zinc-800/70 shadow-xl">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleMic}
                className={`w-12 h-12 rounded-full ${isMicrophoneEnabled
                  ? 'bg-zinc-800 text-cyan-500 hover:bg-zinc-700'
                  : 'bg-red-900/40 text-red-400 hover:bg-red-900/60'
                  }`}
              >
                {isMicrophoneEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleCamera}
                className={`w-12 h-12 rounded-full ${isCameraEnabled
                  ? 'bg-zinc-800 text-cyan-500 hover:bg-zinc-700'
                  : 'bg-red-900/40 text-red-400 hover:bg-red-900/60'
                  }`}
              >
                {isCameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>

              <Button
                variant="ghost"
                onClick={onOpenForm}
                className="h-12 px-4 rounded-full bg-zinc-800 text-cyan-200 hover:bg-zinc-700 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Report
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onDisconnect}
                className="w-14 h-14 rounded-full bg-red-700 hover:bg-red-600 text-white"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>

        <div className="hidden">
          <VoiceAssistantControlBar />
        </div>
        <RoomAudioRenderer />
      </div>
    </motion.div >
  );
}

const UserVideoCallPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  const livekitUrl = queryParams.get('livekitUrl');
  const agentLabel = queryParams.get('agentName') || 'ASSISTANT';
  const agentAvatarUrl =
    queryParams.get('agentAvatar') || 'Gemini_Generated_Image_fyw2tfyw2tfyw2tf-removebg-preview.png';

  const [roomToken, setRoomToken] = useState<string | null>(null);
  const [shouldConnect, setShouldConnect] = useState(true);

  useEffect(() => {
    if (token) {
      setRoomToken(token);
    } else {
      // Optionally, fetch token if not provided in URL (e.g., for direct access)
      // For now, we expect it in the URL
      console.error("LiveKit token not found in URL.");
    }
  }, [token]);

  if (!roomToken || !livekitUrl) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading video call...</div>;
  }

  const handleDisconnect = () => {
    setShouldConnect(false);
    if (window.opener) {
      window.close();
    }
  };

  const handleOpenForm = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('livekit:open-form'));
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <LiveKitRoom
        video={true}
        audio={true}
        token={roomToken}
        serverUrl={livekitUrl}
        connect={shouldConnect}
        data-lk-theme="default"
        style={{ height: '100%', width: '100%' }}
        onDisconnected={() => {
          setShouldConnect(false);
          if (window.opener) {
            window.close();
          }
        }}
      >
        <LiveKitPopupForm />
        <AnimatePresence>
          {shouldConnect && (
            <HeartbeatVoiceCall
              agentLabel={agentLabel}
              agentAvatarUrl={agentAvatarUrl}
              onDisconnect={handleDisconnect}
              onOpenForm={handleOpenForm}
            />
          )}
        </AnimatePresence>
      </LiveKitRoom>
    </div>
  );
};

export default UserVideoCallPage;
