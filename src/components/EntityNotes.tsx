import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EntityNote, EntityNoteList, NoteType, NOTE_TYPE_CONFIG } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';
import { NoteDialog } from './NoteDialog';
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  Phone,
  Calendar,
  Mail,
  CheckSquare,
  Clock,
  User,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface EntityNotesProps {
  contactId?: number;
  leadId?: number;
  compact?: boolean;
}

const NoteTypeIcon: React.FC<{ type: NoteType; className?: string }> = ({ type, className }) => {
  const icons: Record<NoteType, React.ReactNode> = {
    note: <FileText className={className} />,
    call: <Phone className={className} />,
    meeting: <Calendar className={className} />,
    email: <Mail className={className} />,
    task: <CheckSquare className={className} />,
  };
  return <>{icons[type]}</>;
};

export const EntityNotes: React.FC<EntityNotesProps> = ({ contactId, leadId, compact = false }) => {
  const { t } = useTranslation();
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<EntityNote | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);

  const queryKey = contactId
    ? ['entity-notes', 'contact', contactId]
    : ['entity-notes', 'lead', leadId];

  const endpoint = contactId
    ? `/api/v1/notes/contact/${contactId}`
    : `/api/v1/notes/lead/${leadId}`;

  const { data, isLoading } = useQuery<EntityNoteList>({
    queryKey,
    queryFn: async () => {
      const response = await authFetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch notes');
      return response.json();
    },
    enabled: !!(contactId || leadId),
  });

  const deleteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const response = await authFetch(`/api/v1/notes/${noteId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: t('notes.deleted'),
        variant: 'success',
      });
      setDeleteNoteId(null);
    },
    onError: () => {
      toast({
        title: t('notes.deleteError'),
        variant: 'destructive',
      });
    },
  });

  const handleAddNote = () => {
    setEditingNote(null);
    setIsDialogOpen(true);
  };

  const handleEditNote = (note: EntityNote) => {
    setEditingNote(note);
    setIsDialogOpen(true);
  };

  const handleDeleteNote = (noteId: number) => {
    setDeleteNoteId(noteId);
  };

  const confirmDelete = () => {
    if (deleteNoteId) {
      deleteMutation.mutate(deleteNoteId);
    }
  };

  const groupNotesByDate = (notes: EntityNote[]) => {
    const groups: Record<string, EntityNote[]> = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    notes.forEach((note) => {
      const noteDate = new Date(note.created_at).toDateString();
      let groupKey: string;

      if (noteDate === today) {
        groupKey = t('notes.today');
      } else if (noteDate === yesterday) {
        groupKey = t('notes.yesterday');
      } else {
        groupKey = new Date(note.created_at).toLocaleDateString(undefined, {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(note);
    });

    return groups;
  };

  const notes = data?.notes || [];
  const groupedNotes = groupNotesByDate(notes);

  return (
    <>
      <Card className={cn('h-full flex flex-col', compact ? 'border-0 shadow-none' : '')}>
        <CardHeader className={cn('flex flex-row items-center justify-between pb-2', compact ? 'px-0 pt-0' : '')}>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('notes.title')}
            {data?.total ? (
              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                {data.total}
              </span>
            ) : null}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleAddNote}>
            <Plus className="h-4 w-4 mr-1" />
            {t('notes.add')}
          </Button>
        </CardHeader>

        <CardContent className={cn('flex-1 overflow-y-auto', compact ? 'px-0 pb-0' : '')}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('notes.empty')}</p>
              <p className="text-xs mt-1">{t('notes.emptySubtitle')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedNotes).map(([date, dateNotes]) => (
                <div key={date}>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                    {date}
                  </h4>
                  <div className="space-y-2">
                    {dateNotes.map((note) => {
                      const config = NOTE_TYPE_CONFIG[note.note_type];
                      return (
                        <div
                          key={note.id}
                          className={cn(
                            'border rounded-lg p-3 transition-all hover:shadow-sm',
                            'bg-white dark:bg-slate-900'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div
                                className={cn(
                                  'p-1.5 rounded',
                                  config.bgColor
                                )}
                              >
                                <NoteTypeIcon
                                  type={note.note_type}
                                  className={cn('h-3.5 w-3.5', config.color)}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={cn('text-xs font-medium', config.color)}>
                                    {t(`notes.types.${note.note_type}`)}
                                  </span>
                                  {note.title && (
                                    <span className="text-sm font-medium truncate">
                                      {note.title}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditNote(note)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  {t('notes.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t('notes.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <p className="text-sm mt-2 whitespace-pre-wrap line-clamp-3">
                            {note.content}
                          </p>

                          {/* Activity metadata for calls/meetings */}
                          {(note.note_type === 'call' || note.note_type === 'meeting') && (
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                              {note.duration_minutes && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {note.duration_minutes} {t('notes.minutes')}
                                </span>
                              )}
                              {note.participants && note.participants.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {note.participants.join(', ')}
                                </span>
                              )}
                              {note.outcome && (
                                <span className="italic">{note.outcome}</span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>
                              {note.creator_email || t('notes.unknownUser')}
                            </span>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <NoteDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        contactId={contactId}
        leadId={leadId}
        editNote={editingNote}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey });
          setIsDialogOpen(false);
          setEditingNote(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('notes.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('notes.deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EntityNotes;
