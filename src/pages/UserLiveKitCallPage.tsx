
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
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  PhoneOff,
  User,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track } from 'livekit-client';

/* ───────────────────────── Heartbeat Waveform ───────────────────────── */

function HeartbeatWaveform({
  isActive,
  width = 420,
  height = 70,
}: {
  isActive: boolean;
  width?: number;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const centerY = h / 2;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // subtle background gradient
      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, 'rgba(124, 58, 237, 0)');
      gradient.addColorStop(0.5, 'rgba(124, 58, 237, 0.04)');
      gradient.addColorStop(1, 'rgba(124, 58, 237, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      ctx.beginPath();
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#7c3aed';
      ctx.shadowBlur = isActive ? 18 : 5;

      const segmentWidth = 80;
      const offset = offsetRef.current % segmentWidth;

      for (let x = -segmentWidth + offset; x < w + segmentWidth; x++) {
        const localX = (x + segmentWidth * 10) % segmentWidth;
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
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-85 pointer-events-none"
    />
  );
}

/* ───────────────────────── Call Timer ───────────────────────── */

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
  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="px-5 py-1.5 bg-gray-100 rounded-full text-gray-500 font-mono text-sm font-semibold tracking-wider shadow-[inset_2px_2px_5px_rgba(0,0,0,0.08),inset_-2px_-2px_5px_rgba(255,255,255,0.9)]">
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </div>
  );
}

/* ───────────────────────── Circular Avatar ───────────────────────── */

