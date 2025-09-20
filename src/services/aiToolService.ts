
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const getAIToolCategories = async () => {
  const response = await axios.get(`${API_URL}/api/v1/ai-tools/categories/`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createAIToolCategory = async (category: { name: string, icon: string }) => {
  const response = await axios.post(`${API_URL}/api/v1/ai-tools/categories/`, category, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getAITools = async () => {
  const response = await axios.get(`${API_URL}/api/v1/ai-tools/`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createAITool = async (tool: any) => {
  const response = await axios.post(`${API_URL}/api/v1/ai-tools/`, tool, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getAITool = async (id: string) => {
  const response = await axios.get(`${API_URL}/api/v1/ai-tools/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updateAITool = async (id: number, tool: any) => {
  const response = await axios.put(`${API_URL}/api/v1/ai-tools/${id}`, tool, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const deleteAITool = async (id: number) => {
  const response = await axios.delete(`${API_URL}/api/v1/ai-tools/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const deleteAIToolQuestion = async (id: number) => {
  const response = await axios.delete(`${API_URL}/api/v1/ai-tools/questions/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const favoriteAITool = async (id: number) => {
  const response = await axios.post(`${API_URL}/api/v1/ai-tools/${id}/favorite`, {}, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const unfavoriteAITool = async (id: number) => {
  const response = await axios.delete(`${API_URL}/api/v1/ai-tools/${id}/favorite`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const executeAITool = async (id: number, answers: any, language: string) => {
  const response = await axios.post(`${API_URL}/api/v1/ai-tools/${id}/execute`, { answers, language }, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

