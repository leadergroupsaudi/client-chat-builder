import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Save,
  Mail,
  MessageSquare,
  Phone,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import TemplateEditor from '@/components/TemplateEditor';
import {
  getTemplate,
  createTemplate,
  updateTemplate,
  Template,
  TemplateCreate,
} from '@/services/templateService';

const TYPE_ICONS: Record<string, any> = {
  email: Mail,
  sms: MessageSquare,
  whatsapp: MessageSquare,
  voice: Phone,
};

export default function TemplateEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { toast } = useToast();

  const isEditMode = !!id && id !== 'new';

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  // Template data
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateType, setTemplateType] = useState<'email' | 'sms' | 'whatsapp' | 'voice'>('email');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isAIGenerated, setIsAIGenerated] = useState(false);

  // Template content (managed by TemplateEditor)
  const [templateContent, setTemplateContent] = useState<{
    subject?: string;
    body?: string;
    html_body?: string;
    voice_script?: string;
    tts_voice_id?: string;
    personalization_tokens?: string[];
  }>({});

  // Fetch template if editing
  useEffect(() => {
    if (isEditMode) {
      fetchTemplate();
    }
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const template = await getTemplate(parseInt(id!));
      setName(template.name);
      setDescription(template.description || '');
      setTemplateType(template.template_type);
      setTags(template.tags || []);
      setIsAIGenerated(template.is_ai_generated);
      setTemplateContent({
        subject: template.subject,
        body: template.body,
        html_body: template.html_body,
        voice_script: template.voice_script,
        tts_voice_id: template.tts_voice_id,
        personalization_tokens: template.personalization_tokens,
      });
    } catch (error) {
      console.error('Error fetching template:', error);
      toast({
        title: t('crm.common.error'),
        description: t('crm.templates.fetchError', 'Failed to load template'),
        variant: 'destructive',
      });
      navigate('/dashboard/crm/templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: t('crm.templates.nameRequired', 'Name Required'),
        description: t('crm.templates.enterName', 'Please enter a template name'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const data: TemplateCreate = {
        name,
        description: description || undefined,
        template_type: templateType,
        subject: templateContent.subject,
        body: templateContent.body,
        html_body: templateContent.html_body,
        voice_script: templateContent.voice_script,
        tts_voice_id: templateContent.tts_voice_id,
        personalization_tokens: templateContent.personalization_tokens || [],
        tags,
        is_ai_generated: isAIGenerated,
      };

      if (isEditMode) {
        await updateTemplate(parseInt(id!), data);
        toast({
          title: t('crm.common.success'),
          description: t('crm.templates.updated', 'Template updated successfully'),
        });
      } else {
        await createTemplate(data);
        toast({
          title: t('crm.common.success'),
          description: t('crm.templates.created', 'Template created successfully'),
        });
      }

      navigate('/dashboard/crm/templates');
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: t('crm.common.error'),
        description: t('crm.templates.saveError', 'Failed to save template'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    );
  }

  const TypeIcon = TYPE_ICONS[templateType];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard/crm/templates')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold dark:text-white">
              {isEditMode
                ? t('crm.templates.editTemplate', 'Edit Template')
                : t('crm.templates.createTemplate', 'Create Template')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {isEditMode
                ? t('crm.templates.editDescription', 'Modify your template content')
                : t('crm.templates.createDescription', 'Create a new reusable template')}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {t('crm.common.save', 'Save')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <Card className="lg:col-span-1 border-slate-200 dark:border-slate-700 dark:bg-slate-800 h-fit">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">
              {t('crm.templates.settings', 'Template Settings')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label>{t('crm.templates.name', 'Name')} *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('crm.templates.namePlaceholder', 'e.g., Welcome Email')}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>{t('crm.templates.description', 'Description')}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('crm.templates.descriptionPlaceholder', 'Describe this template...')}
                className="min-h-[80px]"
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>{t('crm.templates.type', 'Type')}</Label>
              <Select
                value={templateType}
                onValueChange={(value: any) => setTemplateType(value)}
                disabled={isEditMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {t('crm.templates.types.email', 'Email')}
                    </div>
                  </SelectItem>
                  <SelectItem value="sms">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {t('crm.templates.types.sms', 'SMS')}
                    </div>
                  </SelectItem>
                  <SelectItem value="whatsapp">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {t('crm.templates.types.whatsapp', 'WhatsApp')}
                    </div>
                  </SelectItem>
                  <SelectItem value="voice">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {t('crm.templates.types.voice', 'Voice')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>{t('crm.templates.tags', 'Tags')}</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder={t('crm.templates.addTag', 'Add tag...')}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button variant="outline" onClick={handleAddTag}>
                  {t('crm.common.add', 'Add')}
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Editor Panel */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white flex items-center gap-2">
                <TypeIcon className="h-5 w-5" />
                {t(`crm.templates.types.${templateType}`, templateType)} {t('crm.templates.content', 'Content')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TemplateEditor
                templateType={templateType}
                subject={templateContent.subject}
                body={templateContent.body}
                htmlBody={templateContent.html_body}
                voiceScript={templateContent.voice_script}
                ttsVoiceId={templateContent.tts_voice_id}
                personalizationTokens={templateContent.personalization_tokens}
                onChange={setTemplateContent}
                onAIGenerated={setIsAIGenerated}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
