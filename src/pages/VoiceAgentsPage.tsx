import { VOICE_AGENT_URL } from "@/config/env";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";

const VoiceAgentsPage = () => {
  const location = useLocation();
  const iframeSrc = useMemo(() => {
    if (!location.search) return VOICE_AGENT_URL;

    const url = new URL(VOICE_AGENT_URL);
    const incoming = new URLSearchParams(location.search);
    incoming.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    return url.toString();
  }, [location.search]);

  return (
    <div className="h-full w-full flex flex-col" style={{ height: "calc(100vh - 65px)" }}>
      <iframe
        src={iframeSrc}
        className="flex-1 w-full border-0"
        title="Voice Agents Premium"
        allow="microphone; camera"
      />
    </div>
  );
};

export default VoiceAgentsPage;
