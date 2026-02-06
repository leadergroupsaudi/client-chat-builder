import React, { useState, useEffect, useRef } from 'react';
import { getApiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Upload, X, MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import LocationPicker from './LocationPicker';

// Note: Automax uploads now go through backend proxy at /api/v1/automax/upload-attachment
// This bypasses browser CSP restrictions

export const LiveKitPopupForm = () => {
    const [isVisible, setIsVisible] = useState(false);

    // AI data state (captured from agent signal)
    const [aiData, setAiData] = useState<{
        caller_name?: string;
        classification?: string;
        location?: string;
        description?: string;
        criticality?: string;
    } | null>(null);

    // File and Automax state
    const [selectedFile1, setSelectedFile1] = useState<File | null>(null);
    const [attachmentId, setAttachmentId] = useState<string>("");
    const [isUploadingToAutomax, setIsUploadingToAutomax] = useState(false);

    // Manual Location state
    const [manualLocation, setManualLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showMap, setShowMap] = useState(false);

    // Conversation history state
    const [transcript, setTranscript] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [sessionId, setSessionId] = useState("");
    const [dataSentToMcp, setDataSentToMcp] = useState(false);

    // Refs for listeners to avoid stale closures
    const isVisibleRef = useRef(isVisible);
    const transcriptRef = useRef(transcript);
    const isSubmittedRef = useRef(false);

    // Sync refs with state
    useEffect(() => {
        isVisibleRef.current = isVisible;
    }, [isVisible]);

    useEffect(() => {
        transcriptRef.current = transcript;
    }, [transcript]);

    // Allow external UI to open the form without touching form logic
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleOpenForm = () => {
            if (!isVisibleRef.current && !isSubmittedRef.current) {
                setIsVisible(true);
                toast.info("Opening report form");
            }
        };

        window.addEventListener('livekit:open-form', handleOpenForm as EventListener);
        return () => window.removeEventListener('livekit:open-form', handleOpenForm as EventListener);
    }, []);

    // Safer context access
    let room: any;
    try {
        room = useRoomContext();
    } catch (e) {
        return null;
    }

    // Check if submit should be enabled
    const isSubmitEnabled = attachmentId && manualLocation && !isUploading && !isUploadingToAutomax;

    // --- CAPTURE SESSION ID EARLY ---
    useEffect(() => {
        if (!room) return;

        if (room.name && !sessionId) {
            const sid = room.name.startsWith("voice_workflow_")
                ? room.name.replace("voice_workflow_", "")
                : room.name;
            if (sid && sid !== "default") {
                setSessionId(sid);
                console.log("[LiveKitPopupForm] Captured SessionID from Name:", sid);
                return;
            }
        }

        if (room.metadata && !sessionId) {
            try {
                const meta = JSON.parse(room.metadata);
                if (meta.session_id) {
                    setSessionId(meta.session_id);
                    console.log("[LiveKitPopupForm] Captured SessionID from Metadata:", meta.session_id);
                }
            } catch (e) {
                // Ignore parse errors
            }
        }
    }, [room, sessionId, room?.metadata]);

    // --- Upload Image via Backend Proxy (bypasses CSP) ---
    const uploadToAutomax = async (file: File): Promise<string | null> => {
        setIsUploadingToAutomax(true);
        try {
            console.log("[LiveKitPopupForm] Uploading via backend proxy:", file.name);

            // Create form data for upload
            const formData = new FormData();
            formData.append('file', file);

            // Call our backend proxy instead of Automax directly
            const response = await fetch(getApiUrl("/api/v1/automax/upload-attachment"), {
                method: 'POST',
                body: formData
            });

            console.log("[LiveKitPopupForm] Proxy response status:", response.status);

            if (response.ok) {
                const data = await response.json();
                console.log("[LiveKitPopupForm] Proxy response data:", data);

                if (data.success && data.attachment_id) {
                    console.log("[LiveKitPopupForm] Attachment uploaded, ID:", data.attachment_id);
                    toast.success("Image uploaded successfully!");
                    return data.attachment_id;
                } else {
                    console.error("[LiveKitPopupForm] No attachment_id in response:", data);
                    toast.error("Upload succeeded but no attachment ID returned");
                    return null;
                }
            } else {
                const errorText = await response.text();
                console.error("[LiveKitPopupForm] Upload failed:", response.status, errorText);
                toast.error(`Failed to upload: ${response.status}`);
                return null;
            }
        } catch (error) {
            console.error("[LiveKitPopupForm] Upload error:", error);
            toast.error("Error uploading: " + (error as Error).message);
            return null;
        } finally {
            setIsUploadingToAutomax(false);
        }
    };

    // --- Handle File Selection (triggers Automax upload) ---
    const handleFileSelect = async (file: File | null) => {
        setSelectedFile1(file);
        setAttachmentId(""); // Reset attachment ID

        if (file) {
            console.log("[LiveKitPopupForm] File selected, uploading to Automax...");
            const id = await uploadToAutomax(file);
            if (id) {
                setAttachmentId(id);
            }
        }
    };

    // --- TRANSCRIPTION & SIGNAL & DISCONNECT LISTENER ---
    useEffect(() => {
        if (!room) {
            console.log("[LiveKitPopupForm] NO ROOM FOUND - Listener cannot attach");
            return;
        }

        console.log("[LiveKitPopupForm] Attaching listeners to room:", room.name);

        const handleTranscription = (segments: any[]) => {
            const finalSegments = segments.filter(s => s.final);
            const newText = finalSegments.map(s => s.text).join(" ");

            if (newText.trim()) {
                setTranscript(prev => prev + (prev ? "\n" : "") + newText.trim());

                if (newText.toLowerCase().includes("opened the report form for you")) {
                    console.warn("[LiveKitPopupForm] MAGIC PHRASE DETECTED IN TRANSCRIPT!");
                    if (!isVisibleRef.current && !isSubmittedRef.current) {
                        setIsVisible(true);
                        toast.info("Agent opened report form", { duration: 5000 });
                    }
                }
            }
        };

        const handleDataReceived = (payload: Uint8Array, participant?: any, kind?: any, topic?: string) => {
            const decoder = new TextDecoder();
            const rawMessage = decoder.decode(payload).trim();
            const senderId = participant?.identity || "unknown";

            console.log(`[LiveKitPopupForm] Incoming: "${rawMessage}" | Topic: "${topic}" | From: ${senderId}`);

            try {
                const data = JSON.parse(rawMessage);
                if (data.type === "OPEN_FORM" || data.type === "FORM_TRIGGER") {
                    console.warn("[LiveKitPopupForm] JSON SIGNAL RECEIVED!", data);
                    setAiData(prev => ({ ...prev, ...data }));

                    if (!isVisibleRef.current && !isSubmittedRef.current) {
                        setIsVisible(true);
                        toast.info("Agent opened report form with captured data");
                    }
                    return;
                }
            } catch (e) {
                // Not JSON, continue with string match
            }

            const isMatch =
                rawMessage.toUpperCase().includes("OPEN_FORM") ||
                topic === "form_trigger" ||
                rawMessage.includes("form_trigger");

            if (isMatch) {
                console.warn("[LiveKitPopupForm] TRIGGER MATCHED! Ref:", isVisibleRef.current);
                if (!isVisibleRef.current && !isSubmittedRef.current) {
                    setIsVisible(true);
                    toast.info("Agent opened report form", { duration: 4000 });
                }
            }
        };

        const handleDisconnected = (reason?: any) => {
            console.warn("[LiveKitPopupForm] DISCONNECT EVENT. Reason:", reason,
                "Visible:", isVisibleRef.current,
                "Submitted:", isSubmittedRef.current,
                "Transcript Length:", transcriptRef.current.length);

            if (!isVisibleRef.current && !isSubmittedRef.current && transcriptRef.current.length > 5) {
                console.info("[LiveKitPopupForm] Triggering form via DISCONNECT FALLBACK");
                setIsVisible(true);
                toast.info("Call ended - showing report form");
            }
        };

        room.on(RoomEvent.TranscriptionReceived, handleTranscription);
        room.on(RoomEvent.DataReceived, handleDataReceived);
        room.on(RoomEvent.Disconnected, handleDisconnected);

        console.log("[LiveKitPopupForm] Participants in room:", Array.from(room.remoteParticipants.values()).map((p: any) => p.identity));

        return () => {
            console.log("[LiveKitPopupForm] Detaching listeners");
            room.off(RoomEvent.TranscriptionReceived, handleTranscription);
            room.off(RoomEvent.DataReceived, handleDataReceived);
            room.off(RoomEvent.Disconnected, handleDisconnected);
        };
    }, [room]);

    // --- SEND DATA TO MCP VIA LIVEKIT ---
    const sendDataToMcp = async () => {
        if (!room || !attachmentId || !manualLocation) {
            toast.error("Please upload an image and set location first");
            return false;
        }

        try {
            const frontendData = {
                type: "FRONTEND_DATA",
                attachment_id: attachmentId,
                latitude: manualLocation.lat,
                longitude: manualLocation.lng,
                session_id: sessionId,
                timestamp: new Date().toISOString()
            };

            console.log("[LiveKitPopupForm] Sending FRONTEND_DATA to MCP:", frontendData);

            await room.localParticipant.publishData(
                new TextEncoder().encode(JSON.stringify(frontendData)),
                { reliable: true }
            );

            toast.success("Data sent to agent!");
            setDataSentToMcp(true);
            return true;
        } catch (error) {
            console.error("[LiveKitPopupForm] Failed to send data to MCP:", error);
            toast.error("Failed to send data to agent");
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!attachmentId || !manualLocation) {
            toast.error("Please upload an image and set location first");
            return;
        }

        setIsUploading(true);
        isSubmittedRef.current = true;

        console.log("[LiveKitPopupForm] SUBMITTING - Sending data to MCP");

        // Send data directly to MCP via LiveKit
        const success = await sendDataToMcp();

        if (success) {
            toast.success("Data sent to agent! Incident will be created.");

            // Also save to backend for logging
            const formData = new FormData();
            formData.append("conversation", transcript);
            if (aiData) {
                if (aiData.caller_name) formData.append("caller_name", aiData.caller_name);
                if (aiData.classification) formData.append("classification", aiData.classification);
                if (aiData.location) formData.append("location_ai", aiData.location);
                if (aiData.description) formData.append("description", aiData.description);
                if (aiData.criticality) formData.append("criticality", aiData.criticality);
            }
            if (manualLocation) {
                formData.append("latitude", manualLocation.lat.toString());
                formData.append("longitude", manualLocation.lng.toString());
            }
            if (sessionId) formData.append("session_id", sessionId);
            if (selectedFile1) formData.append("file1", selectedFile1);

            try {
                await fetch(getApiUrl("/api/v1/voice-workflow/upload-data"), {
                    method: "POST",
                    body: formData,
                });
            } catch (error) {
                console.warn("Backend logging failed (non-critical):", error);
            }

            setTimeout(() => {
                setIsVisible(false);
                setIsUploading(false);
                setSelectedFile1(null);
                setAttachmentId("");
                setManualLocation(null);
                setDataSentToMcp(false);
            }, 1500);
        } else {
            setIsUploading(false);
        }
    };

    return (
        <>
            {/* MANUAL TRIGGER BUTTON */}
            {!isVisible && (
                <div className="fixed top-20 right-4 z-50">
                    <Button
                        onClick={() => setIsVisible(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center gap-2 px-4 py-2 rounded-full"
                    >
                        <MapPin className="h-4 w-4" />
                        Report Incident
                    </Button>
                </div>
            )}

            {/* THE POPUP MODAL */}
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-md bg-zinc-900 text-white border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-300">
                        <CardHeader className="relative">
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-blue-500" />
                                Submit Report & Files
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-4 top-4 text-zinc-400 hover:text-white"
                                onClick={() => setIsVisible(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>

                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-6 pt-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-zinc-300">Upload Attachments</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* File 1 - with Automax upload status */}
                                        <div className="relative h-32 border-2 border-dashed border-zinc-700 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 hover:border-blue-500/50 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group">
                                            <input
                                                type="file"
                                                id="f1"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                                            />
                                            <label htmlFor="f1" className="w-full h-full flex flex-col items-center justify-center p-4 cursor-pointer">
                                                {isUploadingToAutomax ? (
                                                    <>
                                                        <Loader2 className="h-8 w-8 text-blue-500 mb-2 animate-spin" />
                                                        <span className="text-xs font-medium text-zinc-300">Uploading...</span>
                                                    </>
                                                ) : attachmentId ? (
                                                    <>
                                                        <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                                                        <span className="text-xs font-medium truncate w-full px-2 text-center text-zinc-300">{selectedFile1?.name}</span>
                                                        <span className="text-[10px] text-green-400">Uploaded ✓</span>
                                                    </>
                                                ) : selectedFile1 ? (
                                                    <>
                                                        <Loader2 className="h-8 w-8 text-yellow-500 mb-2 animate-spin" />
                                                        <span className="text-xs font-medium text-zinc-300">Processing...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="h-8 w-8 text-zinc-500 mb-2 group-hover:text-blue-400 transition-colors" />
                                                        <span className="text-xs font-semibold text-zinc-400">Add Photo</span>
                                                    </>
                                                )}
                                            </label>
                                        </div>

                                        {/* Location Picker */}
                                        <div
                                            onClick={() => setShowMap(true)}
                                            className="relative h-32 border-2 border-dashed border-zinc-700 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 hover:border-blue-500/50 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group"
                                        >
                                            <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                                {manualLocation ? (
                                                    <>
                                                        <CheckCircle2 className="h-8 w-8 text-blue-500 mb-2" />
                                                        <span className="text-[10px] font-medium text-zinc-300">
                                                            {manualLocation.lat.toFixed(4)}, {manualLocation.lng.toFixed(4)}
                                                        </span>
                                                        <span className="text-[10px] text-green-400">Location Set ✓</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <MapPin className="h-8 w-8 text-zinc-500 mb-2 group-hover:text-blue-400 transition-colors" />
                                                        <span className="text-xs font-semibold text-zinc-400">Set Location</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status message */}
                                    <p className="text-[10px] text-zinc-500 text-center italic">
                                        {!attachmentId && !manualLocation
                                            ? "Upload a photo and set location to enable submit"
                                            : !attachmentId
                                                ? "Upload a photo to enable submit"
                                                : !manualLocation
                                                    ? "Set location to enable submit"
                                                    : "Ready to submit!"}
                                    </p>
                                </div>
                            </CardContent>

                            <CardFooter className="flex gap-2 pt-4">
                                <Button
                                    type="submit"
                                    className={`flex-1 text-white text-sm ${isSubmitEnabled
                                        ? 'bg-blue-600 hover:bg-blue-700'
                                        : 'bg-zinc-600 cursor-not-allowed'}`}
                                    disabled={!isSubmitEnabled}
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Sending to Agent...
                                        </>
                                    ) : isSubmitEnabled ? (
                                        "Send to Agent"
                                    ) : (
                                        "Complete Required Fields"
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 border-zinc-700 text-zinc-300 text-sm"
                                    onClick={() => setIsVisible(false)}
                                    disabled={isUploading}
                                >
                                    Cancel
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            )}

            {/* MAP MODAL */}
            {showMap && (
                <LocationPicker
                    onClose={() => setShowMap(false)}
                    onLocationSelect={(lat, lng) => console.log("Picking:", lat, lng)}
                    onConfirm={(lat, lng) => {
                        setManualLocation({ lat, lng });
                        setShowMap(false);
                        toast.success("Location pinpointed!");
                    }}
                    darkMode={true}
                />
            )}
        </>
    );
};
