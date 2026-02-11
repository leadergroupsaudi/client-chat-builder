import React from 'react';
import { useLocation } from 'react-router-dom';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';

const UserLiveKitCallPage: React.FC = () => {
  const query = new URLSearchParams(useLocation().search);
  const token = query.get('token');
  const livekitUrl = query.get('livekitUrl');

  if (!token || !livekitUrl) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading call...
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <LiveKitRoom
        token={token}
        serverUrl={livekitUrl}
        video
        audio
        data-lk-theme="default"
        onDisconnected={() => {
          if (window.opener) window.close();
        }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
};

export default UserLiveKitCallPage;
