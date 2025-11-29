import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Tag as TagIcon,
  Users,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

interface Tag {
  id: number;
  name: string;
  color: string;
  description?: string;
  entity_type: string;
  company_id: number;
  created_at: string;
  updated_at: string;
  lead_count: number;
  contact_count: number;
}

const COLOR_OPTIONS = [
  { value: '#EF4444', label: 'Red' },
  { value: '#F97316', label: 'Orange' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EAB308', label: 'Yellow' },
  { value: '#84CC16', label: 'Lime' },
  { value: '#22C55E', label: 'Green' },
  { value: '#10B981', label: 'Emerald' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#0EA5E9', label: 'Sky' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#6366F1', label: 'Indigo' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#A855F7', label: 'Purple' },
  { value: '#D946EF', label: 'Fuchsia' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#6B7280', label: 'Gray' },
];

export default function TagsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    color: '#6B7280',
    description: '',
    entity_type: 'both',
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const response = await axios.get('/api/v1/tags/', { headers });
      setTags(response.data.tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast({
        title: t('crm.common.error'),
        description: t('crm.tags.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingTag(null);
    setFormData({
      name: '',
      color: '#6B7280',
      description: '',
      entity_type: 'both',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color,
      description: tag.description || '',
      entity_type: tag.entity_type,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: t('crm.common.error'),
        description: t('crm.tags.nameRequired'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const headers = getAuthHeaders();

      if (editingTag) {
        await axios.put(`/api/v1/tags/${editingTag.id}`, formData, { headers });
        toast({
          title: t('crm.common.success'),
          description: t('crm.tags.updated'),
        });
      } else {
        await axios.post('/api/v1/tags/', formData, { headers });
        toast({
          title: t('crm.common.success'),
          description: t('crm.tags.created'),
        });
      }

      setDialogOpen(false);
      fetchTags();
    } catch (error: any) {
      console.error('Error saving tag:', error);
      toast({
        title: t('crm.common.error'),
        description: error.response?.data?.detail || t('crm.tags.saveError'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTag) return;

    try {
      const headers = getAuthHeaders();
      await axios.delete(`/api/v1/tags/${deletingTag.id}`, { headers });
      toast({
        title: t('crm.common.success'),
        description: t('crm.tags.deleted'),
      });
      setDeleteDialogOpen(false);
      setDeletingTag(null);
      fetchTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: t('crm.common.error'),
        description: t('crm.tags.deleteError'),
        variant: 'destructive',
      });
    }
  };

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalLeads = tags.reduce((sum, t) => sum + t.lead_count, 0);
  const totalContacts = tags.reduce((sum, t) => sum + t.contact_count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            {t('crm.tags.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {t('crm.tags.subtitle')}
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('crm.tags.addTag')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  {t('crm.tags.stats.total')}
                </p>
                <p className="text-2xl font-bold dark:text-white">{tags.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50 flex items-center justify-center">
                <TagIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  {t('crm.tags.stats.taggedLeads')}
                </p>
                <p className="text-2xl font-bold dark:text-white">{totalLeads}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  {t('crm.tags.stats.taggedContacts')}
                </p>
                <p className="text-2xl font-bold dark:text-white">{totalContacts}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('crm.tags.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 dark:bg-slate-900 dark:border-slate-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tags Grid */}
      {filteredTags.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <CardContent className="py-12">
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                <TagIcon className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400">{t('crm.tags.noTags')}</p>
              <Button
                variant="link"
                className="mt-2 text-orange-600"
                onClick={openCreateDialog}
              >
                {t('crm.tags.createFirst')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTags.map((tag) => (
            <Card
              key={tag.id}
              className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 hover:shadow-lg transition-all duration-200"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <h3 className="font-semibold dark:text-white">{tag.name}</h3>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(tag)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {t('crm.common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setDeletingTag(tag);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('crm.common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {tag.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                    {tag.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="dark:border-slate-600">
                    {t(`crm.tags.entityTypes.${tag.entity_type}`)}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Target className="h-3.5 w-3.5" />
                    <span>{tag.lead_count} {t('crm.tags.leads')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Users className="h-3.5 w-3.5" />
                    <span>{tag.contact_count} {t('crm.tags.contacts')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editingTag ? t('crm.tags.editTag') : t('crm.tags.addTag')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('crm.tags.fields.name')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('crm.tags.namePlaceholder')}
                className="dark:bg-slate-900 dark:border-slate-600"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('crm.tags.fields.color')}</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      formData.color === color.value
                        ? 'border-gray-900 dark:border-white scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('crm.tags.fields.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('crm.tags.descriptionPlaceholder')}
                rows={2}
                className="dark:bg-slate-900 dark:border-slate-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity_type">{t('crm.tags.fields.entityType')}</Label>
              <Select
                value={formData.entity_type}
                onValueChange={(value) => setFormData({ ...formData, entity_type: value })}
              >
                <SelectTrigger className="dark:bg-slate-900 dark:border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">{t('crm.tags.entityTypes.both')}</SelectItem>
                  <SelectItem value="lead">{t('crm.tags.entityTypes.lead')}</SelectItem>
                  <SelectItem value="contact">{t('crm.tags.entityTypes.contact')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('crm.common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
            >
              {saving ? t('crm.common.saving') : (editingTag ? t('crm.common.save') : t('crm.common.create'))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('crm.tags.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('crm.tags.deleteConfirmDesc', { name: deletingTag?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('crm.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('crm.common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
