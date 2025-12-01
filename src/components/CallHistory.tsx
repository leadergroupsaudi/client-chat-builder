import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, PhoneOff, PhoneMissed, Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/config/api';

interface CallHistoryItem {
  id: number;
  room_name: string;
  status: 'completed' | 'missed' | 'rejected' | 'active' | 'ringing';
  created_by_id: number;
  started_at: string;
  answered_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  participants: any[];
  joined_users: number[];
}

interface CallHistoryProps {
  channelId: number;
  currentUserId?: number;
}

const CallHistory: React.FC<CallHistoryProps> = ({ channelId, currentUserId }) => {
  const { data: calls, isLoading } = useQuery<CallHistoryItem[]>({
    queryKey: ['callHistory', channelId],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/video-calls/channels/${channelId}/history`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    enabled: !!channelId,
  });

  const getCallIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'missed':
        return <PhoneMissed className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'rejected':
        return <PhoneOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      default:
        return <Phone className="h-4 w-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getCallStatusBadge = (status: string) => {
    const badges = {
      completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      missed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      rejected: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      ringing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return badges[status as keyof typeof badges] || badges.completed;
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return null;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0
      ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
      : `${seconds}s`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return `Today at ${time}`;
    } else if (isYesterday) {
      return `Yesterday at ${time}`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` at ${time}`;
    }
  };

  const getCallDirection = (call: CallHistoryItem) => {
    if (call.created_by_id === currentUserId) {
      return 'outgoing';
    }
    return 'incoming';
  };

  const getCallDescription = (call: CallHistoryItem) => {
    const direction = getCallDirection(call);

    if (call.status === 'completed') {
      return direction === 'outgoing' ? 'Outgoing call' : 'Incoming call';
    } else if (call.status === 'missed') {
      return direction === 'outgoing' ? 'Unanswered' : 'Missed call';
    } else if (call.status === 'rejected') {
      return direction === 'outgoing' ? 'Call declined' : 'Declined call';
    }
    return 'Call';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!calls || calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        <Phone className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm">No call history</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-4">
        {calls.map((call) => (
          <div
            key={call.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-slate-200 dark:border-slate-700"
          >
            {/* Call Icon */}
            <div className={cn(
              "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
              call.status === 'completed' && "bg-green-100 dark:bg-green-900/30",
              call.status === 'missed' && "bg-red-100 dark:bg-red-900/30",
              call.status === 'rejected' && "bg-orange-100 dark:bg-orange-900/30"
            )}>
              {getCallIcon(call.status)}
            </div>

            {/* Call Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-slate-900 dark:text-white">
                  {getCallDescription(call)}
                </span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                  getCallStatusBadge(call.status)
                )}>
                  {call.status}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDateTime(call.started_at)}</span>
                </div>

                {call.duration_seconds && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(call.duration_seconds)}</span>
                  </div>
                )}
              </div>

              {/* Participants count */}
              {call.joined_users && call.joined_users.length > 0 && (
                <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  {call.joined_users.length} {call.joined_users.length === 1 ? 'participant' : 'participants'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default CallHistory;
