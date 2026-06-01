import React, { useState } from 'react';
import { EnterpriseApp } from '../types';
import { Database, Slack, Ticket, Briefcase, RefreshCw, Layers, CheckCircle2, ChevronRight, MessageSquare, AlertCircle } from 'lucide-react';

interface EnterpriseExplorerProps {
  dbState: any;
  onResetDb: () => void;
  isResetting: boolean;
  enterpriseApps: EnterpriseApp[];
}

export default function EnterpriseExplorer({
  dbState,
  onResetDb,
  isResetting,
  enterpriseApps,
}: EnterpriseExplorerProps) {
  const [activeTab, setActiveTab] = useState<'postgres' | 'slack' | 'jira' | 'hubspot'>('postgres');

  const customers = dbState?.postgres?.customers || [];
  const orders = dbState?.postgres?.orders || [];
  const slackChannels = dbState?.slack?.channels || {};
  const jiraTickets = dbState?.jira?.tickets || [];
  const hubspotContacts = dbState?.hubspot?.contacts || [];

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 overflow-hidden rounded-lg border border-slate-205 shadow-sm" id="enterprise-data-explorer">
      {/* Explorer Header */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/85 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-600" />
          <h2 className="font-bold text-xs uppercase tracking-wide text-slate-800">Enterprise Data Matrix</h2>
        </div>
        <button
          onClick={onResetDb}
          disabled={isResetting}
          className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-50 text-slate-600 font-bold rounded transition-colors cursor-pointer shadow-3xs"
          title="Reset databases to standard baseline state"
          id="btn-reset-telemetry-db"
        >
          <RefreshCw className={`w-3 h-3 ${isResetting ? 'animate-spin text-indigo-600' : ''}`} />
          {isResetting ? 'Resetting...' : 'Reset DB'}
        </button>
      </div>

      {/* Explorer Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 p-1 gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('postgres')}
          className={`flex-1 py-1.5 px-1.5 rounded text-[10.5px] font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'postgres'
              ? 'bg-white text-indigo-700 border border-slate-200/80 shadow-3xs font-semibold'
              : 'text-slate-500 hover:bg-slate-100/60 hover:text-slate-800'
          }`}
          id="tab-btn-postgres"
        >
          <Database className="w-3.5 h-3.5 text-indigo-500" />
          <span className="hidden sm:inline">PostgreSQL</span>
        </button>
        <button
          onClick={() => setActiveTab('slack')}
          className={`flex-1 py-1.5 px-1.5 rounded text-[10.5px] font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'slack'
              ? 'bg-white text-indigo-700 border border-slate-200/80 shadow-3xs font-semibold'
              : 'text-slate-500 hover:bg-slate-100/60 hover:text-slate-800'
          }`}
          id="tab-btn-slack"
        >
          <Slack className="w-3.5 h-3.5 text-rose-500" />
          <span className="hidden sm:inline">Slack</span>
        </button>
        <button
          onClick={() => setActiveTab('jira')}
          className={`flex-1 py-1.5 px-1.5 rounded text-[10.5px] font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'jira'
              ? 'bg-white text-indigo-700 border border-slate-200/80 shadow-3xs font-semibold'
              : 'text-slate-500 hover:bg-slate-100/60 hover:text-slate-800'
          }`}
          id="tab-btn-jira"
        >
          <Ticket className="w-3.5 h-3.5 text-sky-500" />
          <span className="hidden sm:inline">Jira Support</span>
        </button>
        <button
          onClick={() => setActiveTab('hubspot')}
          className={`flex-1 py-1.5 px-1.5 rounded text-[10.5px] font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'hubspot'
              ? 'bg-white text-indigo-700 border border-slate-200/80 shadow-3xs font-semibold'
              : 'text-slate-500 hover:bg-slate-100/60 hover:text-slate-800'
          }`}
          id="tab-btn-hubspot"
        >
          <Briefcase className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">HubSpot CRM</span>
        </button>
      </div>

      {/* Explorer Content Window */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#fcfdfd]" id="explorer-view-portal">
        
        {/* Tab 1: PostgreSQL Customer & Order Tables */}
        {activeTab === 'postgres' && (
          <div className="space-y-3.5 text-xs animate-fadeIn" id="postgres-tab-content">
            {/* Customers table */}
            <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-3xs">
              <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <h3 className="font-bold text-slate-800 text-[10px] font-mono uppercase tracking-wider">public.customers</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 bg-slate-50/50 font-bold uppercase text-[9px]">
                      <th className="p-2.5 pl-3">Email</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Plan</th>
                      <th className="p-2.5">Balance</th>
                      <th className="p-2.5 pr-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c: any) => (
                      <tr key={c.id || c.email} className="border-b border-slate-100 hover:bg-slate-50/40 text-slate-700 font-mono">
                        <td className="p-2 pl-3 font-bold text-indigo-700 text-xs">{c.email}</td>
                        <td className="p-2">{c.name}</td>
                        <td className="p-2 text-slate-550 font-medium">{c.plan}</td>
                        <td className={`p-2 ${c.balance.includes('Overdue') ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                          {c.balance}
                        </td>
                        <td className="p-2 pr-3">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                            c.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Orders table */}
            <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-3xs">
              <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <h3 className="font-bold text-slate-800 text-[10px] font-mono uppercase tracking-wider">public.orders</h3>
              </div>
              <div className="overflow-x-auto animate-fadeIn">
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 bg-slate-50/50 font-bold uppercase text-[9px]">
                      <th className="p-2.5 pl-3">Order ID</th>
                      <th className="p-2.5">Customer</th>
                      <th className="p-2.5">Product</th>
                      <th className="p-2.5">Amount</th>
                      <th className="p-2.5 pr-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o: any) => (
                      <tr key={o.order_id} className="border-b border-slate-100 hover:bg-slate-50/40 text-slate-700 font-mono">
                        <td className="p-2 pl-3 font-semibold text-slate-500">{o.order_id}</td>
                        <td className="p-2 font-semibold text-indigo-750">{o.email}</td>
                        <td className="p-2 text-slate-650">{o.product}</td>
                        <td className="p-2 text-teal-600 font-bold">{o.amount}</td>
                        <td className="p-2 pr-3">
                          <span className="text-slate-500 font-medium">{o.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Slack workspaces chat feeds */}
        {activeTab === 'slack' && (
          <div className="space-y-4 animate-fadeIn" id="slack-tab-content">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {Object.keys(slackChannels).map(channelName => {
                const messages = slackChannels[channelName] || [];
                return (
                  <div key={channelName} className="bg-white rounded border border-slate-200 overflow-hidden flex flex-col h-[280px] shadow-3xs">
                    <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 font-mono text-[10px]">
                      <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
                      <span className="font-bold text-slate-700">{channelName}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5 font-mono scrollbar-thin">
                      {messages.map((m: any, idx: number) => {
                        const isSystem = m.sender === 'BillingBot' || m.sender === 'OpsBot' || m.sender === 'JiraLink';
                        const isAgent = m.sender === 'Agent Studio Orchestrator' || m.sender === 'Orchestration Agent';
                        return (
                          <div key={idx} className="bg-slate-50/80 p-2 rounded border border-slate-150 text-[9.5px]">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className={`font-bold ${
                                isAgent ? 'text-indigo-705' : isSystem ? 'text-emerald-700' : 'text-slate-600'
                              }`}>
                                {m.sender}
                              </span>
                              <span className="text-[8px] text-slate-400">{m.timestamp}</span>
                            </div>
                            <p className="text-slate-705 select-all font-mono whitespace-pre-wrap leading-normal">{m.message}</p>
                          </div>
                        );
                      })}
                      {messages.length === 0 && (
                        <div className="text-center py-10 text-slate-400 text-[10px]">
                          No messages published.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Jira support board */}
        {activeTab === 'jira' && (
          <div className="space-y-2.5 font-mono animate-fadeIn" id="jira-tab-content">
            {jiraTickets.map((t: any) => (
              <div key={t.id} className="bg-white rounded border border-slate-200 overflow-hidden text-[11px] shadow-3xs">
                <div className="p-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold border border-indigo-150 rounded">
                      {t.id}
                    </span>
                    <h4 className="font-bold text-slate-800 font-sans text-xs">{t.title}</h4>
                  </div>
                  <div className="flex items-center gap-1.5 text-[8.5px] font-bold">
                    <span className={`px-1.5 py-0.5 rounded border uppercase ${
                      t.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-150' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      Priority: {t.priority}
                    </span>
                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-750 border border-indigo-200 rounded uppercase">
                      Status: {t.status}
                    </span>
                  </div>
                </div>
                <div className="p-3 space-y-2 font-sans">
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded text-[10.5px] leading-relaxed italic border border-slate-100">
                    "{t.description}"
                  </p>
                  
                  {/* Comment threads */}
                  {t.comments && t.comments.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-150/60 font-mono">
                      <span className="text-[8px] text-slate-400 uppercase tracking-widest font-extrabold block">Live Thread Updates</span>
                      {t.comments.map((c: any, cIdx: number) => (
                        <div key={cIdx} className="bg-slate-50 p-2 rounded border border-slate-150 text-[9.5px]">
                          <span className="font-bold text-slate-500 block mb-0.5 text-[9px]">{c.sender}</span>
                          <p className="text-slate-700 select-all">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {jiraTickets.length === 0 && (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-lg text-slate-400">
                No Jira tasks generated.
              </div>
            )}
          </div>
        )}

        {/* Tab 4: HubSpot Sales CRM contacts */}
        {activeTab === 'hubspot' && (
          <div className="space-y-3 animate-fadeIn" id="hubspot-tab-content">
            <div className="bg-white rounded border border-slate-200 overflow-hidden text-xs shadow-3xs">
              <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                <h3 className="font-bold text-slate-850 text-[10px] font-mono uppercase tracking-wider">crm.contacts</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 bg-slate-50/50 font-bold uppercase text-[9px]">
                      <th className="p-2.5 pl-3">Email Address</th>
                      <th className="p-2.5">Telephone</th>
                      <th className="p-2.5">Lifecycle</th>
                      <th className="p-2.5">Sales Owner</th>
                      <th className="p-2.5 pr-3">Associated Deal Record</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hubspotContacts.map((c: any) => (
                      <tr key={c.email} className="border-b border-slate-100 hover:bg-slate-50/40 text-slate-700 font-mono">
                        <td className="p-2.5 pl-3 font-bold text-indigo-700 text-xs">{c.email}</td>
                        <td className="p-2.5 text-slate-500">{c.phone}</td>
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                            {c.lifecycle_stage}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-500">{c.owner}</td>
                        <td className="p-2.5 pr-3 text-slate-450 select-all text-[9.5px] font-semibold">{c.associated_deal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* API Reference bottom section so user gets ideas  */}
      <div className="p-2.5 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-500 space-y-1 font-mono shrink-0">
        <span className="text-indigo-800 font-extrabold block uppercase tracking-wider text-[8px]">API Tools Available for your prompts</span>
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-0.5 text-slate-500">
          <div>• <code className="text-indigo-900 bg-slate-100 px-1 py-0.2 rounded border border-slate-200/50 text-[9px]">search_customer_by_email(email)</code></div>
          <div>• <code className="text-indigo-900 bg-slate-100 px-1 py-0.2 rounded border border-slate-200/50 text-[9px]">update_customer_status(email, status)</code></div>
          <div>• <code className="text-indigo-900 bg-slate-100 px-1 py-0.2 rounded border border-slate-200/50 text-[9px]">slack_post_message(channel, text)</code></div>
          <div>• <code className="text-indigo-900 bg-slate-100 px-1 py-0.2 rounded border border-slate-200/50 text-[9px]">create_ticket(title, desc, priority)</code></div>
          <div>• <code className="text-indigo-900 bg-slate-100 px-1 py-0.2 rounded border border-slate-200/50 text-[9px]">hubspot_get_contact_by_email(email)</code></div>
          <div>• <code className="text-indigo-900 bg-slate-100 px-1 py-0.2 rounded border border-slate-200/50 text-[9px]">list_recent_orders(email)</code></div>
        </div>
      </div>
    </div>
  );
}
