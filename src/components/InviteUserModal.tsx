import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from '@/hooks/useI18n';
import { useNotifications } from "@/hooks/useNotifications";
import { Role } from "@/types";
import { Mail, Copy, Check, Send, Link2, RefreshCw, Trash2, Clock } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Invitation {
  id: number;
  email: string;
  role_id: number | null;
  role_name: string | null;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  invitation_link?: string;
  invited_by_name: string | null;
  is_expired?: boolean;
}

export const InviteUserModal = ({ isOpen, onClose }: InviteUserModalProps) => {
  const { t, isRTL } = useI18n();
  const queryClient = useQueryClient();
  const { authFetch } = useAuth();
  const { playSuccessSound } = useNotifications();

  // Form state
  const [email, setEmail] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [lastCreatedInvitation, setLastCreatedInvitation] = useState<Invitation | null>(null);

  // Fetch roles
  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/roles/`);
      if (!response.ok) throw new Error('Failed to fetch roles');
      return response.json();
    },
  });

  // Fetch pending invitations
  const { data: pendingInvitations = [], isLoading: isLoadingInvitations } = useQuery<Invitation[]>({
    queryKey: ['invitations'],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/invitations/`);
      if (!response.ok) throw new Error('Failed to fetch invitations');
      return response.json();
    },
    enabled: isOpen,
  });

  // Create invitation mutation
  const createInvitationMutation = useMutation({
    mutationFn: async (data: { email: string; role_id?: number }) => {
      const response = await authFetch(`/api/v1/invitations/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create invitation');
      }
      return response.json();
    },
    onSuccess: (data: Invitation) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast({
        title: t('common.success'),
        variant: 'success',
        description: t('invitations.toasts.invitationSent'),
      });
      playSuccessSound();
      setLastCreatedInvitation(data);
      setEmail("");
      setSelectedRoleId("");
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Resend invitation mutation
  const resendInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await authFetch(`/api/v1/invitations/${invitationId}/resend`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to resend invitation');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast({
        title: t('common.success'),
        variant: 'success',
        description: t('invitations.toasts.invitationResent'),
      });
      playSuccessSound();
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Revoke invitation mutation
  const revokeInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await authFetch(`/api/v1/invitations/${invitationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to revoke invitation');
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast({
        title: t('common.success'),
        variant: 'success',
        description: t('invitations.toasts.invitationRevoked'),
      });
      playSuccessSound();
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSendInvitation = () => {
    if (!email) return;

    const data: { email: string; role_id?: number } = { email };
    if (selectedRoleId) {
      data.role_id = parseInt(selectedRoleId, 10);
    }

    createInvitationMutation.mutate(data);
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    toast({
      title: t('common.success'),
      description: t('invitations.toasts.linkCopied'),
    });
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleClose = () => {
    setEmail("");
    setSelectedRoleId("");
    setLastCreatedInvitation(null);
    onClose();
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setSelectedRoleId("");
      setLastCreatedInvitation(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl dark:bg-slate-800 dark:border-slate-700" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className={`dark:text-white flex items-center gap-2`}>
            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            {t('invitations.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Invite Form */}
          <div className="space-y-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-sm dark:text-gray-300 uppercase tracking-wider">
              {t('invitations.sendInvitation')}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invite-email" className="text-sm dark:text-gray-300 mb-1.5 block">
                  {t('invitations.emailLabel')}
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder={t('invitations.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="invite-role" className="text-sm dark:text-gray-300 mb-1.5 block">
                  {t('invitations.roleLabel')}
                </Label>
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                  <SelectTrigger id="invite-role" className="dark:bg-slate-800 dark:border-slate-600 dark:text-white">
                    <SelectValue placeholder={t('invitations.rolePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()} className="dark:text-white dark:focus:bg-slate-700">
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleSendInvitation}
              disabled={!email || createInvitationMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {createInvitationMutation.isPending ? (
                <>
                  <div className={`animate-spin rounded-full h-4 w-4 border-b-2 border-white ${isRTL ? 'ml-2' : 'mr-2'}`}></div>
                  {t('invitations.sending')}
                </>
              ) : (
                <>
                  <Send className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('invitations.sendButton')}
                </>
              )}
            </Button>

            {/* Show created invitation link */}
            {lastCreatedInvitation?.invitation_link && (
              <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    {t('invitations.invitationCreated')}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(lastCreatedInvitation.invitation_link!)}
                    className="text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                  >
                    {copiedLink === lastCreatedInvitation.invitation_link ? (
                      <>
                        <Check className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                        {t('invitations.copied')}
                      </>
                    ) : (
                      <>
                        <Copy className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                        {t('invitations.copyLink')}
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-slate-800 p-2 rounded border border-green-200 dark:border-green-800">
                  <Link2 className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{lastCreatedInvitation.invitation_link}</span>
                </div>
              </div>
            )}
          </div>

          {/* Pending Invitations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm dark:text-gray-300 uppercase tracking-wider">
                {t('invitations.pendingInvitations')}
              </h4>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
                {pendingInvitations.length}
              </span>
            </div>

            {isLoadingInvitations ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                  <span>{t('invitations.loading')}</span>
                </div>
              </div>
            ) : pendingInvitations.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
                <Mail className="h-8 w-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('invitations.noPendingInvitations')}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      invitation.is_expired
                        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium dark:text-white truncate">
                          {invitation.email}
                        </span>
                        {invitation.is_expired && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                            {t('invitations.expired')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {invitation.role_name && (
                          <span>{invitation.role_name}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {t('invitations.expiresIn', {
                            time: formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })
                          })}
                        </span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resendInvitationMutation.mutate(invitation.id)}
                        disabled={resendInvitationMutation.isPending}
                        className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title={t('invitations.resend')}
                      >
                        <RefreshCw className={`h-4 w-4 text-blue-600 dark:text-blue-400 ${resendInvitationMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeInvitationMutation.mutate(invitation.id)}
                        disabled={revokeInvitationMutation.isPending}
                        className="hover:bg-red-50 dark:hover:bg-red-900/20"
                        title={t('invitations.revoke')}
                      >
                        <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
          >
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserModal;
