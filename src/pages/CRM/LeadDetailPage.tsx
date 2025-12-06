import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  DollarSign,
  Star,
  Calendar,
  Edit,
  Trash2,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  History,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { TagSelector } from '@/components/TagSelector';
import { EntityNotes } from '@/components/EntityNotes';

interface Lead {
  id: number;
  contact_id: number;
  contact?: {
    id: number;
    name: string;
    email: string;
    phone_number?: string;
    company_id: number;
    lead_source?: string;
    lifecycle_stage?: string;
    do_not_contact: boolean;
    opt_in_status: string;
    created_at?: string;
    updated_at?: string;
  };
  stage: string;
  previous_stage?: string;
  score: number;
  deal_value?: number;
  qualification_status: string;
  qualification_data?: Record<string, any>;
  source?: string;
  assignee_id?: number;
  campaign_id?: number;
  expected_close_date?: string;
  actual_close_date?: string;
  won_reason?: string;
  lost_reason?: string;
  notes?: string;
  tags?: Array<{ id: number; name: string; color: string }>;
  tag_ids?: number[];
  custom_fields?: Record<string, any>;
  stage_changed_at?: string;
  last_scored_at?: string;
  created_at: string;
  updated_at: string;
}

interface LeadScore {
  id: number;
  lead_id: number;
  score_type: string;
  score_value: number;
  reason?: string;
  created_at: string;
}

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  mql: 'MQL',
  sql: 'SQL',
  opportunity: 'Opportunity',
  customer: 'Customer',
  lost: 'Lost',
};

const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-800',
  mql: 'bg-blue-100 text-blue-800',
  sql: 'bg-purple-100 text-purple-800',
  opportunity: 'bg-yellow-100 text-yellow-800',
  customer: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
};

