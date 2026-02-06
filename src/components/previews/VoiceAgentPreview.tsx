'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  VoiceAssistantControlBar,
} from '@livekit/components-react';
import { MediaDeviceFailure } from 'livekit-client';
import { Button } from '../ui/button';
import { MessageSquare, Mic, MicOff, PhoneOff, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiveKitPopupForm } from '../LiveKitPopupForm';

interface VoiceAgentPreviewProps {
  liveKitToken: string | null;
  shouldConnect: boolean;
  setShouldConnect: (connect: boolean) => void;
  livekitUrl: string;
  customization: any;
  backendUrl?: string;
}

// Heartbeat Waveform Component
function HeartbeatWaveform({ isActive }: { isActive: boolean }) {
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

      // Draw subtle background glow
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, 'rgba(0, 150, 180, 0)');
      gradient.addColorStop(0.5, 'rgba(0, 150, 180, 0.05)');
      gradient.addColorStop(1, 'rgba(0, 150, 180, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw the heartbeat line
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
          // Active heartbeat pattern
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
      width={400}
      height={60}
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-80"
    />
  );
}

// Timer Component
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

// Circular Avatar Component
function CircularAvatar({
  imageUrl,
  label,
  isAI = false,
  isActive = false,
  backendUrl,
}: {
  imageUrl?: string;
  label: string;
  isAI?: boolean;
  isActive?: boolean;
  backendUrl?: string;
}) {
  const getProxiedUrl = (url: string) => {
    if (backendUrl && url) {
      return `${backendUrl}/api/v1/proxy/image-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        animate={isActive ? { scale: [1, 1.02, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className={`relative w-32 h-32 rounded-full overflow-hidden border-2 ${isActive ? 'border-cyan-600 shadow-lg shadow-cyan-900/50' : 'border-zinc-600/50'
          }`}
      >
        {imageUrl ? (
          <img
            src={isAI ? getProxiedUrl(imageUrl) : imageUrl}
            alt={label}
            className="w-full h-full object-cover"
          />
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

        {/* Glow ring for AI when speaking */}
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

// Main HeartbeatVoiceAssistant Component
function HeartbeatVoiceAssistant({
  customization,
  backendUrl,
  onDisconnect,
}: {
  customization: any;
  backendUrl?: string;
  onDisconnect: () => void;
}) {
  const { state, audioTrack } = useVoiceAssistant();
  const [startTime] = useState(Date.now());
  const [isMuted, setIsMuted] = useState(false);

  // Determine if AI is speaking based on state
  const isAISpeaking = state === 'speaking' || state === 'listening';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
    >
      <div
        className="relative w-full max-w-2xl mx-4 rounded-3xl p-8 flex flex-col items-center gap-8 border border-zinc-800/50"
        style={{ background: '#1a1a1a' }}
      >
        {/* Timer */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
          <CallTimer startTime={startTime} />
        </div>

        {/* Avatars Container */}
        <div className="flex items-center justify-center gap-8 mt-12 relative w-full">
          {/* User Avatar */}
          <CircularAvatar label="YOU" isAI={false} isActive={state === 'listening'} />

          {/* Center Divider with Heartbeat */}
          <div className="relative h-40 w-1 bg-zinc-800/50 mx-4">
            <HeartbeatWaveform isActive={isAISpeaking} />
          </div>

          {/* AI Avatar */}
          <CircularAvatar
            imageUrl={customization?.agent_avatar_url}
            label="AI ASSISTANT"
            isAI={true}
            isActive={isAISpeaking}
            backendUrl={backendUrl}
          />
        </div>

        {/* Status Text */}
        <div className="text-zinc-500 text-sm capitalize">
          {state === 'listening' ? 'Listening...' :
            state === 'speaking' ? 'Speaking...' :
              state === 'thinking' ? 'Thinking...' :
                'Connected'}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-6 mt-4">
          {/* Mute Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full ${isMuted
              ? 'bg-red-900/40 text-red-500 hover:bg-red-900/60'
              : 'bg-zinc-800 text-cyan-600 hover:bg-zinc-700'
              }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          {/* Disconnect Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onDisconnect}
            className="w-14 h-14 rounded-full bg-red-700 hover:bg-red-600 text-white"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>

          {/* Chat Button */}
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full bg-zinc-800 text-cyan-600 hover:bg-zinc-700"
          >
            <MessageSquare className="w-5 h-5" />
          </Button>
        </div>

        {/* Hidden LiveKit Components */}
        <div className="hidden">
          <VoiceAssistantControlBar />
        </div>
        <RoomAudioRenderer />

        {/* Decorative Star */}
        <div className="absolute bottom-4 right-4 text-zinc-700">
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M12 2L12 6M12 18L12 22M2 12L6 12M18 12L22 12M5.64 5.64L8.17 8.17M15.83 15.83L18.36 18.36M5.64 18.36L8.17 15.83M15.83 8.17L18.36 5.64"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      </div>
    </motion.div >
  );
}

export const VoiceAgentPreview: React.FC<VoiceAgentPreviewProps> = ({
  liveKitToken,
  shouldConnect,
  setShouldConnect,
  customization,
  backendUrl,
}) => {
  const onDeviceFailure = (e?: MediaDeviceFailure) => {
    console.error(e);
    alert(
      'Error acquiring microphone permissions. Please allow mic access and reload the tab.'
    );
  };

  return (
    <div className="h-full w-full relative">
      <LiveKitRoom
        serverUrl={customization.livekit_url}
        token={liveKitToken}
        connect={shouldConnect}
        audio={true}
        video={false}
        onMediaDeviceFailure={onDeviceFailure}
        onDisconnected={() => setShouldConnect(false)}
      >
        <LiveKitPopupForm />
        {/* Floating button */}
        <AnimatePresence>
          {!shouldConnect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-6 right-6"
            >
              <Button
                className="rounded-full h-16 w-16 shadow-xl hover:scale-110 
                  transition-transform duration-300 flex items-center justify-center
                  bg-gradient-to-br from-purple-600 to-indigo-600 hover:shadow-purple-500/50"
                onClick={() => setShouldConnect(true)}
              >
                {customization.agent_avatar_url ? (
                  <img
                    src={`${backendUrl}/api/v1/proxy/image-proxy?url=${encodeURIComponent(
                      customization.agent_avatar_url
                    )}`}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <MessageSquare className="h-8 w-8 text-white" />
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Heartbeat Voice Assistant Panel */}
        <AnimatePresence>
          {shouldConnect && (
            <HeartbeatVoiceAssistant
              customization={customization}
              backendUrl={backendUrl}
              onDisconnect={() => setShouldConnect(false)}
            />
          )}
        </AnimatePresence>
      </LiveKitRoom>
    </div>
  );
};
