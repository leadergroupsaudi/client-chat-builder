import React, { useState, useEffect, useRef } from 'react';
import { getApiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Upload, X, MapPin, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import LocationPicker from './LocationPicker';

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

    // Multi-file state - just one file now
    const [selectedFile1, setSelectedFile1] = useState<File | null>(null);

    // Manual Location state
    const [manualLocation, setManualLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showMap, setShowMap] = useState(false);

    // Conversation history state
    const [transcript, setTranscript] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [sessionId, setSessionId] = useState("");

    // Refs for listeners to avoid stale closures
    const isVisibleRef = useRef(isVisible);
    const transcriptRef = useRef(transcript);
    const isSubmittedRef = useRef(false); // Track if already submitted to prevent disconnect fallback

    // Sync refs with state
    useEffect(() => {
        isVisibleRef.current = isVisible;
    }, [isVisible]);

    useEffect(() => {
        transcriptRef.current = transcript;
    }, [transcript]);

    // Safer context access
    let room: any;
    try {
        room = useRoomContext();
    } catch (e) {
        return null; // Don't render anything if outside LiveKitRoom
    }

    // --- CAPTURE SESSION ID EARLY ---
    useEffect(() => {
        if (!room) return;

        // Try room name first
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

        // Try metadata fallback
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

    // --- TRANSCRIPTION & SIGNAL & DISCONNECT LISTENER ---
    useEffect(() => {
        if (!room) {
            console.log("[LiveKitPopupForm] NO ROOM FOUND - Listener cannot attach");
            return;
        }

        console.log("[LiveKitPopupForm] Attaching listeners to room:", room.name);

        // 1. Accumulate transcription history (ONLY FINAL SEGMENTS)
        const handleTranscription = (segments: any[]) => {
            // Filter only for final segments to avoid messy repeating logs
            const finalSegments = segments.filter(s => s.final);
            const newText = finalSegments.map(s => s.text).join(" ");

            if (newText.trim()) {
                setTranscript(prev => prev + (prev ? "\n" : "") + newText.trim());

                // TRIGGER CHECK: If agent says the magic words, open form immediately
                if (newText.toLowerCase().includes("opened the report form for you")) {
                    console.warn("[LiveKitPopupForm] MAGIC PHRASE DETECTED IN TRANSCRIPT!");
                    if (!isVisibleRef.current && !isSubmittedRef.current) {
                        setIsVisible(true);
                        toast.info("Agent opened report form", { duration: 5000 });
                    }
                }
            }
        };

        // 2. Handle programmatic trigger (opening the form)
        const handleDataReceived = (payload: Uint8Array, participant?: any, kind?: any, topic?: string) => {
            const decoder = new TextDecoder();
            const rawMessage = decoder.decode(payload).trim();
            const senderId = participant?.identity || "unknown";

            console.log(`[LiveKitPopupForm] Incoming: "${rawMessage}" | Topic: "${topic}" | From: ${senderId}`);

            try {
                // Try to parse as JSON first (contains AI data)
                const data = JSON.parse(rawMessage);
                if (data.type === "OPEN_FORM" || data.type === "FORM_TRIGGER") {
                    console.warn("[LiveKitPopupForm] JSON SIGNAL RECEIVED!", data);

                    // Merge new data into existing aiData state
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

        // 3. Fallback: Trigger on disconnect if info was gathered
        const handleDisconnected = (reason?: any) => {
            console.warn("[LiveKitPopupForm] DISCONNECT EVENT. Reason:", reason,
                "Visible:", isVisibleRef.current,
                "Submitted:", isSubmittedRef.current,
                "Transcript Length:", transcriptRef.current.length);

            // If the agent hasn't already triggered the form, and we haven't submitted successfully, do it now fallback
            if (!isVisibleRef.current && !isSubmittedRef.current && transcriptRef.current.length > 5) {
                console.info("[LiveKitPopupForm] Triggering form via DISCONNECT FALLBACK");
                setIsVisible(true);
                toast.info("Call ended - showing report form");
            }
        };

        room.on(RoomEvent.TranscriptionReceived, handleTranscription);
        room.on(RoomEvent.DataReceived, handleDataReceived);
        room.on(RoomEvent.Disconnected, handleDisconnected);

        // Debug: Log all room occupants
        console.log("[LiveKitPopupForm] Participants in room:", Array.from(room.remoteParticipants.values()).map((p: any) => p.identity));

        return () => {
            console.log("[LiveKitPopupForm] Detaching listeners");
            room.off(RoomEvent.TranscriptionReceived, handleTranscription);
            room.off(RoomEvent.DataReceived, handleDataReceived);
            room.off(RoomEvent.Disconnected, handleDisconnected);
        };
    }, [room]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsUploading(true);
        isSubmittedRef.current = true; // Mark as submitted to prevent duplicate popup

        console.log("[LiveKitPopupForm] SUBMITTING AI DATA:", aiData);

        const formData = new FormData();

        // Pass conversation transcript
        formData.append("conversation", transcript);

        // Map AI-extracted data (from agent signal)
        if (aiData) {
            if (aiData.caller_name) formData.append("caller_name", aiData.caller_name);
            if (aiData.classification) formData.append("classification", aiData.classification);
            if (aiData.location) formData.append("location_ai", aiData.location);
            if (aiData.description) formData.append("description", aiData.description);
            if (aiData.criticality) formData.append("criticality", aiData.criticality);
        }

        // Pass manual location if picked via LocationPicker
        if (manualLocation) {
            formData.append("latitude", manualLocation.lat.toString());
            formData.append("longitude", manualLocation.lng.toString());
        }

        // Use captured session_id
        if (sessionId) {
            formData.append("session_id", sessionId);
        }

        // Add file 1 if selected
        if (selectedFile1) formData.append("file1", selectedFile1);

        try {
            const response = await fetch(getApiUrl("/api/v1/voice-workflow/upload-data"), {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                toast.success("Report submitted successfully!");

                // Notify agent via signal
                if (room) {
                    try {
                        const signal = JSON.stringify({
                            type: "FORM_DONE",
                            timestamp: new Date().toISOString()
                        });
                        await room.localParticipant.publishData(
                            new TextEncoder().encode(signal),
                            { reliable: true }
                        );
                    } catch (publishErr) {
                        console.error("Failed to notify agent:", publishErr);
                    }
                }

                // Reset and close
                setTimeout(() => {
                    setIsVisible(false);
                    setIsUploading(false);
                    // Clear files only, maybe keep other info for debug if needed
                    setSelectedFile1(null);
                    setSelectedFile2(null);
                }, 1500);
            } else {
                toast.error("Server Error: " + response.statusText);
                setIsUploading(false);
            }
        } catch (error) {
            console.error("Upload network error", error);
            toast.error("Network Error: Could not connect to server");
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
                                        {/* File 1 */}
                                        <div className="relative h-32 border-2 border-dashed border-zinc-700 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 hover:border-blue-500/50 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group">
                                            <input type="file" id="f1" className="hidden" onChange={(e) => setSelectedFile1(e.target.files?.[0] || null)} />
                                            <label htmlFor="f1" className="w-full h-full flex flex-col items-center justify-center p-4 cursor-pointer">
                                                {selectedFile1 ? (
                                                    <>
                                                        <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                                                        <span className="text-xs font-medium truncate w-full px-2 text-center text-zinc-300">{selectedFile1.name}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="h-8 w-8 text-zinc-500 mb-2 group-hover:text-blue-400 transition-colors" />
                                                        <span className="text-xs font-semibold text-zinc-400">Add File</span>
                                                    </>
                                                )}
                                            </label>
                                        </div>

                                        {/* Location Picker instead of File 2 */}
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
                                                        <span className="text-[10px] text-zinc-500">Location Set</span>
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
                                    <p className="text-[10px] text-zinc-500 text-center italic">
                                        Your conversation and agent findings are being automatically saved.
                                    </p>
                                </div>
                            </CardContent>

                            <CardFooter className="flex gap-2 pt-4">
                                <Button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                                    disabled={isUploading}
                                >
                                    {isUploading ? "Uploading..." : "Submit to Server"}
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

