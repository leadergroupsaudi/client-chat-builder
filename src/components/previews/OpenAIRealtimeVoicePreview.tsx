'use client';

/**
 * OpenAIRealtimeVoicePreview
 *
 * Voice call UI powered by OpenAI Realtime API via WebRTC.
 * The browser connects directly to OpenAI (no server audio relay) using an
 * ephemeral token fetched from the backend — the same pattern as LiveKit but
 * without requiring the LiveKit SDK.
 *
 * Props mirror VoiceAgentPreview so they can be swapped in WidgetUI.tsx.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare, Mic, MicOff, PhoneOff, User } from 'lucide-react';
import { Button } from '../ui/button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OpenAIRealtimeVoicePreviewProps {
  shouldConnect: boolean;
  setShouldConnect: (connect: boolean) => void;
  customization: {
    agent_avatar_url?: string;
    header_title?: string;
    primary_color?: string;
    [key: string]: any;
  };
  backendUrl?: string;
  companyId: string | number;
  agentId: string | number;
  sessionId: string;
}

// ---------------------------------------------------------------------------
// Heartbeat waveform
// ---------------------------------------------------------------------------

function HeartbeatWaveform({ isActive }: { isActive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cy = H / 2;
    const segW = 80;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.beginPath();
      ctx.strokeStyle = '#0099AA';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#0099AA';
      ctx.shadowBlur = isActive ? 15 : 5;

      const off = offsetRef.current % segW;
      for (let x = -segW + off; x < W + segW; x++) {
        const lx = ((x + segW * 10) % segW);
        let y = cy;
        if (isActive) {
          if (lx > 20 && lx < 25) y = cy - 8;
          else if (lx > 25 && lx < 30) y = cy + 25 + Math.random() * 5;
          else if (lx > 30 && lx < 35) y = cy - 35 - Math.random() * 10;
          else if (lx > 35 && lx < 40) y = cy + 15 + Math.random() * 3;
          else if (lx > 40 && lx < 45) y = cy - 5;
          else if (lx > 55 && lx < 60) y = cy - 10 - Math.random() * 5;
          else if (lx > 60 && lx < 65) y = cy + 8 + Math.random() * 3;
        }
        x === -segW + off ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      if (isActive) offsetRef.current += 2;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
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

// ---------------------------------------------------------------------------
// Call timer
// ---------------------------------------------------------------------------

function CallTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime]);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return (
    <div className="px-4 py-2 bg-zinc-900/90 rounded-full text-zinc-300 font-mono text-sm border border-zinc-700/50">
      {pad(h)}:{pad(m)}:{pad(s)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Circular avatar
// ---------------------------------------------------------------------------

function CircularAvatar({
  imageUrl, label, isAI = false, isActive = false, backendUrl,
}: {
  imageUrl?: string; label: string; isAI?: boolean; isActive?: boolean; backendUrl?: string;
}) {
  const proxied = (url: string) =>
    backendUrl ? `${backendUrl}/api/v1/proxy/image-proxy?url=${encodeURIComponent(url)}` : url;

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        animate={isActive ? { scale: [1, 1.02, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className={`relative w-32 h-32 rounded-full overflow-hidden border-2 ${isActive ? 'border-cyan-600 shadow-lg shadow-cyan-900/50' : 'border-zinc-600/50'}`}
      >
        {imageUrl ? (
          <img src={isAI ? proxied(imageUrl) : imageUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            {isAI ? (
              <svg viewBox="0 0 100 100" className="w-16 h-16 text-cyan-700">
                <circle cx="50" cy="35" r="20" fill="currentColor" opacity="0.7" />
                <path d="M25 80 Q50 60 75 80" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
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

// ---------------------------------------------------------------------------
// Connection states
// ---------------------------------------------------------------------------

type CallState = 'idle' | 'requesting_mic' | 'connecting' | 'thinking' | 'speaking' | 'listening' | 'error';

// ---------------------------------------------------------------------------
// Main component — WebRTC connection to OpenAI Realtime
// ---------------------------------------------------------------------------

export const OpenAIRealtimeVoicePreview: React.FC<OpenAIRealtimeVoicePreviewProps> = ({
  shouldConnect,
  setShouldConnect,
  customization,
  backendUrl,
  companyId,
  agentId,
  sessionId: _sessionId,
}) => {
  const [callState, setCallState] = useState<CallState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [startTime] = useState(Date.now());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTools, setActiveTools] = useState<string[]>([]);

  // WebRTC refs
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const keepErrorStateRef = useRef(false);

  // ------------------------------------------------------------------
  // Tool call execution — relays AI tool calls to the Cintrix backend
  // ------------------------------------------------------------------

  const handleToolCall = useCallback(async (
    toolName: string,
    argsStr: string,
    callId: string,
  ) => {
    // end_session: close the call locally, then ack to OpenAI
    if (toolName === 'end_session') {
      dcRef.current?.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: callId,
          output: JSON.stringify({ message: 'Session ended.' }),
        },
      }));
      // Trigger final response then let the disconnect happen naturally
      dcRef.current?.send(JSON.stringify({ type: 'response.create' }));
      return;
    }

    if (!backendUrl) return;

    let args: Record<string, unknown> = {};
    try { args = JSON.parse(argsStr || '{}'); } catch { /* malformed args — use empty */ }

    setCallState('thinking');

    try {
      const res = await fetch(`${backendUrl}/api/v1/ws/public/voice/tools/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-ID': String(companyId),
        },
        body: JSON.stringify({
          tool_name: toolName,
          arguments: args,
          session_id: _sessionId || `voice-${agentId}`,
          agent_id: typeof agentId === 'string' ? parseInt(agentId, 10) : agentId,
        }),
      });

      const result = res.ok ? await res.json() : { error: `HTTP ${res.status}` };

      dcRef.current?.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: callId,
          output: JSON.stringify(result?.result ?? result),
        },
      }));
    } catch (err) {
      console.error('[RealtimeWebRTC] Tool execution error:', err);
      dcRef.current?.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: callId,
          output: JSON.stringify({ error: 'Tool execution failed.' }),
        },
      }));
    }

    // Ask OpenAI to continue the conversation with the tool result
    dcRef.current?.send(JSON.stringify({ type: 'response.create' }));
  }, [backendUrl, companyId, agentId, _sessionId]);

  // Keep a stable ref so the data channel handler always calls the latest version
  const handleToolCallRef = useRef(handleToolCall);
  handleToolCallRef.current = handleToolCall;

  // ------------------------------------------------------------------
  // Data channel event handler — tracks AI speaking state + tool calls
  // ------------------------------------------------------------------

  const handleDataChannelMessage = useCallback((event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data as string);
      const t = msg.type as string;

      if (t === 'response.audio.delta') {
        setCallState('speaking');
      } else if (t === 'response.created') {
        setCallState('thinking');
      } else if (t === 'response.audio.done' || t === 'response.done') {
        setCallState('listening');
      } else if (t === 'input_audio_buffer.speech_started') {
        setCallState('listening');
      } else if (t === 'input_audio_buffer.committed') {
        setCallState('thinking');
      } else if (t === 'session.created' || t === 'session.updated') {
        setCallState('listening');
      } else if (t === 'response.function_call_arguments.done') {
        // AI has finished emitting arguments for a tool call — execute it
        handleToolCallRef.current(
          msg.name as string,
          msg.arguments as string,
          msg.call_id as string,
        );
      } else if (t === 'error') {
        console.error('[RealtimeWebRTC] API error:', msg.error);
        keepErrorStateRef.current = true;
        setErrorMessage(msg.error?.message || 'Realtime API error');
        setCallState('error');
      }
    } catch {
      // non-JSON — ignore
    }
  }, []);

  // ------------------------------------------------------------------
  // Connect via WebRTC
  // ------------------------------------------------------------------

  const connect = useCallback(async () => {
    if (!backendUrl) return;
    keepErrorStateRef.current = false;
    setErrorMessage(null);
    setCallState('connecting');

    try {
      // 1. Fetch ephemeral token + session config from backend
      const tokenRes = await fetch(
        `${backendUrl}/api/v1/ws/public/voice/realtime-token?company_id=${companyId}&agent_id=${agentId}`
      );
      if (!tokenRes.ok) throw new Error('Failed to get realtime session token');
      const { token, greeting, tools: sessionTools } = await tokenRes.json();
      if (Array.isArray(sessionTools)) setActiveTools(sessionTools);

      // 2. Create RTCPeerConnection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // 3. Remote audio → hidden <audio> element (browser plays it automatically)
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      (audioEl as HTMLAudioElement & { playsInline: boolean }).playsInline = true;
      audioEl.preload = 'auto';
      audioEl.style.display = 'none';
      document.body.appendChild(audioEl);
      audioElRef.current = audioEl;

      pc.ontrack = (event) => {
        if (!event.streams[0]) return;
        audioEl.srcObject = event.streams[0];
        const playPromise = audioEl.play();
        if (playPromise) {
          playPromise.catch((err) => {
            console.error('[RealtimeWebRTC] Audio playback failed:', err);
            keepErrorStateRef.current = true;
            setErrorMessage('Connected, but browser blocked audio playback');
            setCallState('error');
          });
        }
      };

      // 4. Microphone input
      setCallState('requesting_mic');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      setCallState('connecting');

      // 5. Data channel for session events
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.onopen = () => {
        setCallState('listening');
        // Keep the backend-provided instructions intact. The ephemeral session
        // token already includes the agent/system prompt, so we only request
        // audio output here and then trigger the greeting.
        const openingLine = greeting || 'Hello! How can I help you today?';
        dc.send(JSON.stringify({
          type: 'session.update',
          session: {
            output_modalities: ['audio'],
          },
        }));
        dc.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [{ type: 'input_text', text: '(call connected)' }],
          },
        }));
        dc.send(JSON.stringify({
          type: 'response.create',
          response: {
            output_modalities: ['audio'],
            instructions: `Start the conversation by greeting the user. Your opening line must be: "${openingLine}"`,
          },
        }));
      };

      dc.onmessage = handleDataChannelMessage;

      dc.onclose = () => {
        if (!keepErrorStateRef.current) {
          setCallState('idle');
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setCallState('listening');
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          keepErrorStateRef.current = true;
          setErrorMessage(`Peer connection ${pc.connectionState}`);
          setCallState('error');
        }
      };

      // 6. SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 7. Exchange SDP with OpenAI
      const sdpRes = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      });

      if (!sdpRes.ok) {
        const errorText = await sdpRes.text();
        throw new Error(`OpenAI SDP exchange failed: ${sdpRes.status} ${errorText}`);
      }
      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

    } catch (err) {
      console.error('[RealtimeWebRTC] Connection error:', err);
      keepErrorStateRef.current = true;
      setErrorMessage(err instanceof Error ? err.message : 'Failed to connect to OpenAI Realtime');
      setCallState('error');
      cleanup();
    }
  }, [backendUrl, companyId, agentId, customization.system_prompt, handleDataChannelMessage]);

  // ------------------------------------------------------------------
  // Cleanup
  // ------------------------------------------------------------------

  const cleanup = useCallback(() => {
    dcRef.current?.close();
    dcRef.current = null;

    pcRef.current?.close();
    pcRef.current = null;

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
      audioElRef.current.remove();
      audioElRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    keepErrorStateRef.current = false;
    setErrorMessage(null);
    cleanup();
    setCallState('idle');
    setShouldConnect(false);
  }, [cleanup, setShouldConnect]);

  // ------------------------------------------------------------------
  // Mute toggle
  // ------------------------------------------------------------------

  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = isMuted; // flip: if muted, re-enable
    });
    setIsMuted((prev) => !prev);
  }, [isMuted]);

  // ------------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------------

  useEffect(() => {
    if (shouldConnect && callState === 'idle') {
      connect();
    }
    if (!shouldConnect && callState !== 'idle') {
      cleanup();
      setCallState('idle');
    }
  }, [shouldConnect]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { cleanup(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  const isAISpeaking = callState === 'speaking';
  const isListening = callState === 'listening';

  const statusText: Record<CallState, string> = {
    idle: 'Idle',
    requesting_mic: 'Waiting for microphone…',
    connecting: 'Connecting…',
    thinking: 'Thinking…',
    speaking: 'Speaking…',
    listening: 'Listening…',
    error: 'Connection error',
  };

  return (
    <div className="h-full w-full relative">
      {/* Launch button when not connected */}
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
              className="rounded-full h-16 w-16 shadow-xl hover:scale-110 transition-transform duration-300 flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-600 hover:shadow-purple-500/50"
              onClick={() => setShouldConnect(true)}
            >
              {customization.agent_avatar_url ? (
                <img
                  src={
                    backendUrl
                      ? `${backendUrl}/api/v1/proxy/image-proxy?url=${encodeURIComponent(customization.agent_avatar_url)}`
                      : customization.agent_avatar_url
                  }
                  className="h-full w-full rounded-full object-cover"
                  alt="Agent"
                />
              ) : (
                <MessageSquare className="h-8 w-8 text-white" />
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active call panel */}
      <AnimatePresence>
        {shouldConnect && (
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

              {/* Provider badge */}
              <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-700/50">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400 text-xs font-medium">OpenAI Realtime</span>
              </div>

              {/* Avatars */}
              <div className="flex items-center justify-center gap-8 mt-12 relative w-full">
                <CircularAvatar label="YOU" isAI={false} isActive={isListening} />

                <div className="relative h-40 w-1 bg-zinc-800/50 mx-4">
                  <HeartbeatWaveform isActive={isAISpeaking} />
                </div>

                <CircularAvatar
                  imageUrl={customization.agent_avatar_url}
                  label="AI ASSISTANT"
                  isAI
                  isActive={isAISpeaking}
                  backendUrl={backendUrl}
                />
              </div>

              {/* Status */}
              <div className="text-zinc-500 text-sm capitalize">{statusText[callState]}</div>
              {errorMessage && (
                <div className="max-w-md text-center text-sm text-red-400">
                  {errorMessage}
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-6 mt-4">
                {/* Mute */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className={`w-12 h-12 rounded-full ${isMuted
                    ? 'bg-red-900/40 text-red-500 hover:bg-red-900/60'
                    : 'bg-zinc-800 text-cyan-600 hover:bg-zinc-700'
                  }`}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>

                {/* Hang up */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={disconnect}
                  className="w-14 h-14 rounded-full bg-red-700 hover:bg-red-600 text-white"
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>

                {/* Chat (placeholder) */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12 rounded-full bg-zinc-800 text-cyan-600 hover:bg-zinc-700"
                >
                  <MessageSquare className="w-5 h-5" />
                </Button>
              </div>

              {/* Decorative star */}
              <div className="absolute bottom-4 right-4 text-zinc-700">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                  <path
                    d="M12 2L12 6M12 18L12 22M2 12L6 12M18 12L22 12M5.64 5.64L8.17 8.17M15.83 15.83L18.36 18.36M5.64 18.36L8.17 15.83M15.83 8.17L18.36 5.64"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"
                  />
                </svg>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