const STAGE_ORDER = ['lead', 'mql', 'sql', 'opportunity', 'customer', 'lost'];

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [scores, setScores] = useState<LeadScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState('');
  const [stageReason, setStageReason] = useState('');
  const [editData, setEditData] = useState({
    deal_value: '',
    source: '',
    notes: '',
    expected_close_date: '',
  });
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  useEffect(() => {
    if (id) {
      fetchLead();
      fetchScores();
    }
  }, [id]);

  const fetchLead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`/api/v1/leads/${id}`, { headers });
      setLead(response.data);
      setEditData({
        deal_value: response.data.deal_value?.toString() || '',
        source: response.data.source || '',
        notes: response.data.notes || '',
        expected_close_date: response.data.expected_close_date?.split('T')[0] || '',
      });
      // Set tag IDs from either tag_ids array or from tags objects
      const tagIds = response.data.tag_ids || response.data.tags?.map((t: any) => t.id) || [];
      setSelectedTagIds(tagIds);
    } catch (error) {
      console.error('Error fetching lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch lead details',
        variant: 'destructive',
      });
      navigate('/dashboard/crm/leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchScores = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`/api/v1/leads/${id}/scores`, { headers });
      setScores(response.data.scores || []);
    } catch (error) {
      console.error('Error fetching scores:', error);
    }
  };

  const handleUpdateStage = async () => {
    if (!selectedStage) return;

    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `/api/v1/leads/${id}/stage`,
        { stage: selectedStage, reason: stageReason || undefined },
        { headers }
      );
      toast({
        title: 'Success',
        description: 'Lead stage updated successfully',
      });
      setStageDialogOpen(false);
      setStageReason('');
      fetchLead();
    } catch (error) {
      console.error('Error updating stage:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lead stage',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateLead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `/api/v1/leads/${id}`,
        {
          deal_value: editData.deal_value ? parseFloat(editData.deal_value) : null,
          source: editData.source || null,
          notes: editData.notes || null,
          expected_close_date: editData.expected_close_date || null,
        },
        { headers }
      );
      toast({
        title: 'Success',
        description: 'Lead updated successfully',
      });
      setEditDialogOpen(false);
      fetchLead();
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lead',
        variant: 'destructive',
      });
    }
  };

  const handleQualifyLead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`/api/v1/leads/${id}/qualify`, {}, { headers });
      toast({
        title: 'Success',
        description: 'Lead qualified successfully',
      });
      fetchLead();
      fetchScores();
    } catch (error) {
      console.error('Error qualifying lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to qualify lead',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteLead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/api/v1/leads/${id}`, { headers });
      toast({
        title: 'Success',
        description: 'Lead deleted successfully',
      });
      navigate('/dashboard/crm/leads');
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete lead',
        variant: 'destructive',
      });
    }
  };

  const handleTagsChange = async (tagIds: number[]) => {
    setSelectedTagIds(tagIds);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Get current tags and determine which to add/remove
      const currentTagIds = selectedTagIds;
      const tagsToAdd = tagIds.filter(id => !currentTagIds.includes(id));
      const tagsToRemove = currentTagIds.filter(id => !tagIds.includes(id));

      // Add new tags
      for (const tagId of tagsToAdd) {
        await axios.post(`/api/v1/tags/${tagId}/assign`, {
          entity_type: 'lead',
          entity_ids: [parseInt(id!)]
        }, { headers });
      }

      // Remove tags
      for (const tagId of tagsToRemove) {
        await axios.post(`/api/v1/tags/${tagId}/unassign`, {
          entity_type: 'lead',
          entity_ids: [parseInt(id!)]
        }, { headers });
      }

      toast({
        title: 'Success',
        description: 'Tags updated successfully',
      });
    } catch (error) {
      console.error('Error updating tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tags',
        variant: 'destructive',
      });
      // Revert on error
      fetchLead();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Lead not found</h2>
          <p className="text-muted-foreground mt-2">The lead you're looking for doesn't exist.</p>
          <Button className="mt-4" onClick={() => navigate('/dashboard/crm/leads')}>
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/crm/leads')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {lead.contact?.name || 'Unknown Contact'}
              <Badge className={STAGE_COLORS[lead.stage]}>
                {STAGE_LABELS[lead.stage] || lead.stage}
              </Badge>
            </h1>
            <p className="text-muted-foreground">{lead.contact?.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleQualifyLead}>
            <Target className="h-4 w-4 mr-2" />
            Auto-Qualify
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setStageDialogOpen(true)}>
                Change Stage
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete Lead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stage Pipeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Sales Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {STAGE_ORDER.map((stage, index) => (
              <div key={stage} className="flex items-center">
                <div
                  className={`flex flex-col items-center cursor-pointer transition-all ${
                    lead.stage === stage ? 'scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                  onClick={() => {
                    setSelectedStage(stage);
                    setStageDialogOpen(true);
                  }}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      STAGE_ORDER.indexOf(lead.stage) >= index
                        ? stage === 'lost'
                          ? 'bg-red-500 text-white'
                          : stage === 'customer'
                          ? 'bg-green-500 text-white'
                          : 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {stage === 'customer' && STAGE_ORDER.indexOf(lead.stage) >= index ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : stage === 'lost' && lead.stage === 'lost' ? (
                      <XCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </div>
                  <span className="text-xs mt-1 font-medium">{STAGE_LABELS[stage]}</span>
                </div>
                {index < STAGE_ORDER.length - 1 && (
                  <div
                    className={`h-0.5 w-12 mx-2 ${
                      STAGE_ORDER.indexOf(lead.stage) > index ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="scoring">Scoring</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Lead Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Lead Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Deal Value</Label>
                      <p className="font-medium flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {lead.deal_value ? `$${lead.deal_value.toLocaleString()}` : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Source</Label>
                      <p className="font-medium">{lead.source || 'Unknown'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Score</Label>
                      <p className="font-medium flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {lead.score}/100
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Qualification Status</Label>
                      <Badge
                        variant={lead.qualification_status === 'qualified' ? 'default' : 'secondary'}
                      >
                        {lead.qualification_status}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Expected Close Date</Label>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(lead.expected_close_date)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Stage Changed</Label>
                      <p className="font-medium">{formatDateTime(lead.stage_changed_at)}</p>
                    </div>
                  </div>
                  {lead.notes && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Notes</Label>
                      <p className="mt-1 text-sm">{lead.notes}</p>
                    </div>
                  )}
                  {(lead.won_reason || lead.lost_reason) && (
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        {lead.stage === 'customer' ? 'Won Reason' : 'Lost Reason'}
                      </Label>
                      <p className="mt-1 text-sm">{lead.won_reason || lead.lost_reason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.contact?.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.contact?.phone_number || '-'}</span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground text-xs">Lead Source</Label>
                      <p>{lead.contact?.lead_source || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Lifecycle Stage</Label>
                      <p>{lead.contact?.lifecycle_stage || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Opt-in Status</Label>
                      <p>{lead.contact?.opt_in_status || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Do Not Contact</Label>
                      <p>{lead.contact?.do_not_contact ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scoring" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Score Breakdown</CardTitle>
                  <CardDescription>
                    Overall Score: {lead.score}/100
                    {lead.last_scored_at && (
                      <span className="ml-2">
                        (Last scored: {formatDateTime(lead.last_scored_at)})
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {scores.length > 0 ? (
                    <div className="space-y-3">
                      {scores.map((score) => (
                        <div
                          key={score.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium capitalize">
                              {score.score_type.replace('_', ' ')}
                            </p>
                            {score.reason && (
                              <p className="text-sm text-muted-foreground">{score.reason}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{score.score_value}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(score.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No scoring history available. Click "Auto-Qualify" to generate scores.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4 mt-4">
              {/* Notes & Activities */}
              <EntityNotes leadId={lead.id} />

              {/* Timeline Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <History className="h-4 w-4 text-primary" />
                        </div>
                        <div className="w-0.5 h-full bg-muted mt-2" />
                      </div>
                      <div>
                        <p className="font-medium">Lead Created</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(lead.created_at)}
                        </p>
                      </div>
                    </div>
                    {lead.previous_stage && (
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="w-0.5 h-full bg-muted mt-2" />
                        </div>
                        <div>
                          <p className="font-medium">
                            Stage changed from {STAGE_LABELS[lead.previous_stage]} to{' '}
                            {STAGE_LABELS[lead.stage]}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(lead.stage_changed_at)}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">Last Updated</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(lead.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Score</span>
                <span className="font-bold">{lead.score}/100</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    lead.score >= 70
                      ? 'bg-green-500'
                      : lead.score >= 40
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${lead.score}%` }}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Days in Stage</span>
                <span className="font-bold">
                  {lead.stage_changed_at
                    ? Math.floor(
                        (new Date().getTime() - new Date(lead.stage_changed_at).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Total Age</span>
                <span className="font-bold">
                  {Math.floor(
                    (new Date().getTime() - new Date(lead.created_at).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{' '}
                  days
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <TagSelector
                entityType="lead"
                selectedTagIds={selectedTagIds}
                onTagsChange={handleTagsChange}
              />
            </CardContent>
          </Card>

          {/* Custom Fields */}
          {lead.custom_fields && Object.keys(lead.custom_fields).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Custom Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(lead.custom_fields).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{key}</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update lead information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deal_value">Deal Value ($)</Label>
              <Input
                id="deal_value"
                type="number"
                value={editData.deal_value}
                onChange={(e) => setEditData({ ...editData, deal_value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select
                value={editData.source}
                onValueChange={(value) => setEditData({ ...editData, source: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="email_campaign">Email Campaign</SelectItem>
                  <SelectItem value="cold_call">Cold Call</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expected_close_date">Expected Close Date</Label>
              <Input
                id="expected_close_date"
                type="date"
                value={editData.expected_close_date}
                onChange={(e) => setEditData({ ...editData, expected_close_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLead}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage Change Dialog */}
      <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Lead Stage</DialogTitle>
            <DialogDescription>
              Update the stage for this lead in the sales pipeline
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Stage</Label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_ORDER.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {STAGE_LABELS[stage]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(selectedStage === 'customer' || selectedStage === 'lost') && (
              <div className="space-y-2">
                <Label htmlFor="reason">
                  {selectedStage === 'customer' ? 'Won Reason' : 'Lost Reason'}
                </Label>
                <Textarea
                  id="reason"
                  placeholder={`Why was this lead ${selectedStage === 'customer' ? 'won' : 'lost'}?`}
                  value={stageReason}
                  onChange={(e) => setStageReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStage} disabled={!selectedStage}>
              Update Stage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lead? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLead}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
