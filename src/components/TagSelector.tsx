import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { X, Plus, Tag as TagIcon, Check, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface Tag {
  id: number;
  name: string;
  color: string;
  description?: string;
  entity_type: string;
}

interface TagSelectorProps {
  entityType: 'lead' | 'contact';
  selectedTagIds: number[];
  onTagsChange: (tagIds: number[]) => void;
  disabled?: boolean;
  showCreateOption?: boolean;
  maxDisplay?: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export function TagSelector({
  entityType,
  selectedTagIds,
  onTagsChange,
  disabled = false,
  showCreateOption = true,
  maxDisplay = 5,
}: TagSelectorProps) {
  const { t } = useTranslation();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    fetchTags();
  }, [entityType]);

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/v1/tags', {
        params: { entity_type: entityType },
        headers: getAuthHeaders(),
      });
      setTags(response.data.tags || []);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagToggle = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  const handleRemoveTag = (tagId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onTagsChange(selectedTagIds.filter((id) => id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const response = await axios.post(
        '/api/v1/tags',
        {
          name: newTagName.trim(),
          entity_type: 'both',
          color: '#6B7280',
        },
        { headers: getAuthHeaders() }
      );
      const newTag = response.data;
      setTags([...tags, newTag]);
      onTagsChange([...selectedTagIds, newTag.id]);
      setNewTagName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const filteredTags = tags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (tag.entity_type === entityType || tag.entity_type === 'both')
  );

  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));
  const displayTags = selectedTags.slice(0, maxDisplay);
  const hiddenCount = selectedTags.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {/* Display selected tags */}
      {displayTags.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1"
          style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: tag.color }}
          />
          <span className="text-xs">{tag.name}</span>
          {!disabled && (
            <button
              onClick={(e) => handleRemoveTag(tag.id, e)}
              className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}

      {/* Show count of hidden tags */}
      {hiddenCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{hiddenCount}
        </Badge>
      )}

      {/* Tag selector popover */}
      {!disabled && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground"
            >
              <Plus className="h-3 w-3 mr-1" />
              {t('crm.tags.addTag', 'Add Tag')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput
                placeholder={t('crm.tags.searchTags', 'Search tags...')}
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>
                  {isLoading
                    ? t('common.loading', 'Loading...')
                    : t('crm.tags.noTagsFound', 'No tags found')}
                </CommandEmpty>
                <CommandGroup>
                  {filteredTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => handleTagToggle(tag.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="flex-1">{tag.name}</span>
                        {selectedTagIds.includes(tag.id) && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>

                {/* Create new tag option */}
                {showCreateOption && (
                  <CommandGroup>
                    {isCreating ? (
                      <div className="p-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder={t('crm.tags.newTagName', 'Tag name')}
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            className="h-8 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCreateTag();
                              } else if (e.key === 'Escape') {
                                setIsCreating(false);
                                setNewTagName('');
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={handleCreateTag}
                            disabled={!newTagName.trim()}
                          >
                            {t('common.add', 'Add')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <CommandItem
                        onSelect={() => setIsCreating(true)}
                        className="cursor-pointer"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('crm.tags.createTag', 'Create new tag')}
                      </CommandItem>
                    )}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

// Inline tag display component for read-only display
export function TagDisplay({ tags }: { tags: Tag[] }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="flex items-center gap-1 px-2 py-0.5"
          style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: tag.color }}
          />
          <span className="text-xs">{tag.name}</span>
        </Badge>
      ))}
    </div>
  );
}

export default TagSelector;
