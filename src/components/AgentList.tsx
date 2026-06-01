import React, { useState } from 'react';
import { Agent, EnterpriseApp } from '../types';
import { Bot, Plus, Sliders, Check, Hammer, HelpCircle, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AgentListProps {
  agents: Agent[];
  activeAgentId: string;
  onSelectAgent: (id: string) => void;
  onUpdateAgent: (agent: Agent) => void;
  onCreateAgent: (agent: Agent) => void;
  enterpriseApps: EnterpriseApp[];
}

const PRESET_INSTRUCTIONS = [
  {
    name: "OmniCopilot Instructions",
    role: "Operations Expert",
    systemInstruction: "You are an OmniCopilot Agent designed to keep enterprise operations streamlined. You have full clearance to query customer status, update Postgres database entries, broadcast Slack warnings to #cs-alerts, and spawn Jira tickets when tickets or billing errors are discovered. Speak with utmost professional composure, be direct, and act safely on mutations.",
  },
  {
    name: "Pipeline Auditor Instructions",
    role: "Customer Success / CRM Lead",
    systemInstruction: "You are an automated Sales Pipeline Auditor. Your job is to check Hubspot contacts and correlate their details with SQL customer records in our Postgres database. Keep updates precise. Always summarize active deals and check account status before advising.",
  },
  {
    name: "System Dispatcher Instructions",
    role: "Alert Dispatcher",
    systemInstruction: "You are an Alert Dispatcher. You are optimized to write internal notifications, post updates inside corporate Slack channels, and trace alert sequences. Keep your text alerts clear, concise, and highly informative.",
  }
];

export default function AgentList({
  agents,
  activeAgentId,
  onSelectAgent,
  onUpdateAgent,
  onCreateAgent,
  enterpriseApps,
}: AgentListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Operations Expert');
  const [newDesc, setNewDesc] = useState('An operations copilot connected to Postgres, Slack and Jira.');
  const [newInstruction, setNewInstruction] = useState(PRESET_INSTRUCTIONS[0].systemInstruction);
  const [newTemperature, setNewTemperature] = useState(0.4);
  const [newSelectedApps, setNewSelectedApps] = useState<string[]>(['postgres', 'slack', 'jira']);

  const activeAgent = agents.find(a => a.id === activeAgentId) || agents[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newAgent: Agent = {
      id: `agent_${Date.now()}`,
      name: newName,
      role: newRole,
      description: newDesc,
      systemInstruction: newInstruction,
      temperature: newTemperature,
      connectedApps: newSelectedApps,
      createdAt: new Date().toLocaleDateString(),
    };

    onCreateAgent(newAgent);
    setIsCreating(false);
    // Reset state
    setNewName('');
    setNewRole('Operations Expert');
    setNewDesc('An automated enterprise pipeline copilot.');
    setNewInstruction(PRESET_INSTRUCTIONS[0].systemInstruction);
    setNewTemperature(0.4);
    setNewSelectedApps(['postgres', 'slack', 'jira']);
  };

  const toggleAppOnCreator = (appId: string) => {
    if (newSelectedApps.includes(appId)) {
      setNewSelectedApps(newSelectedApps.filter(id => id !== appId));
    } else {
      setNewSelectedApps([...newSelectedApps, appId]);
    }
  };

  const toggleAppOnExisting = (appId: string) => {
    if (!activeAgent) return;
    const isSelected = activeAgent.connectedApps.includes(appId);
    const updatedApps = isSelected
      ? activeAgent.connectedApps.filter(id => id !== appId)
      : [...activeAgent.connectedApps, appId];

    onUpdateAgent({
      ...activeAgent,
      connectedApps: updatedApps,
    });
  };

  const setPresetInstruction = (index: number) => {
    const preset = PRESET_INSTRUCTIONS[index];
    setNewRole(preset.role);
    setNewInstruction(preset.systemInstruction);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 text-slate-800 overflow-hidden" id="agent-list-sidebar">
      {/* Sidebar Header */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/85 shrink-0">
        <div className="flex items-center gap-1.5">
          <Bot className="w-4 h-4 text-indigo-600" />
          <h2 className="font-bold text-[11px] uppercase tracking-wider text-slate-600">Active Agents</h2>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-1 px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded font-bold text-slate-700 border border-slate-200 transition-all cursor-pointer"
          id="btn-create-agent-toggle"
        >
          {isCreating ? 'View Active' : '+ New'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        <AnimatePresence mode="wait">
          {isCreating ? (
            <motion.form
              key="creator"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              onSubmit={handleCreate}
              className="space-y-3.5 text-xs"
              id="agent-creator-form"
            >
              <div className="bg-slate-50/50 p-2.5 rounded border border-slate-200 space-y-3">
                <h3 className="font-bold text-[10px] text-indigo-900 uppercase tracking-wider">New Agent Profile</h3>
                
                <div>
                  <label className="block text-[9px] text-slate-500 uppercase tracking-wider mb-1 font-bold">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OracleCopilot"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 focus:outline-none focus:border-indigo-500 text-xs"
                    id="creator-input-name"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-500 uppercase tracking-wider mb-1 font-bold">Role Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operations Coordinator"
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 focus:outline-none focus:border-indigo-500 text-xs"
                    id="creator-input-role"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-500 uppercase tracking-wider mb-1 font-bold">Short Alignment</label>
                  <textarea
                    rows={2}
                    placeholder="Briefly state primary task alignment."
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 focus:outline-none focus:border-indigo-500 text-xs resize-none"
                    id="creator-input-desc"
                  />
                </div>
              </div>

              {/* Instructions Selector Presets */}
              <div className="bg-slate-50/50 p-2.5 rounded border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase font-bold">
                  <span>System Prompt Presets</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {PRESET_INSTRUCTIONS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPresetInstruction(i)}
                      className="p-1 text-[9px] bg-white border border-slate-200 rounded hover:border-indigo-400 text-slate-600 text-center truncate transition-colors font-medium shadow-2xs"
                    >
                      {preset.name.split(' ')[0]}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[9px] text-slate-500 uppercase tracking-wider mb-1 font-bold">System Instructions</label>
                  <textarea
                    rows={4}
                    value={newInstruction}
                    onChange={e => setNewInstruction(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 focus:outline-none focus:border-indigo-500 font-mono text-[10px] leading-relaxed"
                    id="creator-input-instruction"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 py-1">
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase tracking-wider font-bold">Temperature</label>
                    <span className="text-[10px] font-mono text-indigo-600 font-bold">{newTemperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={newTemperature}
                    onChange={e => setNewTemperature(parseFloat(e.target.value))}
                    className="flex-1 accent-indigo-600 h-1 bg-slate-200 rounded"
                    id="creator-input-temperature"
                  />
                </div>
              </div>

              {/* Connected Apps Block */}
              <div className="bg-slate-50/50 p-2.5 rounded border border-slate-200 space-y-2">
                <h4 className="font-bold text-[10px] text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                  <Hammer className="w-3 h-3 text-indigo-600" /> API CONNECTORS (TOOLS)
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {enterpriseApps.map(app => {
                    const isSelected = newSelectedApps.includes(app.id);
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => toggleAppOnCreator(app.id)}
                        className={`flex items-center justify-between px-2 py-1 rounded border transition-all text-left ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-2xs font-semibold'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800'
                        }`}
                      >
                        <span className="text-[10px] truncate">{app.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded font-bold border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold transition-colors shadow-sm cursor-pointer"
                  id="btn-confirm-create-agent"
                >
                  Create
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3.5"
              id="agent-existing-view"
            >
              {/* Selector List */}
              <div className="space-y-1.5" id="agent-active-select-list">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block mb-1.5">ORCHESTRAL AGENT NODES</span>
                {agents.map(agent => {
                  const isActive = agent.id === activeAgentId;
                  return (
                    <button
                      key={agent.id}
                      onClick={() => onSelectAgent(agent.id)}
                      className={`w-full text-left p-2.5 rounded border transition-all ${
                        isActive
                          ? 'bg-indigo-50 border-indigo-200 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                      id={`agent-item-btn-${agent.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-xs font-bold ${isActive ? 'text-indigo-950' : 'text-slate-800'}`}>
                          {agent.name}
                        </span>
                        <span className={`text-[9px] px-1 rounded font-semibold ${
                          isActive ? 'bg-indigo-200/60 text-indigo-900' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isActive ? 'Running' : 'Idle'}
                        </span>
                      </div>
                      <p className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-indigo-700' : 'text-slate-500'}`}>{agent.role}</p>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {agent.connectedApps.map(id => {
                          const appObj = enterpriseApps.find(a => a.id === id);
                          return (
                            <span key={id} className="text-[8px] bg-white border border-slate-200 text-slate-500 px-1 rounded font-mono">
                              {appObj?.name || id}
                            </span>
                          );
                        })}
                        {agent.connectedApps.length === 0 && (
                          <span className="text-[8px] text-amber-600 bg-amber-50 px-1 border border-amber-200 rounded flex items-center gap-0.5">
                            <ShieldAlert className="w-2 h-2" /> Isolated (No tools)
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected agent detail controller */}
              {activeAgent && (
                <div className="bg-white p-2.5 rounded border border-slate-200 space-y-3 shadow-2xs" id="active-agent-editor-bento">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-slate-150">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <h4 className="font-bold text-[10px] text-slate-700 uppercase tracking-wider">Configure Parameters</h4>
                  </div>

                  <div className="text-[11px] space-y-3">
                    <div>
                      <label className="block text-[9px] text-slate-400 uppercase tracking-wider mb-1 font-bold">Role Alignment</label>
                      <input
                        type="text"
                        value={activeAgent.role}
                        onChange={e => onUpdateAgent({ ...activeAgent, role: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-indigo-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-400 uppercase tracking-wider mb-1 font-bold">System instructions</label>
                      <textarea
                        rows={5}
                        value={activeAgent.systemInstruction}
                        onChange={e => onUpdateAgent({ ...activeAgent, systemInstruction: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 font-mono text-[10px] leading-relaxed resize-y"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <label className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold">Temperature</label>
                        <span className="text-[10px] font-mono text-indigo-600 font-bold">{activeAgent.temperature}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={activeAgent.temperature}
                        onChange={e => onUpdateAgent({ ...activeAgent, temperature: parseFloat(e.target.value) })}
                        className="flex-1 accent-indigo-600 h-1 bg-slate-200 rounded cursor-pointer"
                      />
                    </div>

                    {/* App connectors list */}
                    <div className="pt-2 border-t border-slate-150">
                      <label className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Connected Enterprise APIs</label>
                      <div className="space-y-1">
                        {enterpriseApps.map(app => {
                          const isConnected = activeAgent.connectedApps.includes(app.id);
                          return (
                            <button
                              key={app.id}
                              onClick={() => toggleAppOnExisting(app.id)}
                              className={`w-full flex items-center justify-between p-1.5 rounded transition-colors border text-left ${
                                isConnected
                                  ? 'bg-indigo-50/50 border-indigo-150 text-indigo-950 font-medium'
                                  : 'bg-white border-slate-100 text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                <span className="text-[10px] font-medium">{app.name}</span>
                              </div>
                              <span className="text-[9px] text-slate-500">
                                {isConnected ? 'Active' : 'Muted'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
