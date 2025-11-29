import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  Users,
  Filter,
  Database,
  Layers,
  Search,
  Check,
  Plus,
  X,
  UserPlus,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SegmentBuilder } from '@/components/SegmentBuilder';

interface Segment {
  id: number;
  name: string;
  description?: string;
  segment_type: 'dynamic' | 'static';
  contact_count: number;
  lead_count: number;
}

interface Contact {
  id: number;
  name?: string;
  email?: string;
  lifecycle_stage?: string;
}

interface Lead {
  id: number;
  contact?: Contact;
  stage?: string;
  score?: number;
}

interface SegmentCriteria {
  lifecycle_stages?: string[];
  lead_sources?: string[];
  lead_stages?: string[];
  tag_ids?: number[];
  score_min?: number;
  score_max?: number;
  opt_in_status?: string[];
  include_contacts?: boolean;
  include_leads?: boolean;
}

interface AudienceSelection {
  type: 'segment' | 'filter' | 'manual';
  segment_id?: number;
  criteria?: SegmentCriteria;
  contact_ids?: number[];
  lead_ids?: number[];
}

interface CampaignAudienceSelectorProps {
  value: AudienceSelection;
  onChange: (value: AudienceSelection) => void;
  disabled?: boolean;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export function CampaignAudienceSelector({
  value,
  onChange,
  disabled = false,
}: CampaignAudienceSelectorProps) {
  const { t } = useTranslation();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewCount, setPreviewCount] = useState<{
    contact_count: number;
    lead_count: number;
    total_count: number;
  } | null>(null);

  useEffect(() => {
    fetchSegments();
  }, []);

  useEffect(() => {
    if (value.type === 'manual') {
      fetchContacts();
      fetchLeads();
    }
  }, [value.type]);

  const fetchSegments = async () => {
    setIsLoadingSegments(true);
    try {
      const response = await axios.get('/api/v1/segments', {
        headers: getAuthHeaders(),
      });
      setSegments(response.data.segments || []);
    } catch (error) {
      console.error('Failed to fetch segments:', error);
    } finally {
      setIsLoadingSegments(false);
    }
  };

