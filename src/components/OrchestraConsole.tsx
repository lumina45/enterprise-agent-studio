import React, { useState, useRef, useEffect } from 'react';
import { Agent, ChatMessage, ExecutionTraceStep } from '../types';
import { Bot, User, Send, Play, Terminal, ChevronDown, ChevronUp, Check, Database, Slack, Ticket, Sparkles, Compass, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrchestraConsoleProps {
  agent: Agent;
  chatMessages: ChatMessage[];
  onSendMessage: (query: string) => void;
  isGenerating: boolean;
  activeTrace: ExecutionTraceStep[];
}

const CHIPS = [
  {
    title: "Reactivate suspended user Bob",
    query: "Find bob@retailco.com in Postgres. Change list status to Active since payment is cleared. Write a summary message to Slack channel #cs-alerts and draft a bill ticket SUP."
  },
  {
    title: "Audit Alice Henderson CRM details",
    query: "Fetch Hubspot CRM record for alice@company.com then cross-reference with order records from PostgreSQL database and report deal metrics."
  },
  {
    title: "Post Alert regarding scaling issues",
    query: "Query recent Slack messages in channel #engineering, then write a follow-up warning posting into Slack channel #ops-room about scaling status."
  }
];

export default function OrchestraConsole({
  agent,
  chatMessages,
  onSendMessage,
  isGenerating,
  activeTrace,
}: OrchestraConsoleProps) {
  const [query, setQuery] = useState('');
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isGenerating, activeTrace]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isGenerating) return;
    onSendMessage(query.trim());
    setQuery('');
  };

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  // Safe and beautiful markdown/bullet parser to render agent reports beautifully without extra dependencies
  const renderMessageContent = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed text-xs">
        {lines.map((line, idx) => {
          if (line.startsWith('###')) {
            return (
              <h3 key={idx} className="font-bold text-slate-900 text-xs sm:text-sm border-b border-slate-150 pb-0.5 mt-3 mb-1.5 font-sans">
                {line.replace('###', '').trim()}
              </h3>
            );
          }
          if (line.startsWith('##')) {
            return (
              <h4 key={idx} className="font-bold text-slate-800 text-[11px] mt-2.5 mb-1 font-sans">
                {line.replace('##', '').trim()}
              </h4>
            );
          }
          if (line.startsWith('-') || line.startsWith('*')) {
            const content = line.substring(1).trim();
            return (
              <li key={idx} className="list-disc pl-1 ml-3.5 text-slate-650 font-sans">
                {formatBoldText(content)}
              </li>
            );
          }
          if (/^\d+\./.test(line)) {
            const content = line.replace(/^\d+\./, '').trim();
            return (
              <li key={idx} className="list-decimal pl-1 ml-3.5 text-slate-650 font-sans">
                {formatBoldText(content)}
              </li>
            );
          }
          return <p key={idx} className="text-slate-650 min-h-[0.5em] font-sans">{formatBoldText(line)}</p>;
        })}
      </div>
    );
  };

  const formatBoldText = (text: string) => {
    // Process simple `**text**` and ``code``
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-indigo-900 font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px] text-emerald-800 border border-slate-200">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'agent_input':
        return <Play className="w-3 h-3 text-indigo-600" />;
      case 'llm_start':
        return <Sparkles className="w-3 h-3 text-violet-600 animate-pulse" />;
      case 'tool_call':
        return <Database className="w-3 h-3 text-amber-600" />;
      case 'tool_response':
        return <Check className="w-3 h-3 text-emerald-600" />;
      case 'llm_end':
        return <Bot className="w-3 h-3 text-indigo-600" />;
      case 'system':
        return <Compass className="w-3 h-3 text-blue-600" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-rose-600" />;
      default:
        return <Terminal className="w-3 h-3 text-slate-500" />;
    }
  };

  const getStepColorClass = (type: string) => {
    switch (type) {
      case 'agent_input':
        return 'border-indigo-100 bg-indigo-50/40 text-slate-800';
      case 'llm_start':
        return 'border-violet-100 bg-violet-50/40 text-slate-800';
      case 'tool_call':
        return 'border-amber-100 bg-amber-50/40 text-slate-800';
      case 'tool_response':
        return 'border-emerald-100 bg-emerald-50/40 text-slate-800';
      case 'llm_end':
        return 'border-indigo-100 bg-indigo-50/50 text-slate-800';
      case 'system':
        return 'border-blue-105 bg-blue-50/40 text-slate-800';
      case 'error':
        return 'border-rose-100 bg-rose-50/40 text-slate-800';
      default:
        return 'border-slate-200 bg-white text-slate-800';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-850 overflow-hidden" id="orchestra-testing-console">
      {/* Console Header */}
      <div className="p-3 border-b border-slate-205 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isGenerating ? (
            <div className="relative flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping absolute" />
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            </div>
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          )}
          <div>
            <h2 className="font-bold text-xs text-slate-900">Operations Sandbox</h2>
            <span className="text-[9px] text-slate-400 block font-mono">
              Running model: <span className="text-indigo-600 font-semibold">gemini-3.5-flash</span> (Server Clearances)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] bg-white border border-slate-200 px-3 py-1 rounded shadow-3xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Active Agent:</span>
          <span className="text-indigo-700 font-semibold">{agent?.name || 'OracleAgent'}</span>
        </div>
      </div>

      {/* Main interaction workspace Splits into chat panel and trace monitor */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative" id="sandbox-grid">
        
        {/* Left column: Chat Feed */}
        <div className="flex-1 flex flex-col h-full bg-[#fcfdfd]/60 border-r border-slate-200 overflow-hidden">
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3.5 scrollbar-thin">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto p-4 space-y-3">
                <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center shadow-3xs">
                  <Bot className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-800">Awaiting Agent Orders</h3>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal font-sans">
                    Select a workflow quick-chip below or formulate custom prompts to let **{agent.name}** orchestrate the connected app tools.
                  </p>
                </div>
              </div>
            )}

            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[90%] sm:max-w-[85%] p-3 rounded border ${
                  msg.role === 'user'
                    ? 'ml-auto bg-white border-indigo-150 text-slate-805 shadow-3xs'
                    : 'bg-[#fafbfe]/85 border-slate-200 text-slate-800 shadow-3xs'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {msg.role === 'user' ? (
                    <User className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                </div>
                <div className="space-y-0.5 overflow-hidden flex-1">
                  <span className="text-[8px] text-slate-400 font-bold font-mono tracking-wider block uppercase">
                    {msg.role === 'user' ? 'Client Request' : `${agent.name} (Response)`}
                  </span>
                  <div>{renderMessageContent(msg.content)}</div>
                </div>
              </div>
            ))}

            {isGenerating && (
              <div className="flex gap-3 max-w-[80%] bg-[#fafbfe]/50 p-3 rounded border border-slate-200/80 animate-pulse">
                <Bot className="w-3.5 h-3.5 text-indigo-500 animate-bounce mt-0.5 shrink-0" />
                <div className="space-y-2 flex-1 animate-pulse">
                  <div className="h-2 bg-slate-200 rounded w-20"></div>
                  <div className="h-2 bg-slate-200 rounded w-full"></div>
                  <div className="h-2 bg-slate-200 rounded w-5/6"></div>
                </div>
              </div>
            )}
            <div ref={messageEndRef} />
          </div>

          {/* Prompt chips suggestions */}
          {chatMessages.length === 0 && (
            <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2 shrink-0">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1 font-sans">
                <Sparkles className="w-3 h-3 text-indigo-600" /> Suggested Operations Pipelines
              </span>
              <div className="grid grid-cols-1 gap-1">
                {CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (!isGenerating) onSendMessage(chip.query);
                    }}
                    className="p-2 bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-indigo-300 rounded text-left text-[10px] text-slate-600 transition-all flex items-start gap-1.5 cursor-pointer font-mono leading-tight hover:text-indigo-900 shadow-3xs"
                  >
                    <span className="text-[8px] px-1 bg-slate-100 text-slate-500 border border-slate-200 rounded font-bold">Chip {idx+1}</span>
                    <span className="truncate flex-1">{chip.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form input */}
          <form onSubmit={handleSubmit} className="p-2 border-t border-slate-200 bg-slate-50 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              disabled={isGenerating}
              placeholder={`Prompt ${agent.name}... e.g. "Resolve overdue Bob Jenkins in database and alert slack"`}
              className="flex-1 bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none rounded px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 font-mono disabled:opacity-50"
              id="prompt-text-field-input"
            />
            <button
              type="submit"
              disabled={isGenerating || !query.trim()}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer text-nowrap"
              id="prompt-send-submit-btn"
            >
              Orchestrate
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>

        {/* Right column: Trace Logs Center */}
        <div className="w-full md:w-[280px] lg:w-[310px] bg-[#fafbfe]/40 border-t md:border-t-0 p-3 flex flex-col h-[280px] md:h-full overflow-hidden" id="trace-panel">
          <div className="flex items-center justify-between pb-2 border-b border-slate-150 flex-none font-mono">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              <h3 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider">Live Agent Trace Logs</h3>
            </div>
            {isGenerating && (
              <span className="text-[9px] text-indigo-600 animate-pulse font-bold">
                ● LLM active
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pt-2 space-y-1.5 pb-20 scrollbar-thin font-mono" id="trace-scroller-portal">
            {activeTrace.length === 0 && !isGenerating && (
              <div className="text-center py-16 text-slate-400 text-[10px]">
                No trace recordings. Send a query to see real-time tool orchestration steps.
              </div>
            )}

            {activeTrace.map((step) => {
              const isExpanded = !!expandedSteps[step.id];
              return (
                <div
                  key={step.id}
                  className={`border rounded text-[10px] transition-all overflow-hidden ${getStepColorClass(step.type)}`}
                >
                  <div
                    onClick={() => toggleStep(step.id)}
                    className="p-2 flex items-start gap-1.5 cursor-pointer select-none hover:bg-white/40"
                  >
                    <div className="mt-0.5 shrink-0">{getStepIcon(step.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-bold text-slate-800 truncate">{step.title}</span>
                        <span className="text-[8px] text-slate-400 whitespace-nowrap">{step.timestamp}</span>
                      </div>
                      <p className="text-slate-500 text-[9px] mt-0.5 leading-tight">{step.message}</p>
                    </div>
                    {step.payload && (
                      <div className="text-slate-400 mt-0.5 shrink-0">
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </div>
                    )}
                  </div>

                  {step.payload && isExpanded && (
                    <div className="p-2.5 bg-slate-900 font-mono text-[9px] text-emerald-450 border-t border-slate-850 select-all overflow-x-auto whitespace-pre leading-relaxed scrollbar-thin">
                      {JSON.stringify(step.payload, null, 2)}
                    </div>
                  )}
                </div>
              );
            })}

            {isGenerating && activeTrace.length > 0 && activeTrace[activeTrace.length - 1].type === 'tool_call' && (
              <div className="flex items-center gap-1.5 p-2 bg-amber-50 border border-amber-100 rounded text-[9px] animate-pulse">
                <Database className="w-3 h-3 text-amber-500 animate-spin" />
                <span className="text-amber-800 font-medium">Executing server-side lookup triggers...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
