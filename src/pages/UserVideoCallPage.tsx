
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LiveKitRoom,
  VideoConference,
} from '@livekit/components-react';
import '@livekit/components-styles';

const UserVideoCallPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  const livekitUrl = queryParams.get('livekitUrl');

  const [roomToken, setRoomToken] = useState<string | null>(null);
  const [shouldConnect, setShouldConnect] = useState(true);

  useEffect(() => {
    if (token) {
      setRoomToken(token);
    } else {
      console.error("[UserVideoCallPage] LiveKit token not found in URL.");
    }
  }, [token]);

  if (!roomToken || !livekitUrl) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading video call...
      </div>
    );
  }

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
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
};

export default UserVideoCallPage;