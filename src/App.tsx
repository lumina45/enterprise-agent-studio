import React, { useState, useEffect } from 'react';
import { Agent, ChatMessage, EnterpriseApp, ExecutionTraceStep } from './types';
import AgentList from './components/AgentList';
import EnterpriseExplorer from './components/EnterpriseExplorer';
import OrchestraConsole from './components/OrchestraConsole';
import { Bot, Layers, Database, Slack, Ticket, Briefcase, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

const ENTERPRISE_APPS_PRESETS: EnterpriseApp[] = [
  {
    id: 'postgres',
    name: 'PostgreSQL DB',
    icon: 'Database',
    category: 'database',
    description: 'Core customer profile, purchase records, and plan metadata database.',
    connected: true,
    config: { connection_string: 'postgresql://postgres:***@localhost:5432/enterprise_db' },
    tools: [
      {
        name: 'search_customer_by_email',
        description: 'Search customer profile in PostgreSQL Database by their email address.',
        parameters: {
          type: 'OBJECT',
          properties: {
            email: { type: 'STRING', description: 'Customer email address to search.' }
          },
          required: ['email']
        }
      },
      {
        name: 'update_customer_status',
        description: "Update customer's subscription status (Active or Suspended) in Postgres Database.",
        parameters: {
          type: 'OBJECT',
          properties: {
            email: { type: 'STRING', description: 'Customer email address.' },
            status: { type: 'STRING', description: 'New status (Active, Suspended).' }
          },
          required: ['email', 'status']
        }
      },
      {
        name: 'list_recent_orders',
        description: 'List recent orders and purchases filtered by customer email.',
        parameters: {
          type: 'OBJECT',
          properties: {
            email: { type: 'STRING', description: 'Customer email address.' }
          },
          required: ['email']
        }
      }
    ]
  },
  {
    id: 'slack',
    name: 'Slack Alerts',
    icon: 'Slack',
    category: 'communication',
    description: 'Corporate communications channels workspace for support alerts and engineering updates.',
    connected: true,
    config: { webhook_url: 'https://hooks.slack.com/services/T00/B00/X00' },
    tools: [
      {
        name: 'slack_post_message',
        description: 'Post an operations warning or notification update to an active channel.',
        parameters: {
          type: 'OBJECT',
          properties: {
            channel: { type: 'STRING', description: 'Slack channel (e.g., #cs-alerts, #ops-room, #engineering).' },
            text: { type: 'STRING', description: 'Message details.' }
          },
          required: ['channel', 'text']
        }
      },
      {
        name: 'slack_get_recent_messages',
        description: 'Fetch message timelines from corporate channels.',
        parameters: {
          type: 'OBJECT',
          properties: {
            channel: { type: 'STRING', description: 'Target channel name.' }
          },
          required: ['channel']
        }
      }
    ]
  },
  {
    id: 'jira',
    name: 'Jira Tickets',
    icon: 'Ticket',
    category: 'ticketing',
    description: 'Internal operations desk ticketing system for lodging support and bug tickets.',
    connected: true,
    config: { domain: 'enterprise-jira.atlassian.net' },
    tools: [
      {
        name: 'get_ticket',
        description: 'Fetch detailed Jira boarding ticket by ID.',
        parameters: {
          type: 'OBJECT',
          properties: {
             ticket_id: { type: 'STRING', description: 'Ticket ID (e.g. SUP-101).' }
          },
          required: ['ticket_id']
        }
      },
      {
        name: 'create_ticket',
        description: 'Create a new Jira ticketing task for support issues.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Short title describing ticket.' },
            description: { type: 'STRING', description: 'Complete error log description.' },
            priority: { type: 'STRING', description: 'Priority level (Low, Normal, High).', enum: ['Low', 'Normal', 'High'] }
          },
          required: ['title', 'description', 'priority']
        }
      }
    ]
  },
  {
    id: 'hubspot',
    name: 'HubSpot CRM',
    icon: 'Briefcase',
    category: 'crm',
    description: 'Sales team CRM database containing pipeline lifecycle stages and contract values.',
    connected: true,
    config: { portal_id: '8812102' },
    tools: [
      {
        name: 'hubspot_get_contact_by_email',
        description: 'Audit subscriber lifecycle and associated sales deal values.',
        parameters: {
          type: 'OBJECT',
          properties: {
            email: { type: 'STRING', description: 'Customer lead email address.' }
          },
          required: ['email']
        }
      }
    ]
  }
];

