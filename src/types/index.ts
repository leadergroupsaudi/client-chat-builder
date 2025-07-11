export interface Agent {
  id: number;
  name: string;
  welcome_message: string;
  prompt: string;
  credential_id?: number;
}

export interface ChatMessage {
  id: number;
  agent_id: number;
  session_id: string;
  message: string;
  timestamp: string;
  sender: string; // 'user' or 'agent'
}

export interface Credential {
  id: number;
  platform: string;
  created_at: string;
  updated_at: string;
}