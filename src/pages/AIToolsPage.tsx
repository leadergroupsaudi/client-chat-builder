
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getAIToolCategories, createAIToolCategory, getAITools, favoriteAITool, unfavoriteAITool } from '@/services/aiToolService';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';

const AIToolsPage = () => {
  const [categories, setCategories] = useState([]);
  const [tools, setTools] = useState([]);
  const [filteredTools, setFilteredTools] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recently_added');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchCategories = async () => {
    const data = await getAIToolCategories();
    setCategories(data);
  };

  const fetchTools = async () => {
    const data = await getAITools();
    setTools(data);
    setFilteredTools(data);
  };

  useEffect(() => {
    fetchCategories();
    fetchTools();
  }, []);

  useEffect(() => {
    let sortedTools = [...tools];
    if (sortBy === 'most_liked') {
      sortedTools.sort((a, b) => b.likes - a.likes);
    } else if (sortBy === 'most_viewed') {
      sortedTools.sort((a, b) => b.views - a.views);
    } else if (sortBy === 'favourite_tools') {
      sortedTools.sort((a, b) => (a.is_favorited === b.is_favorited)? 0 : a.is_favorited? -1 : 1);
    }

    const filtered = sortedTools.filter(tool =>
      tool.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTools(filtered);
  }, [searchTerm, sortBy, tools]);

  const handleCreateTool = () => {
    navigate('/dashboard/ai-tools/new');
  };

  const handleFavorite = async (tool: any) => {
    if (tool.is_favorited) {
      await unfavoriteAITool(tool.id);
    } else {
      await favoriteAITool(tool.id);
    }
    fetchTools();
  };

  const handleCreateCategory = async () => {
    await createAIToolCategory({ name: newCategoryName, icon: newCategoryIcon });
    setNewCategoryName('');
    setNewCategoryIcon('');
    fetchCategories();
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">AI Tools</h1>
        {user?.is_super_admin && (
          <Button onClick={handleCreateTool}>Create New Tool</Button>
        )}
      </div>

      <div className="flex justify-between items-center mb-8">
        <Input
          placeholder="Search tools..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="recently_added">Recently Added</option>
          <option value="most_liked">Most Liked</option>
          <option value="most_viewed">Most Viewed</option>
          <option value="favourite_tools">Favourite Tools</option>
        </select>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Categories</h2>
        {user?.is_super_admin && (
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="New category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <Input
              placeholder="Icon name..."
              value={newCategoryIcon}
              onChange={(e) => setNewCategoryIcon(e.target.value)}
            />
            <Button onClick={handleCreateCategory}>Create Category</Button>
          </div>
        )}
        <ScrollArea className="h-48">
          <ul>
            {categories.map((category: any) => (
              <li key={category.id}>{category.name}</li>
            ))}
          </ul>
        </ScrollArea>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredTools.map((tool: any) => (
          <Card key={tool.id}>
            <CardHeader>
              <CardTitle>{tool.name}</CardTitle>
              <CardDescription>{tool.description}</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-between">
              <NavLink to={`/dashboard/ai-tools/${tool.id}`} className="text-blue-500 hover:underline">
                View Tool
              </NavLink>
              <Button onClick={() => handleFavorite(tool)} variant={tool.is_favorited ? 'secondary' : 'outline'}>
                {tool.is_favorited ? 'Unfavorite' : 'Favorite'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AIToolsPage;