const INITIAL_AGENTS_PRESETS: Agent[] = [
  {
    id: 'agent_omnicopilot',
    name: 'OmniCopilot',
    role: 'Operations Expert',
    description: 'Connected to Postgres, Slack & Jira to handle payments disputes & alert routing.',
    systemInstruction: `You are the OmniCopilot Agent. You have clearance to find customer logs, update account active flags, broadcast messages into corporate Slack channels, and lodge Jira tickets on the engineering service desk.
For customer billing queries, look them up, update customer status to Active if needed, write in Slack alert channels, and create tickets summarizing what was accomplished.`,
    temperature: 0.4,
    connectedApps: ['postgres', 'slack', 'jira'],
    createdAt: '06/01/2026'
  },
  {
    id: 'agent_auditor',
    name: 'CRM Audit Copilot',
    role: 'Customer Success Specialist',
    description: 'Reconciles HubSpot sales deals against live Postgres cloud platform profiles.',
    systemInstruction: `You are the CRM Customer Success Auditor. You are optimized to audit accounts. When asked about user statuses or payments, lookup Hubspot and search Postgres to map actual contracts, then report clean, itemized status updates.`,
    temperature: 0.3,
    connectedApps: ['postgres', 'hubspot'],
    createdAt: '06/01/2026'
  },
  {
    id: 'agent_dispatcher',
    name: 'Workspace Alert Dispatcher',
    role: 'Communications Assistant',
    description: 'Broadcasts system warnings to operations Slack channels on request.',
    systemInstruction: `You are the Workspace Alert Dispatcher. You compose clear internal status notifications and post them into active Slack rooms.`,
    temperature: 0.5,
    connectedApps: ['slack'],
    createdAt: '06/01/2026'
  }
];

