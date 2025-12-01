import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

const API_URL = API_BASE_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export interface Notification {
  id: number;
  user_id: number;
  notification_type: string;
  title: string;
  message: string;
  related_message_id?: number | null;
  related_channel_id?: number | null;
  actor_id?: number | null;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
}

// Get all notifications
export const getNotifications = async (unread_only: boolean = false): Promise<Notification[]> => {
  const response = await axios.get(`${API_URL}/api/v1/notifications/`, {
    params: { unread_only },
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Get unread notification count
export const getUnreadCount = async (): Promise<number> => {
  const response = await axios.get(`${API_URL}/api/v1/notifications/unread-count`, {
    headers: getAuthHeaders(),
  });
  return response.data.unread_count;
};

// Mark notification as read
export const markAsRead = async (notificationId: number): Promise<void> => {
  await axios.patch(
    `${API_URL}/api/v1/notifications/${notificationId}/read`,
    {},
    {
      headers: getAuthHeaders(),
    }
  );
};

// Mark all notifications as read
export const markAllAsRead = async (): Promise<void> => {
  await axios.patch(
    `${API_URL}/api/v1/notifications/mark-all-read`,
    {},
    {
      headers: getAuthHeaders(),
    }
  );
};

// Delete notification
export const deleteNotification = async (notificationId: number): Promise<void> => {
  await axios.delete(`${API_URL}/api/v1/notifications/${notificationId}`, {
    headers: getAuthHeaders(),
  });
};
