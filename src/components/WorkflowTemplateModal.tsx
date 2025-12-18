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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from '@/hooks/useI18n';
import { useNavigate } from "react-router-dom";
import {
  Search,
  Loader2,
  FileText,
  HelpCircle,
  UserCheck,
  Calendar,
  ShoppingBag,
  MessageSquare,
  Package,
  Sparkles,
  Plus,
  ArrowRight,
  Grid3X3,
  List,
  Star
} from "lucide-react";

interface WorkflowTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Template {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  icon: string | null;
  is_system: boolean;
  usage_count: number;
  created_at: string;
  node_count: number | null;
}

const ICON_MAP: Record<string, any> = {
  'help-circle': HelpCircle,
  'user-check': UserCheck,
  'calendar': Calendar,
  'shopping-bag': ShoppingBag,
  'message-square': MessageSquare,
  'package': Package,
};

const getCategoryIcon = (category: string | null) => {
  switch (category?.toLowerCase()) {
    case 'customer support': return HelpCircle;
    case 'sales': return UserCheck;
    case 'scheduling': return Calendar;
    case 'e-commerce': return ShoppingBag;
    case 'surveys': return MessageSquare;
    default: return FileText;
  }
};

export const WorkflowTemplateModal = ({ isOpen, onClose }: WorkflowTemplateModalProps) => {
  const { t, isRTL } = useI18n();
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [workflowName, setWorkflowName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ['workflow-templates'],
    queryFn: async () => {
      const response = await authFetch('/api/v1/workflow-templates/');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
    enabled: isOpen,
  });

  // Get unique categories
  const categories = ['all', ...new Set(templates.map(t => t.category).filter(Boolean))] as string[];

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Separate system and custom templates
  const systemTemplates = filteredTemplates.filter(t => t.is_system);
  const customTemplates = filteredTemplates.filter(t => !t.is_system);

  // Create workflow from template mutation
  const createFromTemplateMutation = useMutation({
    mutationFn: async ({ templateId, name }: { templateId: number; name: string }) => {
      const response = await authFetch(`/api/v1/workflow-templates/${templateId}/create-workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create workflow');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t('common.success'),
        description: t('workflowTemplates.toasts.workflowCreated'),
        variant: 'success',
      });
      onClose();
      // Navigate to the workflow builder
      navigate(`/dashboard/workflows/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setWorkflowName(template.name);
    setIsCreating(true);
  };

  const handleCreateFromTemplate = () => {
    if (!selectedTemplate || !workflowName.trim()) return;
    createFromTemplateMutation.mutate({
      templateId: selectedTemplate.id,
      name: workflowName.trim(),
    });
  };

  const handleStartFromScratch = () => {
    onClose();
    navigate('/dashboard/workflows/new');
  };

  const handleClose = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedTemplate(null);
    setWorkflowName("");
    setIsCreating(false);
    onClose();
  };

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedCategory("all");
      setSelectedTemplate(null);
      setWorkflowName("");
      setIsCreating(false);
    }
  }, [isOpen]);

  const TemplateIcon = ({ template }: { template: Template }) => {
    const IconComponent = template.icon ? ICON_MAP[template.icon] || getCategoryIcon(template.category) : getCategoryIcon(template.category);
    return <IconComponent className="h-6 w-6" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col dark:bg-slate-800 dark:border-slate-700" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="dark:text-white flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            {t('workflowTemplates.selectTemplate')}
          </DialogTitle>
        </DialogHeader>

        {isCreating && selectedTemplate ? (
          // Template selected - show name input
          <div className="flex-1 py-4">
            <div className="max-w-md mx-auto space-y-6">
              <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                    <TemplateIcon template={selectedTemplate} />
                  </div>
                  <div>
                    <h3 className="font-semibold dark:text-white">{selectedTemplate.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedTemplate.category}</p>
                  </div>
                </div>
                {selectedTemplate.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">{selectedTemplate.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="workflow-name" className="dark:text-gray-300">
                  {t('workflowTemplates.workflowName')}
                </Label>
                <Input
                  id="workflow-name"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder={t('workflowTemplates.workflowNamePlaceholder')}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
                >
                  {t('common.back')}
                </Button>
                <Button
                  onClick={handleCreateFromTemplate}
                  disabled={!workflowName.trim() || createFromTemplateMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  {createFromTemplateMutation.isPending ? (
                    <>
                      <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      {t('workflowTemplates.useTemplate')}
                      <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Template selection view
          <>
            <div className="flex flex-col gap-4 py-2">
              {/* Search and View Toggle */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                  <Input
                    placeholder={t('workflowTemplates.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${isRTL ? 'pr-10' : 'pl-10'} dark:bg-slate-900 dark:border-slate-600 dark:text-white`}
                  />
                </div>
                <div className="flex border rounded-lg dark:border-slate-600 overflow-hidden">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={viewMode === 'grid' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={viewMode === 'list' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Category Tabs */}
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category}
                      value={category}
                      className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-purple-900/30 dark:data-[state=active]:text-purple-400 rounded-full px-4 py-1.5 text-sm"
                    >
                      {category === 'all' ? t('workflowTemplates.categories.all') : category}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Templates Grid/List */}
            <div className="flex-1 overflow-y-auto min-h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">{t('workflowTemplates.noTemplatesFound')}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* System Templates */}
                  {systemTemplates.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        {t('workflowTemplates.systemTemplates')}
                      </h3>
                      <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-3' : 'space-y-2'}>
                        {systemTemplates.map((template) => (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            viewMode={viewMode}
                            onSelect={() => handleSelectTemplate(template)}
                            isRTL={isRTL}
                            t={t}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Templates */}
                  {customTemplates.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                        {t('workflowTemplates.categories.custom')}
                      </h3>
                      <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-3' : 'space-y-2'}>
                        {customTemplates.map((template) => (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            viewMode={viewMode}
                            onSelect={() => handleSelectTemplate(template)}
                            isRTL={isRTL}
                            t={t}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        <DialogFooter className="border-t dark:border-slate-700 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
          >
            {t('common.cancel')}
          </Button>
          {!isCreating && (
            <Button
              onClick={handleStartFromScratch}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('workflowTemplates.startFromScratch')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Template Card Component
interface TemplateCardProps {
  template: Template;
  viewMode: "grid" | "list";
  onSelect: () => void;
  isRTL: boolean;
  t: (key: string, params?: Record<string, any>) => string;
}

const TemplateCard = ({ template, viewMode, onSelect, isRTL, t }: TemplateCardProps) => {
  const IconComponent = template.icon ? ICON_MAP[template.icon] || getCategoryIcon(template.category) : getCategoryIcon(template.category);

  if (viewMode === 'list') {
    return (
      <button
        onClick={onSelect}
        className="w-full flex items-center gap-4 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all text-left"
      >
        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
          <IconComponent className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium dark:text-white truncate">{template.name}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{template.description}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {template.node_count && (
            <span>{template.node_count} nodes</span>
          )}
          {template.usage_count > 0 && (
            <span>{t('workflowTemplates.usedTimes', { count: template.usage_count })}</span>
          )}
        </div>
        <ArrowRight className={`h-4 w-4 text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
      </button>
    );
  }

  return (
    <button
      onClick={onSelect}
      className="flex flex-col p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all text-left group h-full"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
          <IconComponent className="h-5 w-5" />
        </div>
        {template.is_system && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            {t('workflowTemplates.systemTemplate')}
          </span>
        )}
      </div>
      <h4 className="font-medium dark:text-white mb-1">{template.name}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 flex-1">{template.description}</p>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
        <span className="text-xs text-gray-400">{template.category}</span>
        {template.usage_count > 0 && (
          <span className="text-xs text-gray-400">{t('workflowTemplates.usedTimes', { count: template.usage_count })}</span>
        )}
      </div>
    </button>
  );
};

export default WorkflowTemplateModal;