export default function App() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS_PRESETS);
  const [activeAgentId, setActiveAgentId] = useState<string>('agent_omnicopilot');
  const [dbState, setDbState] = useState<any>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeTrace, setActiveTrace] = useState<ExecutionTraceStep[]>([]);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [mobileTab, setMobileTab] = useState<'sandbox' | 'explorer'>('sandbox');

  const activeAgent = agents.find(a => a.id === activeAgentId) || agents[0];

  // Fetch mock server state
  const fetchDbState = async () => {
    try {
      const res = await fetch('/api/enterprise/state');
      const data = await res.json();
      if (data.success) {
        setDbState(data.dbState);
      }
    } catch (e) {
      console.error('Failure fetching mock DB states', e);
    }
  };

  useEffect(() => {
    fetchDbState();
  }, []);

  const handleResetDb = async () => {
    setIsResetting(true);
    try {
       const res = await fetch('/api/enterprise/reset', { method: 'POST' });
       const data = await res.json();
       if (data.success) {
         setDbState(data.dbState);
       }
    } catch (e) {
       console.error('Could not reset databases', e);
    } finally {
       setIsResetting(false);
    }
  };

  const handleSendMessage = async (query: string) => {
    if (!query.trim() || isGenerating) return;

    // Push client user message to history
    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);
    setActiveTrace([]); // Clear active logs preview node

    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: activeAgent,
          query,
          chatHistory: chatMessages.slice(-6) // Include last couple turns
        })
      });

      const data = await res.json();

      if (data.success) {
        // Build server response message
        const systemMessage: ChatMessage = {
          id: `msg_agent_${Date.now()}`,
          role: 'assistant',
          content: data.responseText,
          timestamp: new Date().toLocaleTimeString(),
          trace: data.traceSteps
        };

        setChatMessages(prev => [...prev, systemMessage]);
        // Update live database stats in dashboard
        if (data.dbState) {
          setDbState(data.dbState);
        }
        if (data.traceSteps) {
          setActiveTrace(data.traceSteps);
        }
      } else {
        const errorMessage: ChatMessage = {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Agent Error**: ${data.error || 'The agent failed to complete the orchestrating turns.'}`,
          timestamp: new Date().toLocaleTimeString()
        };
        setChatMessages(prev => [...prev, errorMessage]);
        if (data.traceSteps) {
          setActiveTrace(data.traceSteps);
        }
      }
    } catch (err: any) {
       console.error('Failed dispatching agent payload', err);
       const errorMessage: ChatMessage = {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Transport Error**: Failed linking to backend server. Ensure developer server is online.`,
          timestamp: new Date().toLocaleTimeString()
        };
        setChatMessages(prev => [...prev, errorMessage]);
    } finally {
       setIsGenerating(false);
    }
  };

  const handleCreateAgent = (newAgent: Agent) => {
    setAgents(prev => [...prev, newAgent]);
    setActiveAgentId(newAgent.id);
    setChatMessages([]);
    setActiveTrace([]);
  };

  const handleUpdateAgent = (updatedAgent: Agent) => {
    setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#f8fafc] font-sans text-slate-900 overflow-hidden border border-slate-200" id="nexus-agent-root-canvas">
      
      {/* Universal Workspace Header / "High Density" Light Navigator */}
      <header className="h-12 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-4 flex-none">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white font-extrabold text-xs" id="app-logo-badge">
              Ω
            </div>
            <h1 className="font-bold text-sm tracking-tight text-slate-900 antialiased flex items-center gap-1.5 font-sans">
              AGENTIC.OS
              <span className="text-[9px] bg-indigo-50 text-indigo-700 font-mono font-bold px-1.5 py-0.5 rounded border border-indigo-200">
                L3 CLUSTER
              </span>
            </h1>
          </div>
          <nav className="hidden lg:flex gap-4">
            <span className="text-xs font-semibold text-indigo-600 border-b-2 border-indigo-600 pb-3 px-1 mt-3">Orchestrator Sandbox</span>
            <span className="text-xs font-medium text-slate-400 hover:text-slate-600 pb-3 px-1 mt-3 cursor-not-allowed">Connectors</span>
            <span className="text-xs font-medium text-slate-400 hover:text-slate-600 pb-3 px-1 mt-3 cursor-not-allowed">Compliance Vault</span>
          </nav>
        </div>

        {/* Global Cluster Status API Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-mono">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span>CLUSTER: PROD-US-EAST-1</span>
          </div>

          <button
            onClick={handleResetDb}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white hover:bg-slate-50 text-slate-700 font-medium rounded border border-slate-300 shadow-sm transition-all cursor-pointer"
            id="global-reset-db-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reset Workspace Data</span>
            <span className="sm:hidden">Reset</span>
          </button>
        </div>
      </header>

      {/* Main Splits Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative bg-slate-50" id="nexus-main-workspace-flex">
        
        {/* Column 1: Agent List & Parameter Controllers (Sidebar) */}
        <div className="w-full md:w-[270px] lg:w-[300px] h-[320px] md:h-full flex-none">
          <AgentList
            agents={agents}
            activeAgentId={activeAgentId}
            onSelectAgent={(id) => {
              setActiveAgentId(id);
              setChatMessages([]);
              setActiveTrace([]);
            }}
            onUpdateAgent={handleUpdateAgent}
            onCreateAgent={handleCreateAgent}
            enterpriseApps={ENTERPRISE_APPS_PRESETS}
          />
        </div>

        {/* Workspace Panels (Sandbox & Data-logs Telemetry) */}
        <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4">
          
          {/* Mobile view top controller tabs togglers */}
          <div className="md:hidden flex bg-white border border-slate-250 p-1 flex-none gap-1 rounded-lg mb-2.5 shadow-xs">
            <button
              onClick={() => setMobileTab('sandbox')}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded text-center transition-colors ${
                mobileTab === 'sandbox' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Orchestrator Sandbox
            </button>
            <button
              onClick={() => setMobileTab('explorer')}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded text-center transition-colors ${
                mobileTab === 'explorer' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Enterprise Data Vault
            </button>
          </div>

          {/* Desktop Responsive splits */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden gap-4">
            
            {/* Split A: Active Interaction Console (Applies on tablet desktop) */}
            <div className={`flex-1 h-full ${mobileTab === 'sandbox' ? 'flex' : 'hidden md:flex'}`}>
              <OrchestraConsole
                agent={activeAgent}
                chatMessages={chatMessages}
                onSendMessage={handleSendMessage}
                isGenerating={isGenerating}
                activeTrace={activeTrace}
              />
            </div>

            {/* Split B: Real-time Telemetry monitor database layout */}
            <div className={`w-full lg:w-[460px] xl:w-[490px] h-full ${
              mobileTab === 'explorer' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
            }`}>
              <EnterpriseExplorer
                dbState={dbState}
                onResetDb={handleResetDb}
                isResetting={isResetting}
                enterpriseApps={ENTERPRISE_APPS_PRESETS}
              />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
