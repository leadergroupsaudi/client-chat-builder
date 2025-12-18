import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from '@/hooks/useI18n';
import CodeEditor from './CodeEditor';

interface CodeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  title?: string;
}

export const CodeEditorModal = ({
  isOpen,
  onClose,
  value,
  onChange,
  title,
}: CodeEditorModalProps) => {
  const { t, isRTL } = useI18n();
  const [localCode, setLocalCode] = useState(value);

  // Sync local state when modal opens or value changes
  useEffect(() => {
    if (isOpen) {
      setLocalCode(value);
    }
  }, [isOpen, value]);

  const handleSave = () => {
    onChange(localCode);
    onClose();
  };

  const handleCancel = () => {
    setLocalCode(value); // Reset to original
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent
        dir={isRTL ? 'rtl' : 'ltr'}
        className="dark:bg-slate-800 dark:border-slate-700 max-w-5xl w-[90vw] h-[85vh] flex flex-col"
      >
        <DialogHeader>
          <DialogTitle className="dark:text-white">
            {title || t('workflows.editor.properties.codeEditorModalTitle', { defaultValue: 'Python Code Editor' })}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 rounded-md overflow-hidden border border-slate-300 dark:border-slate-600">
          <CodeEditor
            value={localCode}
            onChange={setLocalCode}
            placeholder={t('workflows.editor.properties.pythonCodePlaceholder', { defaultValue: '# Your arguments are available directly\n# e.g., if you added \'data\' as argument:\nresult = data[\'field\'] * 2' })}
            height="100%"
            width="100%"
          />
        </div>

        <DialogFooter className={`mt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
          >
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
          >
            {t('common.save', { defaultValue: 'Save' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CodeEditorModal;