  const fetchContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const response = await axios.get('/api/v1/contacts', {
        params: { limit: 100 },
        headers: getAuthHeaders(),
      });
      setContacts(response.data.contacts || response.data || []);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const fetchLeads = async () => {
    setIsLoadingLeads(true);
    try {
      const response = await axios.get('/api/v1/leads', {
        params: { limit: 100 },
        headers: getAuthHeaders(),
      });
      setLeads(response.data.leads || response.data || []);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  const fetchCriteriaPreview = async (criteria: SegmentCriteria) => {
    try {
      const response = await axios.post('/api/v1/segments/preview', criteria, {
        headers: getAuthHeaders(),
      });
      setPreviewCount(response.data);
    } catch (error) {
      console.error('Failed to fetch preview:', error);
    }
  };

  const handleTypeChange = (type: 'segment' | 'filter' | 'manual') => {
    onChange({
      type,
      segment_id: type === 'segment' ? value.segment_id : undefined,
      criteria: type === 'filter' ? value.criteria || {} : undefined,
      contact_ids: type === 'manual' ? value.contact_ids || [] : undefined,
      lead_ids: type === 'manual' ? value.lead_ids || [] : undefined,
    });
  };

  const handleSegmentSelect = (segmentId: number) => {
    onChange({
      ...value,
      segment_id: segmentId,
    });
  };

  const handleCriteriaChange = (criteria: SegmentCriteria) => {
    onChange({
      ...value,
      criteria,
    });
    fetchCriteriaPreview(criteria);
  };

  const handleContactToggle = (contactId: number, checked: boolean) => {
    const currentIds = value.contact_ids || [];
    const newIds = checked
      ? [...currentIds, contactId]
      : currentIds.filter((id) => id !== contactId);
    onChange({
      ...value,
      contact_ids: newIds,
    });
  };

  const handleLeadToggle = (leadId: number, checked: boolean) => {
    const currentIds = value.lead_ids || [];
    const newIds = checked
      ? [...currentIds, leadId]
      : currentIds.filter((id) => id !== leadId);
    onChange({
      ...value,
      lead_ids: newIds,
    });
  };

  const selectedSegment = segments.find((s) => s.id === value.segment_id);
  const selectedContactCount = (value.contact_ids || []).length;
  const selectedLeadCount = (value.lead_ids || []).length;

  const filteredContacts = contacts.filter(
    (c) =>
      (c.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (c.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const filteredLeads = leads.filter(
    (l) =>
      (l.contact?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (l.contact?.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Audience Type Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t('campaigns.audience.selectType', 'Select Audience Type')}
          </CardTitle>
          <CardDescription>
            {t('campaigns.audience.typeDescription', 'Choose how to target your campaign audience')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={value.type}
            onValueChange={(v) => handleTypeChange(v as 'segment' | 'filter' | 'manual')}
            disabled={disabled}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <label
              className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                value.type === 'segment' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RadioGroupItem value="segment" className="mt-1" />
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {t('campaigns.audience.useSegment', 'Use Segment')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('campaigns.audience.segmentDescription', 'Select from saved audience segments')}
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                value.type === 'filter' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RadioGroupItem value="filter" className="mt-1" />
              <div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">
                    {t('campaigns.audience.useFilters', 'Use Filters')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('campaigns.audience.filterDescription', 'Build custom criteria for this campaign')}
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                value.type === 'manual' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RadioGroupItem value="manual" className="mt-1" />
              <div>
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-green-600" />
                  <span className="font-medium">
                    {t('campaigns.audience.manualSelect', 'Manual Selection')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('campaigns.audience.manualDescription', 'Hand-pick specific contacts and leads')}
                </p>
              </div>
            </label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Segment Selection */}
      {value.type === 'segment' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t('campaigns.audience.selectSegment', 'Select Segment')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSegments ? (
              <p className="text-muted-foreground">{t('common.loading', 'Loading...')}</p>
            ) : segments.length === 0 ? (
              <div className="text-center py-6">
                <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground mb-2">
                  {t('campaigns.audience.noSegments', 'No segments available')}
                </p>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('crm.segments.create', 'Create Segment')}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {segments.map((segment) => (
                  <div
                    key={segment.id}
                    onClick={() => !disabled && handleSegmentSelect(segment.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      value.segment_id === segment.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          {segment.segment_type === 'dynamic' ? (
                            <Filter className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Database className="h-4 w-4 text-green-600" />
                          )}
                          <span className="font-medium">{segment.name}</span>
                        </div>
                        {segment.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {segment.description}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {segment.contact_count} contacts
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {segment.lead_count} leads
                          </Badge>
                        </div>
                      </div>
                      {value.segment_id === segment.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedSegment && (
              <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                <div className="flex items-center gap-4">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold">
                      {selectedSegment.contact_count + selectedSegment.lead_count}{' '}
                      {t('campaigns.audience.totalRecipients', 'total recipients')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedSegment.contact_count} {t('crm.contacts.title', 'contacts')},{' '}
                      {selectedSegment.lead_count} {t('crm.leads.title', 'leads')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filter Builder */}
      {value.type === 'filter' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t('campaigns.audience.buildFilters', 'Build Audience Filters')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SegmentBuilder
              criteria={value.criteria || {}}
              onChange={handleCriteriaChange}
              previewCount={previewCount || undefined}
            />
          </CardContent>
        </Card>
      )}

      {/* Manual Selection */}
      {value.type === 'manual' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {t('campaigns.audience.selectRecipients', 'Select Recipients')}
                </CardTitle>
                <CardDescription>
                  {selectedContactCount + selectedLeadCount}{' '}
                  {t('campaigns.audience.selected', 'selected')}
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('common.search', 'Search...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="contacts">
              <TabsList className="mb-4">
                <TabsTrigger value="contacts">
                  {t('crm.contacts.title', 'Contacts')} ({selectedContactCount})
                </TabsTrigger>
                <TabsTrigger value="leads">
                  {t('crm.leads.title', 'Leads')} ({selectedLeadCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="contacts">
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>{t('common.name', 'Name')}</TableHead>
                        <TableHead>{t('common.email', 'Email')}</TableHead>
                        <TableHead>{t('crm.contacts.stage', 'Stage')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingContacts ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            {t('common.loading', 'Loading...')}
                          </TableCell>
                        </TableRow>
                      ) : filteredContacts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            {t('crm.contacts.noContacts', 'No contacts found')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredContacts.map((contact) => (
                          <TableRow key={contact.id}>
                            <TableCell>
                              <Checkbox
                                checked={(value.contact_ids || []).includes(contact.id)}
                                onCheckedChange={(checked) =>
                                  handleContactToggle(contact.id, !!checked)
                                }
                                disabled={disabled}
                              />
                            </TableCell>
                            <TableCell>{contact.name || '-'}</TableCell>
                            <TableCell>{contact.email || '-'}</TableCell>
                            <TableCell>{contact.lifecycle_stage || '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="leads">
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>{t('common.name', 'Name')}</TableHead>
                        <TableHead>{t('common.email', 'Email')}</TableHead>
                        <TableHead>{t('crm.leads.stage', 'Stage')}</TableHead>
                        <TableHead>{t('crm.leads.score', 'Score')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingLeads ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            {t('common.loading', 'Loading...')}
                          </TableCell>
                        </TableRow>
                      ) : filteredLeads.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                            {t('crm.leads.noLeads', 'No leads found')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLeads.map((lead) => (
                          <TableRow key={lead.id}>
                            <TableCell>
                              <Checkbox
                                checked={(value.lead_ids || []).includes(lead.id)}
                                onCheckedChange={(checked) =>
                                  handleLeadToggle(lead.id, !!checked)
                                }
                                disabled={disabled}
                              />
                            </TableCell>
                            <TableCell>{lead.contact?.name || '-'}</TableCell>
                            <TableCell>{lead.contact?.email || '-'}</TableCell>
                            <TableCell>{lead.stage || '-'}</TableCell>
                            <TableCell>{lead.score ?? '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>

            {/* Selection Summary */}
            {(selectedContactCount > 0 || selectedLeadCount > 0) && (
              <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                <div className="flex items-center gap-4">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold">
                      {selectedContactCount + selectedLeadCount}{' '}
                      {t('campaigns.audience.totalRecipients', 'total recipients')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedContactCount} {t('crm.contacts.title', 'contacts')},{' '}
                      {selectedLeadCount} {t('crm.leads.title', 'leads')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CampaignAudienceSelector;
