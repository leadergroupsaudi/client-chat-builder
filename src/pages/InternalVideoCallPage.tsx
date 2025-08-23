
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';

const InternalVideoCallPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const livekitToken = queryParams.get('livekitToken');
  const livekitUrl = queryParams.get('livekitUrl');
  const roomName = queryParams.get('roomName');
  const channelId = queryParams.get('channelId'); // New: to connect to internal chat WebSocket

  const [roomToken, setRoomToken] = useState<string | null>(null);

  useEffect(() => {
    if (livekitToken) {
      setRoomToken(livekitToken);
    } else {
      console.error("LiveKit token not found in URL.");
    }
  }, [livekitToken]);

  if (!roomToken || !livekitUrl || !roomName) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading internal video call...</div>;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <LiveKitRoom
        video={true}
        audio={true}
        token={roomToken}
        serverUrl={livekitUrl}
        data-lk-theme="default"
        connectOptions={{ autoSubscribe: true }}
        roomName={roomName}
        // Additional props for internal chat integration can be passed here if needed
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
};

export default InternalVideoCallPage;
