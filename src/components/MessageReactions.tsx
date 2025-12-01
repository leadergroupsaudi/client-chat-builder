import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import EmojiPicker from './EmojiPicker';

interface Reaction {
  id: number;
  emoji: string;
  user_id: number;
  message_id: number;
  created_at: string;
}

interface MessageReactionsProps {
  reactions: Reaction[];
  currentUserId?: number;
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  className?: string;
  users?: { [key: number]: { first_name?: string; email: string } };
}

const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  currentUserId,
  onAddReaction,
  onRemoveReaction,
  className,
  users = {},
}) => {
  // Group reactions by emoji
  const groupedReactions = React.useMemo(() => {
    const groups: { [emoji: string]: Reaction[] } = {};
    reactions.forEach((reaction) => {
      if (!groups[reaction.emoji]) {
        groups[reaction.emoji] = [];
      }
      groups[reaction.emoji].push(reaction);
    });
    return groups;
  }, [reactions]);

  const handleReactionClick = (emoji: string) => {
    // Check if current user has already reacted with this emoji
    const userReaction = reactions.find(
      (r) => r.emoji === emoji && r.user_id === currentUserId
    );

    if (userReaction) {
      onRemoveReaction(emoji);
    } else {
      onAddReaction(emoji);
    }
  };

  const getUserNames = (reactionList: Reaction[]): string => {
    return reactionList
      .map((r) => {
        if (r.user_id === currentUserId) return 'You';
        const user = users[r.user_id];
        return user?.first_name || user?.email || 'Someone';
      })
      .join(', ');
  };

  return (
    <div className={cn('flex items-center gap-1 flex-wrap', className)}>
      {/* Display existing reactions */}
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const hasUserReacted = reactionList.some((r) => r.user_id === currentUserId);
        const count = reactionList.length;

        return (
          <TooltipProvider key={emoji}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReactionClick(emoji)}
                  className={cn(
                    'h-7 px-2 gap-1 rounded-full border transition-all',
                    hasUserReacted
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-950/50'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  )}
                >
                  <span className="text-sm">{emoji}</span>
                  {count > 1 && (
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {count}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{getUserNames(reactionList)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}

      {/* Add reaction button */}
      <EmojiPicker
        onEmojiSelect={onAddReaction}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
      />
    </div>
  );
};

export default MessageReactions;