function CircularAvatar({
  imageUrl,
  label,
  isAI = false,
  isActive = false,
  size = 200,
}: {
  imageUrl?: string;
  label: string;
  isAI?: boolean;
  isActive?: boolean;
  size?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        animate={isActive ? { scale: [1, 1.03, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        className={`relative rounded-full overflow-hidden border-[3px] transition-all duration-400 ${isActive
          ? 'border-violet-600 shadow-[0_0_30px_rgba(124,58,237,0.25),0_0_60px_rgba(124,58,237,0.08)]'
          : 'border-gray-200'
          }`}
        style={{ width: size, height: size }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={label} className="w-full h-full object-cover block" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            {isAI ? (
              <svg viewBox="0 0 100 100" className="w-16 h-16 text-violet-600">
                <circle cx="50" cy="35" r="20" fill="currentColor" opacity="0.7" />
                <path d="M25 80 Q50 60 75 80" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            ) : (
              <User size={48} className="text-gray-400" />
            )}
          </div>
        )}

        {/* glowing pulse ring */}
        {isAI && isActive && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-violet-600 pointer-events-none"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.15, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
          />
        )}
      </motion.div>
      {label && (
        <span className="text-gray-400 text-sm font-medium tracking-wider">{label}</span>
      )}
    </div>
  );
}

/* ───────────────────────── Neumorphic Phone Card Call UI ───────────────────────── */

function NeuCallUI({
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
  } = useLocalParticipant();
  const isAISpeaking = state === 'speaking';

  const handleToggleMic = async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (err) {
      console.error('[NeuCallUI] mic toggle failed:', err);
    }
  };

  const handleToggleCamera = async () => {
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (err) {
      console.error('[NeuCallUI] camera toggle failed:', err);
    }
  };

  const statusText =
    state === 'listening'
      ? 'Listening…'
      : state === 'speaking'
        ? 'Speaking…'
        : state === 'thinking'
          ? 'Thinking…'
          : 'Connected';

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen gap-7 bg-gray-100">
      <RoomAudioRenderer />

      {/* ── Phone card ── */}
      <div className="flex flex-col items-center w-[380px] px-8 pt-10 pb-9 rounded-[36px] bg-white shadow-[8px_8px_20px_rgba(0,0,0,0.08),-8px_-8px_20px_rgba(255,255,255,0.95)] relative overflow-hidden max-[440px]:w-[92vw] max-[440px]:px-5 max-[440px]:pt-8 max-[440px]:pb-7 max-[440px]:rounded-[28px]">
        {/* header */}
        <div className="text-center mb-7">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
            {agentLabel || 'AI Assistant'}
          </h2>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-500 mt-1">
            <span className="w-[7px] h-[7px] rounded-full bg-emerald-500 animate-pulse" />
            Live Connection
          </span>
        </div>

        {/* avatar section */}
        <div className="relative flex flex-col items-center mb-4">
          <CircularAvatar
            imageUrl={agentAvatarUrl || undefined}
            label=""
            isAI
            isActive={isAISpeaking}
            size={200}
          />

          {/* waveform overlaid below avatar */}
          <div className="relative w-[360px] h-[60px] mt-1 max-[440px]:w-[280px]">
            <HeartbeatWaveform isActive={isAISpeaking} width={360} height={60} />
          </div>
        </div>

        {/* timer + status */}
        <div className="flex flex-col items-center gap-2 mt-2">
          <CallTimer startTime={startTime} />
          <p className="text-sm text-violet-600 font-medium tracking-wide animate-pulse">
            {statusText}
          </p>
        </div>
      </div>

      {/* ── Control bar ── */}
      <div className="flex items-center gap-5 px-8 py-4 rounded-[28px] bg-white shadow-[8px_8px_20px_rgba(0,0,0,0.08),-8px_-8px_20px_rgba(255,255,255,0.95)] max-[440px]:px-5 max-[440px]:gap-3.5">
        {/* Mic */}
        <button
          onClick={handleToggleMic}
          title={isMicrophoneEnabled ? 'Mute' : 'Unmute'}
          className={`flex flex-col items-center justify-center gap-1 w-[60px] h-[60px] rounded-[18px] border-none cursor-pointer font-inherit transition-all duration-200 max-[440px]:w-[52px] max-[440px]:h-[52px] max-[440px]:rounded-[14px] ${!isMicrophoneEnabled
            ? 'text-gray-400 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.08),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] bg-gray-100'
            : 'text-gray-700 bg-gray-100 shadow-[4px_4px_10px_rgba(0,0,0,0.08),-4px_-4px_10px_rgba(255,255,255,0.95)]'
            } hover:-translate-y-0.5 hover:shadow-[6px_6px_14px_rgba(0,0,0,0.1),-6px_-6px_14px_rgba(255,255,255,0.95)] active:translate-y-0 active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.08),inset_-3px_-3px_6px_rgba(255,255,255,0.9)]`}
        >
          {isMicrophoneEnabled ? <Mic size={22} /> : <MicOff size={22} />}
          <span className="text-[0.6rem] font-semibold uppercase tracking-wider">
            {isMicrophoneEnabled ? 'Mute' : 'Unmute'}
          </span>
        </button>

        {/* Report */}
        <button
          onClick={onOpenForm}
          title="Open Report Form"
          className="flex flex-col items-center justify-center gap-1 w-[60px] h-[60px] rounded-[18px] border-none cursor-pointer font-inherit transition-all duration-200 text-violet-600 bg-gray-100 shadow-[4px_4px_10px_rgba(0,0,0,0.08),-4px_-4px_10px_rgba(255,255,255,0.95)] max-[440px]:w-[52px] max-[440px]:h-[52px] max-[440px]:rounded-[14px] hover:-translate-y-0.5 hover:shadow-[6px_6px_14px_rgba(0,0,0,0.1),-6px_-6px_14px_rgba(255,255,255,0.95)] active:translate-y-0 active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.08),inset_-3px_-3px_6px_rgba(255,255,255,0.9)]"
        >
          <FileText size={22} />
          <span className="text-[0.6rem] font-semibold uppercase tracking-wider">Report</span>
        </button>

        {/* End Call */}
        <button
          onClick={onDisconnect}
          title="End Call"
          className="flex flex-col items-center justify-center gap-1 w-[60px] h-[60px] rounded-[18px] border-none cursor-pointer font-inherit transition-all duration-200 text-white bg-red-500 shadow-[4px_4px_12px_rgba(239,68,68,0.3),-4px_-4px_12px_rgba(255,255,255,0.8)] max-[440px]:w-[52px] max-[440px]:h-[52px] max-[440px]:rounded-[14px] hover:bg-red-600 hover:shadow-[6px_6px_16px_rgba(239,68,68,0.4),-6px_-6px_16px_rgba(255,255,255,0.9)]"
        >
          <PhoneOff size={22} />
          <span className="text-[0.6rem] font-semibold uppercase tracking-wider">End</span>
        </button>
      </div>

      {/* Hidden default controls */}
      <div className="hidden">
        <VoiceAssistantControlBar />
      </div>
    </div>
  );
}

/* ───────────────────────── Page Component ───────────────────────── */

const UserLiveKitCallPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  const livekitUrl = queryParams.get('livekitUrl');
  const agentLabel = queryParams.get('agentName') || 'AI Assistant';
  const agentAvatarUrl =
    queryParams.get('agentAvatar') || 'Gemini_Generated_Image_fyw2tfyw2tfyw2tf-removebg-preview.png';

  const [roomToken, setRoomToken] = useState<string | null>(null);
  const [shouldConnect, setShouldConnect] = useState(true);

  useEffect(() => {
    if (token) {
      setRoomToken(token);
    } else {
      console.error('[UserLiveKitCallPage] LiveKit token not found in URL.');
    }
  }, [token]);

  if (!roomToken || !livekitUrl) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 text-gray-500 text-lg">
        Loading call…
      </div>
    );
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
    <div className="w-screen h-screen">
      <LiveKitRoom
        video={false}
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <NeuCallUI
                agentLabel={agentLabel}
                agentAvatarUrl={agentAvatarUrl}
                onDisconnect={handleDisconnect}
                onOpenForm={handleOpenForm}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </LiveKitRoom>
    </div>
  );
};

export default UserLiveKitCallPage;

