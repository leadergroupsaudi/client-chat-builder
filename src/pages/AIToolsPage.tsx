import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getAIToolCategories, createAIToolCategory, getAITools, favoriteAITool, unfavoriteAITool, importAITools, exportAITools } from '@/services/aiToolService';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Heart, Eye } from 'lucide-react';

const AIToolsPage = () => {
  const [categories, setCategories] = useState([]);
  const [tools, setTools] = useState([]);
  const [filteredTools, setFilteredTools] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recently_added');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === null || tool.category_id === selectedCategory)
    );
    setFilteredTools(filtered);
  }, [searchTerm, sortBy, tools, selectedCategory]);

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

  const handleExport = async () => {
    await exportAITools();
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await importAITools(file);
      fetchTools();
    }
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <div className="w-1/4 p-8 border-r bg-white">
        <h2 className="text-2xl font-bold mb-6 font-sans">Categories</h2>
        {user?.is_super_admin && (
          <div className="flex flex-col gap-4 mb-6">
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
            <Button onClick={handleCreateCategory} className="bg-blue-500 hover:bg-blue-600 text-white">Create Category</Button>
          </div>
        )}
        <ScrollArea className="h-full">
          <ul>
            <li onClick={() => setSelectedCategory(null)} className={`p-3 hover:bg-gray-100 rounded-lg cursor-pointer font-medium ${selectedCategory === null ? 'bg-gray-200' : ''}`}>
              All Tools
            </li>
            {categories.map((category: any) => (
              <li key={category.id} onClick={() => setSelectedCategory(category.id)} className={`p-3 hover:bg-gray-100 rounded-lg cursor-pointer font-medium ${selectedCategory === category.id ? 'bg-gray-200' : ''}`}>
                {category.icon && <i className={`mr-3 ${category.icon}`}></i>}
                {category.name}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="w-3/4 p-12">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold font-sans">AI Tools</h1>
          {user?.is_super_admin && (
            <div className="flex gap-4">
              <Button onClick={handleImport} className="bg-gray-200 hover:bg-gray-300 text-gray-800">Import Tools</Button>
              <Button onClick={handleExport} className="bg-gray-200 hover:bg-gray-300 text-gray-800">Export Tools</Button>
              <Button onClick={handleCreateTool} className="bg-blue-500 hover:bg-blue-600 text-white">Create New Tool</Button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept=".json"
              />
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-10">
          <Input
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md text-lg p-3"
          />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="p-3 border rounded-lg text-lg">
            <option value="recently_added">Recently Added</option>
            <option value="most_liked">Most Liked</option>
            <option value="most_viewed">Most Viewed</option>
            <option value="favourite_tools">Favourite Tools</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredTools.map((tool: any) => (
            <Card key={tool.id} className="hover:shadow-xl transition-shadow duration-300 flex flex-col bg-white rounded-xl overflow-hidden">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg mr-5 flex items-center justify-center">
                    {tool.category && <i className={`${tool.category.icon} text-3xl text-gray-500`}></i>}
                  </div>
                  <CardTitle className="text-xl font-bold font-sans">{tool.name}</CardTitle>
                </div>
                <CardDescription className="text-md">{tool.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
              </CardContent>
              <CardFooter className="flex justify-between items-center bg-gray-50 p-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Heart size={20} />
                    <span className="font-medium">{tool.likes}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Eye size={20} />
                    <span className="font-medium">{tool.views}</span>
                  </div>
                </div>
                <Button onClick={() => handleFavorite(tool)} variant={tool.is_favorited ? 'secondary' : 'outline'} className="rounded-full">
                  {tool.is_favorited ? 'Unfavorite' : 'Favorite'}
                </Button>
                <NavLink to={`/dashboard/ai-tools/${tool.id}`} className="text-blue-500 hover:underline font-medium">
                  View Tool
                </NavLink>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIToolsPage;
