import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchMessages } from '@/services/chatService';
import { useQuery } from '@tanstack/react-query';
import MentionText from './MentionText';

interface ChatMessage {
  id: number;
  sender_id: number;
  content: string;
  created_at: string;
  parent_message_id?: number | null;
  sender: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    profile_picture_url?: string;
  };
  reply_count?: number;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: number;
  onMessageClick?: (messageId: number) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, channelId, onMessageClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading, error } = useQuery<ChatMessage[], Error>({
    queryKey: ['searchMessages', channelId, debouncedQuery],
    queryFn: () => searchMessages(channelId, debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
  };

  const handleMessageClick = (messageId: number) => {
    if (onMessageClick) {
      onMessageClick(messageId);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Search Messages
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {!debouncedQuery || debouncedQuery.length < 2 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
              <Search className="h-12 w-12 mb-4 text-slate-300 dark:text-slate-600" />
              <p className="text-sm">Type at least 2 characters to search</p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600 dark:text-purple-400" />
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">Searching...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-red-500 dark:text-red-400">
              <p className="text-sm">Error: {error.message}</p>
            </div>
          ) : searchResults && searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
              <Search className="h-12 w-12 mb-4 text-slate-300 dark:text-slate-600" />
              <p className="text-sm">No messages found for "{debouncedQuery}"</p>
            </div>
          ) : (
            <div className="space-y-3 py-4">
              {searchResults?.map((message) => (
                <button
                  key={message.id}
                  onClick={() => handleMessageClick(message.id)}
                  className="w-full text-left p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={message.sender?.profile_picture_url} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                        {message.sender?.first_name?.[0] || message.sender?.email[0].toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                          {message.sender?.first_name || message.sender?.email}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                        {message.parent_message_id && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                            Reply
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">
                        <MentionText
                          content={message.content}
                          users={{}}
                          className="prose-sm"
                        />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal;
