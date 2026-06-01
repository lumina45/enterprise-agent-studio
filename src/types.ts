export interface EnterpriseAppTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

export interface EnterpriseApp {
  id: string;
  name: string;
  icon: string;
  category: 'database' | 'communication' | 'ticketing' | 'crm';
  description: string;
  connected: boolean;
  config: Record<string, string>;
  tools: EnterpriseAppTool[];
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  systemInstruction: string;
  temperature: number;
  connectedApps: string[]; // List of EnterpriseApp ids
  createdAt: string;
}

export interface ExecutionTraceStep {
  id: string;
  type: 'agent_input' | 'llm_start' | 'tool_call' | 'tool_response' | 'llm_end' | 'error' | 'system';
  title: string;
  message: string;
  payload?: any;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  trace?: ExecutionTraceStep[];
}
