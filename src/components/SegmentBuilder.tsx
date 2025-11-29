import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Users, Filter, Tag as TagIcon, TrendingUp, Mail, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Tag {
  id: number;
  name: string;
  color: string;
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

interface SegmentBuilderProps {
  criteria: SegmentCriteria;
  onChange: (criteria: SegmentCriteria) => void;
  previewCount?: { contact_count: number; lead_count: number; total_count: number };
  onPreviewRequest?: () => void;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// Options for various filters
const LIFECYCLE_STAGES = [
  { value: 'subscriber', label: 'Subscriber' },
  { value: 'lead', label: 'Lead' },
  { value: 'mql', label: 'MQL' },
  { value: 'sql', label: 'SQL' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'customer', label: 'Customer' },
  { value: 'evangelist', label: 'Evangelist' },
];

const LEAD_STAGES = [
  { value: 'lead', label: 'Lead' },
  { value: 'mql', label: 'MQL' },
  { value: 'sql', label: 'SQL' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'customer', label: 'Customer' },
  { value: 'lost', label: 'Lost' },
];

const OPT_IN_STATUSES = [
  { value: 'opted_in', label: 'Opted In' },
  { value: 'opted_out', label: 'Opted Out' },
  { value: 'pending', label: 'Pending' },
  { value: 'unknown', label: 'Unknown' },
];

const LEAD_SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'import', label: 'Import' },
  { value: 'manual', label: 'Manual Entry' },
  { value: 'api', label: 'API' },
];

export function SegmentBuilder({
  criteria,
  onChange,
  previewCount,
  onPreviewRequest,
}: SegmentBuilderProps) {
  const { t } = useTranslation();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setIsLoadingTags(true);
    try {
      const response = await axios.get('/api/v1/tags', {
        headers: getAuthHeaders(),
      });
      setTags(response.data.tags || []);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setIsLoadingTags(false);
    }
  };

  const handleMultiSelect = (
    field: keyof SegmentCriteria,
    value: string,
    checked: boolean
  ) => {
    const currentValues = (criteria[field] as string[]) || [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter((v) => v !== value);
    onChange({ ...criteria, [field]: newValues.length > 0 ? newValues : undefined });
  };

  const handleTagToggle = (tagId: number, checked: boolean) => {
    const currentIds = criteria.tag_ids || [];
    const newIds = checked
      ? [...currentIds, tagId]
      : currentIds.filter((id) => id !== tagId);
    onChange({ ...criteria, tag_ids: newIds.length > 0 ? newIds : undefined });
  };

  const handleScoreChange = (values: number[]) => {
    onChange({
      ...criteria,
      score_min: values[0],
      score_max: values[1],
    });
  };

  return (
    <div className="space-y-6">
      {/* Preview Card */}
      {previewCount && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{previewCount.total_count}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('crm.segments.matchingRecords', 'matching records')}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <p className="font-semibold">{previewCount.contact_count}</p>
                  <p className="text-muted-foreground">{t('crm.contacts.title', 'Contacts')}</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{previewCount.lead_count}</p>
                  <p className="text-muted-foreground">{t('crm.leads.title', 'Leads')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Include Contacts/Leads Toggle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            {t('crm.segments.includeTypes', 'Include Types')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{t('crm.contacts.title', 'Contacts')}</Label>
            <Switch
              checked={criteria.include_contacts !== false}
              onCheckedChange={(checked) =>
                onChange({ ...criteria, include_contacts: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>{t('crm.leads.title', 'Leads')}</Label>
            <Switch
              checked={criteria.include_leads !== false}
              onCheckedChange={(checked) =>
                onChange({ ...criteria, include_leads: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Lifecycle Stage Filter (for Contacts) */}
      {criteria.include_contacts !== false && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t('crm.segments.lifecycleStage', 'Lifecycle Stage')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {LIFECYCLE_STAGES.map((stage) => (
                <div key={stage.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`lifecycle-${stage.value}`}
                    checked={(criteria.lifecycle_stages || []).includes(stage.value)}
                    onCheckedChange={(checked) =>
                      handleMultiSelect('lifecycle_stages', stage.value, !!checked)
                    }
                  />
                  <Label
                    htmlFor={`lifecycle-${stage.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {stage.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lead Stage Filter (for Leads) */}
      {criteria.include_leads !== false && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('crm.segments.leadStage', 'Lead Stage')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {LEAD_STAGES.map((stage) => (
                <div key={stage.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`lead-stage-${stage.value}`}
                    checked={(criteria.lead_stages || []).includes(stage.value)}
                    onCheckedChange={(checked) =>
                      handleMultiSelect('lead_stages', stage.value, !!checked)
                    }
                  />
                  <Label
                    htmlFor={`lead-stage-${stage.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {stage.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lead Score Filter */}
      {criteria.include_leads !== false && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('crm.segments.leadScore', 'Lead Score Range')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="px-2">
              <Slider
                min={0}
                max={100}
                step={5}
                value={[criteria.score_min || 0, criteria.score_max || 100]}
                onValueChange={handleScoreChange}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t('crm.segments.minScore', 'Min')}: {criteria.score_min || 0}</span>
              <span>{t('crm.segments.maxScore', 'Max')}: {criteria.score_max || 100}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lead Source Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            {t('crm.segments.leadSource', 'Lead Source')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {LEAD_SOURCES.map((source) => (
              <div key={source.value} className="flex items-center gap-2">
                <Checkbox
                  id={`source-${source.value}`}
                  checked={(criteria.lead_sources || []).includes(source.value)}
                  onCheckedChange={(checked) =>
                    handleMultiSelect('lead_sources', source.value, !!checked)
                  }
                />
                <Label
                  htmlFor={`source-${source.value}`}
                  className="text-sm cursor-pointer"
                >
                  {source.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Opt-In Status Filter (for Contacts) */}
      {criteria.include_contacts !== false && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {t('crm.segments.optInStatus', 'Opt-In Status')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {OPT_IN_STATUSES.map((status) => (
                <div key={status.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`optin-${status.value}`}
                    checked={(criteria.opt_in_status || []).includes(status.value)}
                    onCheckedChange={(checked) =>
                      handleMultiSelect('opt_in_status', status.value, !!checked)
                    }
                  />
                  <Label
                    htmlFor={`optin-${status.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {status.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TagIcon className="h-4 w-4" />
            {t('crm.segments.tags', 'Tags')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTags ? (
            <p className="text-sm text-muted-foreground">
              {t('common.loading', 'Loading...')}
            </p>
          ) : tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('crm.tags.noTags', 'No tags available')}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={(criteria.tag_ids || []).includes(tag.id) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors"
                  style={
                    (criteria.tag_ids || []).includes(tag.id)
                      ? { backgroundColor: tag.color, borderColor: tag.color }
                      : { borderColor: tag.color, color: tag.color }
                  }
                  onClick={() =>
                    handleTagToggle(tag.id, !(criteria.tag_ids || []).includes(tag.id))
                  }
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SegmentBuilder;
