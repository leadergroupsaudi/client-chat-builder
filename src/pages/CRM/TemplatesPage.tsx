import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  Filter,
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
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';
import {
  getTemplates,
  deleteTemplate,
  duplicateTemplate,
  Template,
} from '@/services/templateService';

const TYPE_ICONS: Record<string, any> = {
  email: Mail,
  sms: MessageSquare,
  whatsapp: MessageSquare,
  voice: Phone,
};

const TYPE_COLORS: Record<string, string> = {
  email: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  sms: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  whatsapp: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  voice: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [duplicateName, setDuplicateName] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, [search, typeFilter, page]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await getTemplates({
        search: search || undefined,
        template_type: typeFilter !== 'all' ? typeFilter : undefined,
        page,
        page_size: 20,
      });
      setTemplates(response.templates);
      setTotal(response.total);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: t('crm.common.error'),
        description: t('crm.templates.fetchError', 'Failed to load templates'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    try {
      await deleteTemplate(selectedTemplate.id);
      toast({
        title: t('crm.common.success'),
        description: t('crm.templates.deleted', 'Template deleted successfully'),
      });
      fetchTemplates();
    } catch (error) {
      toast({
        title: t('crm.common.error'),
        description: t('crm.templates.deleteError', 'Failed to delete template'),
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedTemplate(null);
    }
  };

  const handleDuplicate = async () => {
    if (!selectedTemplate || !duplicateName) return;
    try {
      await duplicateTemplate(selectedTemplate.id, duplicateName);
      toast({
        title: t('crm.common.success'),
        description: t('crm.templates.duplicated', 'Template duplicated successfully'),
      });
      fetchTemplates();
    } catch (error) {
      toast({
        title: t('crm.common.error'),
        description: t('crm.templates.duplicateError', 'Failed to duplicate template'),
        variant: 'destructive',
      });
    } finally {
      setDuplicateDialogOpen(false);
      setSelectedTemplate(null);
      setDuplicateName('');
    }
  };

  const openDuplicateDialog = (template: Template) => {
    setSelectedTemplate(template);
    setDuplicateName(`${template.name} (Copy)`);
    setDuplicateDialogOpen(true);
  };

  const openDeleteDialog = (template: Template) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const openPreviewDialog = (template: Template) => {
    setSelectedTemplate(template);
    setPreviewDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateText = (text: string | undefined, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">
            {t('crm.templates.title', 'Templates')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t('crm.templates.description', 'Create and manage reusable message templates')}
          </p>
        </div>
        <Button
          onClick={() => navigate('/dashboard/crm/templates/new')}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('crm.templates.create', 'Create Template')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['email', 'sms', 'whatsapp', 'voice'].map((type) => {
          const count = templates.filter((t) => t.template_type === type).length;
          const Icon = TYPE_ICONS[type];
          return (
            <Card
              key={type}
              className="cursor-pointer hover:shadow-md transition-shadow border-slate-200 dark:border-slate-700 dark:bg-slate-800"
              onClick={() => setTypeFilter(type)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${TYPE_COLORS[type]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold dark:text-white">{count}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {t(`crm.templates.types.${type}`, type)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('crm.templates.searchPlaceholder', 'Search templates...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t('crm.templates.filterByType', 'Filter by type')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('crm.common.all', 'All Types')}</SelectItem>
            <SelectItem value="email">{t('crm.templates.types.email', 'Email')}</SelectItem>
            <SelectItem value="sms">{t('crm.templates.types.sms', 'SMS')}</SelectItem>
            <SelectItem value="whatsapp">{t('crm.templates.types.whatsapp', 'WhatsApp')}</SelectItem>
            <SelectItem value="voice">{t('crm.templates.types.voice', 'Voice')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <CardContent className="p-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium dark:text-white mb-2">
              {t('crm.templates.noTemplates', 'No templates found')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {t('crm.templates.noTemplatesMessage', 'Create your first template to get started')}
            </p>
            <Button
              onClick={() => navigate('/dashboard/crm/templates/new')}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('crm.templates.create', 'Create Template')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const Icon = TYPE_ICONS[template.template_type];
            return (
              <Card
                key={template.id}
                className="group hover:shadow-lg transition-shadow border-slate-200 dark:border-slate-700 dark:bg-slate-800"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${TYPE_COLORS[template.template_type]}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base dark:text-white">
                          {template.name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {formatDate(template.updated_at)}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openPreviewDialog(template)}>
                          <Eye className="h-4 w-4 mr-2" />
                          {t('crm.common.preview', 'Preview')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/dashboard/crm/templates/${template.id}`)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {t('crm.common.edit', 'Edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDuplicateDialog(template)}>
                          <Copy className="h-4 w-4 mr-2" />
                          {t('crm.templates.duplicate', 'Duplicate')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(template)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('crm.common.delete', 'Delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Preview area */}
                  <div
                    className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3 mb-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors min-h-[80px]"
                    onClick={() => openPreviewDialog(template)}
                  >
                    {template.template_type === 'email' && template.html_body ? (
                      <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <span>{t('crm.templates.htmlPreview', 'HTML Email')} - {t('crm.common.preview', 'Click to preview')}</span>
                      </div>
                    ) : (
                      <>
                        {template.subject && (
                          <p className="text-sm font-medium dark:text-white mb-1 line-clamp-1">
                            {template.subject}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {truncateText(template.body || template.voice_script, 80)}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={TYPE_COLORS[template.template_type]}>
                        {t(`crm.templates.types.${template.template_type}`, template.template_type)}
                      </Badge>
                      {template.is_ai_generated && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPreviewDialog(template);
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {t('crm.common.preview', 'Preview')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              {t(`crm.templates.types.${selectedTemplate?.template_type}`, selectedTemplate?.template_type)} {t('crm.templates.template', 'Template')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTemplate?.subject && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('crm.templates.subject', 'Subject')}
                </label>
                <p className="mt-1 dark:text-white">{selectedTemplate.subject}</p>
              </div>
            )}
            {selectedTemplate?.body && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('crm.templates.body', 'Body')}
                </label>
                <div className="mt-1 p-4 bg-gray-50 dark:bg-slate-900 rounded-lg whitespace-pre-wrap dark:text-white">
                  {selectedTemplate.body}
                </div>
              </div>
            )}
            {selectedTemplate?.html_body && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('crm.templates.htmlPreview', 'HTML Preview')}
                </label>
                <div className="mt-1 p-4 bg-white border rounded-lg">
                  <iframe
                    srcDoc={selectedTemplate.html_body}
                    className="w-full h-64 border-0"
                    title="HTML Preview"
                  />
                </div>
              </div>
            )}
            {selectedTemplate?.voice_script && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('crm.templates.voiceScript', 'Voice Script')}
                </label>
                <div className="mt-1 p-4 bg-gray-50 dark:bg-slate-900 rounded-lg whitespace-pre-wrap dark:text-white">
                  {selectedTemplate.voice_script}
                </div>
              </div>
            )}
            {selectedTemplate?.personalization_tokens && selectedTemplate.personalization_tokens.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('crm.templates.tokens', 'Personalization Tokens')}
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedTemplate.personalization_tokens.map((token) => (
                    <Badge key={token} variant="secondary">
                      {token}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              {t('crm.common.close', 'Close')}
            </Button>
            <Button
              onClick={() => {
                setPreviewDialogOpen(false);
                navigate(`/dashboard/crm/templates/${selectedTemplate?.id}`);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              {t('crm.common.edit', 'Edit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('crm.templates.duplicateTemplate', 'Duplicate Template')}</DialogTitle>
            <DialogDescription>
              {t('crm.templates.duplicateDescription', 'Enter a name for the duplicated template')}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={duplicateName}
            onChange={(e) => setDuplicateName(e.target.value)}
            placeholder={t('crm.templates.newName', 'New template name')}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
              {t('crm.common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleDuplicate} disabled={!duplicateName}>
              <Copy className="h-4 w-4 mr-2" />
              {t('crm.templates.duplicate', 'Duplicate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('crm.templates.deleteTitle', 'Delete Template')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('crm.templates.deleteConfirm', 'Are you sure you want to delete this template? This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('crm.common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('crm.common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
