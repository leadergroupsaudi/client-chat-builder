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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from '@/hooks/useI18n';
import { Loader2, Save, Sparkles } from "lucide-react";

interface SaveAsTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: number;
  workflowName: string;
}

const DEFAULT_CATEGORIES = [
  "Customer Support",
  "Sales",
  "Scheduling",
  "E-commerce",
  "Surveys",
  "Onboarding",
  "Marketing",
  "HR",
  "Other"
];

export const SaveAsTemplateModal = ({ isOpen, onClose, workflowId, workflowName }: SaveAsTemplateModalProps) => {
  const { t, isRTL } = useI18n();
  const queryClient = useQueryClient();
  const { authFetch } = useAuth();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  // Fetch existing categories
  const { data: categoriesData } = useQuery<{ categories: string[] }>({
    queryKey: ['workflow-template-categories'],
    queryFn: async () => {
      const response = await authFetch('/api/v1/workflow-templates/categories');
      if (!response.ok) return { categories: [] };
      return response.json();
    },
    enabled: isOpen,
  });

  // Merge default and existing categories
  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...(categoriesData?.categories || [])])].sort();

  // Save as template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (data: { workflow_id: number; name: string; description?: string; category?: string }) => {
      const response = await authFetch('/api/v1/workflow-templates/from-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save template');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-template-categories'] });
      toast({
        title: t('common.success'),
        description: t('workflowTemplates.toasts.templateSaved'),
        variant: 'success',
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    if (!name.trim()) return;

    const finalCategory = category === 'custom' ? customCategory.trim() : category;

    saveTemplateMutation.mutate({
      workflow_id: workflowId,
      name: name.trim(),
      description: description.trim() || undefined,
      category: finalCategory || undefined,
    });
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setCategory("");
    setCustomCategory("");
    onClose();
  };

  // Initialize name from workflow name
  useEffect(() => {
    if (isOpen) {
      setName(workflowName ? `${workflowName} Template` : "");
      setDescription("");
      setCategory("");
      setCustomCategory("");
    }
  }, [isOpen, workflowName]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md dark:bg-slate-800 dark:border-slate-700" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="dark:text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            {t('workflowTemplates.saveModal.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="template-name" className="dark:text-gray-300">
              {t('workflowTemplates.saveModal.nameLabel')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('workflowTemplates.saveModal.namePlaceholder')}
              className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="template-description" className="dark:text-gray-300">
              {t('workflowTemplates.saveModal.descriptionLabel')}
            </Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('workflowTemplates.saveModal.descriptionPlaceholder')}
              rows={3}
              className="dark:bg-slate-900 dark:border-slate-600 dark:text-white resize-none"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="template-category" className="dark:text-gray-300">
              {t('workflowTemplates.saveModal.categoryLabel')}
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="template-category" className="dark:bg-slate-900 dark:border-slate-600 dark:text-white">
                <SelectValue placeholder={t('workflowTemplates.saveModal.categoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                {allCategories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="dark:text-white dark:focus:bg-slate-700">
                    {cat}
                  </SelectItem>
                ))}
                <SelectItem value="custom" className="dark:text-white dark:focus:bg-slate-700">
                  {t('workflowTemplates.saveModal.customCategory')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Category Input */}
          {category === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="custom-category" className="dark:text-gray-300">
                {t('workflowTemplates.saveModal.customCategoryLabel')}
              </Label>
              <Input
                id="custom-category"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder={t('workflowTemplates.saveModal.customCategoryPlaceholder')}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
            </div>
          )}

          {/* Info */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('workflowTemplates.saveModal.info')}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || saveTemplateMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {saveTemplateMutation.isPending ? (
              <>
                <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('common.saving')}
              </>
            ) : (
              <>
                <Save className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('workflowTemplates.saveModal.saveButton')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveAsTemplateModal;
