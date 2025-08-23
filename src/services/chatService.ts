
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Channel API calls
export const getChannels = async () => {
  const response = await axios.get(`${API_URL}/api/v1/chat/channels/`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createChannel = async (channelData: { name: string; description?: string; channel_type: string; team_id?: number }) => {
  const response = await axios.post(`${API_URL}/api/v1/chat/channels/`, channelData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Message API calls
export const getChannelMessages = async (channelId: number) => {
  const response = await axios.get(`${API_URL}/api/v1/chat/channels/${channelId}/messages`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const sendMessage = async (channelId: number, content: string) => {
  const messageData = { content, channel_id: channelId };
  const response = await axios.post(`${API_URL}/api/v1/chat/channels/${channelId}/messages`, messageData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Membership API calls
export const joinChannel = async (channelId: number) => {
  const response = await axios.post(`${API_URL}/api/v1/chat/channels/${channelId}/join`, {}, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const leaveChannel = async (channelId: number) => {
  const response = await axios.post(`${API_URL}/api/v1/chat/channels/${channelId}/leave`, {}, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
