import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Simulated Enterprise IT Environment Database State
interface PostgresDb {
  customers: Array<{ id: string; name: string; email: string; plan: string; balance: string; status: string }>;
  orders: Array<{ order_id: string; email: string; product: string; amount: string; status: string }>;
}

interface SlackWorkspace {
  channels: Record<string, Array<{ sender: string; message: string; timestamp: string }>>;
}

interface JiraTicket {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  comments: Array<{ sender: string; text: string }>;
}

interface HubspotCrm {
  contacts: Array<{ email: string; phone: string; lifecycle_stage: string; owner: string; associated_deal: string }>;
}

interface DbState {
  postgres: PostgresDb;
  slack: SlackWorkspace;
  jira: { tickets: JiraTicket[] };
  hubspot: HubspotCrm;
}

const dbState: DbState = {
  postgres: {
    customers: [
      { id: "cust_1", name: "Alice Henderson", email: "alice@company.com", plan: "Enterprise Plus", balance: "$12,450.00", status: "Active" },
      { id: "cust_2", name: "Bob Jenkins", email: "bob@retailco.com", plan: "Pro", balance: "-$120.00 (Overdue)", status: "Suspended" },
      { id: "cust_3", name: "Carla Gomez", email: "carla@startup.io", plan: "Free Developer", balance: "$0.00", status: "Active" }
    ],
    orders: [
      { order_id: "ORD-9021", email: "alice@company.com", product: "Database Cloud Host", amount: "$3,500.00", status: "Delivered" },
      { order_id: "ORD-9022", email: "alice@company.com", product: "API Proxy Annual License", amount: "$8,950.00", status: "Processing" },
      { order_id: "ORD-8812", email: "bob@retailco.com", product: "Database Starter Tier", amount: "$120.00", status: "Pending Payment" }
    ]
  },
  slack: {
    channels: {
      "#cs-alerts": [
        { sender: "BillingBot", message: "Customer alert: bob@retailco.com subscription balance overdue ($120).", timestamp: "Today 8:15 AM" }
      ],
      "#ops-room": [
        { sender: "OpsBot", message: "Production kubernetes deployment code: v2.4.1 finished successfully.", timestamp: "Today 6:00 AM" }
      ],
      "#engineering": [
        { sender: "LeadArchitect", message: "Any updates on the scaling issues for company.com account?", timestamp: "Yesterday 4:30 PM" }
      ]
    }
  },
  jira: {
    tickets: [
      { id: "SUP-101", title: "RetailCo / Bob Jenkins account suspended query", description: "Bob Jenkins (bob@retailco.com) is complaining his account was suspended. Needs accounting log verification.", priority: "High", status: "Open", comments: [] },
      { id: "SUP-102", title: "Alice Henderson API Rate Limit increase", description: "Request to lift standard rate-limiting caps to 50k req/min for plan validation.", priority: "Normal", status: "In Progress", comments: [{ sender: "Support Agent", text: "Contacted ops to check readiness." }] }
    ]
  },
  hubspot: {
    contacts: [
      { email: "alice@company.com", phone: "+1-555-0192", lifecycle_stage: "SQL Customer", owner: "Sarah Miller", associated_deal: "Enterprise Renewal Plan - $12,000" },
      { email: "bob@retailco.com", phone: "+1-555-0143", lifecycle_stage: "Inactive/Suspended", owner: "Tom Harrison", associated_deal: "Pro Annual RetailCo Deal - $120" },
      { email: "carla@startup.io", phone: "+1-555-0158", lifecycle_stage: "Prospect", owner: "Sarah Miller", associated_deal: "Startup Launch Offer - $1,200" }
    ]
  }
};

// Define tool descriptions and schemas to supply to Gemini Function Calling
const TOOLS_DEFINITIONS: Record<string, any[]> = {
  postgres: [
    {
      name: "search_customer_by_email",
      description: "Search customer profile in PostgreSQL Database by their email address.",
      parameters: {
        type: "OBJECT",
        properties: {
          email: { type: "STRING", description: "Customer email address to search." }
        },
        required: ["email"]
      }
    },
    {
      name: "list_recent_orders",
      description: "List recent orders and purchases made by a customer from Postgres Database.",
      parameters: {
        type: "OBJECT",
        properties: {
          email: { type: "STRING", description: "Customer email address to filter orders." }
        },
        required: ["email"]
      }
    },
    {
      name: "update_customer_status",
      description: "Update a customer's subscription or account status (Active, Suspended) in Postgres Database.",
      parameters: {
        type: "OBJECT",
        properties: {
          email: { type: "STRING", description: "Customer email address to search and update." },
          status: { type: "STRING", description: "The new account status (Active, Suspended)." }
        },
        required: ["email", "status"]
      }
    }
  ],
  slack: [
    {
      name: "slack_post_message",
      description: "Post an internal message or alert to a specific Slack channel inside the Slack Workspace.",
      parameters: {
        type: "OBJECT",
        properties: {
          channel: { type: "STRING", description: "The slack channel (e.g., #cs-alerts, #ops-room, #engineering)." },
          text: { type: "STRING", description: "The message contents to post." }
        },
        required: ["channel", "text"]
      }
    },
    {
      name: "slack_get_recent_messages",
      description: "Get recent message history from a specific Slack channel.",
      parameters: {
        type: "OBJECT",
        properties: {
          channel: { type: "STRING", description: "The slack channel name." }
        },
        required: ["channel"]
      }
    }
  ],
  jira: [
    {
      name: "get_ticket",
      description: "Fetch detail of a Jira ticketing issue by ticket system ID (e.g. SUP-101).",
      parameters: {
        type: "OBJECT",
        properties: {
          ticket_id: { type: "STRING", description: "The Jira systemic Ticket ID (e.g., SUP-101)." }
        },
        required: ["ticket_id"]
      }
    },
    {
      name: "create_ticket",
      description: "Create a new Jira ticketing task for support or engineering issues.",
      parameters: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING", description: "Brief title describing the issue." },
          description: { type: "STRING", description: "Detailed summary of the problem." },
          priority: { type: "STRING", description: "Ticket priority level (Low, Normal, High).", enum: ["Low", "Normal", "High"] }
        },
        required: ["title", "description", "priority"]
      }
    },
    {
      name: "add_comment_to_ticket",
      description: "Add a comment update to an existing Jira ticket.",
      parameters: {
        type: "OBJECT",
        properties: {
          ticket_id: { type: "STRING", description: "The Jira ticket ID (e.g., SUP-101)." },
          comment: { type: "STRING", description: "The comment string contents." }
        },
        required: ["ticket_id", "comment"]
      }
    }
  ],
  hubspot: [
    {
      name: "hubspot_get_contact_by_email",
      description: "Retrieve Hubspot CRM contact details and associated sales deal summary by email.",
      parameters: {
        type: "OBJECT",
        properties: {
          email: { type: "STRING", description: "The CRM user email address." }
        },
        required: ["email"]
      }
    }
  ]
};

// Dispatch the function call locally in the mock database
function executeToolLocal(name: string, args: any): any {
  switch (name) {
    case "search_customer_by_email": {
      const email = String(args.email || "").trim().toLowerCase();
      const customer = dbState.postgres.customers.find(c => c.email.toLowerCase() === email);
      return customer ? { success: true, customer } : { success: false, error: `No customer record found for email "${email}"` };
    }
    case "list_recent_orders": {
      const email = String(args.email || "").trim().toLowerCase();
      const orders = dbState.postgres.orders.filter(o => o.email.toLowerCase() === email);
      return { success: true, count: orders.length, orders };
    }
    case "update_customer_status": {
      const email = String(args.email || "").trim().toLowerCase();
      const status = String(args.status || "").trim();
      const customer = dbState.postgres.customers.find(c => c.email.toLowerCase() === email);
      if (customer) {
        customer.status = status;
        return { success: true, message: `Successfully updated customer status for ${email} to "${status}".`, customer };
      }
      return { success: false, error: `Customer with email "${email}" not found.` };
    }
    case "slack_post_message": {
      const channel = String(args.channel || "");
      const text = String(args.text || "");
      if (!dbState.slack.channels[channel]) {
        dbState.slack.channels[channel] = [];
      }
      const entry = { sender: "Agent Studio Orchestrator", message: text, timestamp: "Just now" };
      dbState.slack.channels[channel].push(entry);
      return { success: true, posted: true, channel, entry };
    }
    case "slack_get_recent_messages": {
      const channel = String(args.channel || "");
      const messages = dbState.slack.channels[channel] || [];
      return { success: true, channel, messages };
    }
    case "get_ticket": {
      const id = String(args.ticket_id || "").trim().toUpperCase();
      const ticket = dbState.jira.tickets.find(t => t.id === id);
      return ticket ? { success: true, ticket } : { success: false, error: `Jira ticket was not found with ID "${id}".` };
    }
    case "create_ticket": {
      const title = String(args.title || "");
      const description = String(args.description || "");
      const priority = String(args.priority || "Normal");
      const id = `SUP-${100 + dbState.jira.tickets.length + 1}`;
      const ticket: JiraTicket = { id, title, description, priority, status: "Open", comments: [] };
      dbState.jira.tickets.push(ticket);
      // Automatically post warning to Slack about new Jira tickets
      if (!dbState.slack.channels["#cs-alerts"]) {
        dbState.slack.channels["#cs-alerts"] = [];
      }
      dbState.slack.channels["#cs-alerts"].push({
        sender: "JiraLink",
        message: `New ticket created: ${id} - "${title}" by Orchestration Agent (Priority: ${priority})`,
        timestamp: "Just now"
      });
      return { success: true, message: `Jira ticketing successfully created ${id}.`, ticket };
    }
    case "add_comment_to_ticket": {
      const id = String(args.ticket_id || "").trim().toUpperCase();
      const comment = String(args.comment || "");
      const ticket = dbState.jira.tickets.find(t => t.id === id);
      if (ticket) {
        const commentObj = { sender: "Orchestration Agent", text: comment };
        ticket.comments.push(commentObj);
        return { success: true, message: `Added comment to ticket ${id}.`, comment: commentObj };
      }
      return { success: false, error: `Jira ticket with ID "${id}" was not found.` };
    }
    case "hubspot_get_contact_by_email": {
      const email = String(args.email || "").trim().toLowerCase();
      const contact = dbState.hubspot.contacts.find(c => c.email.toLowerCase() === email);
      return contact ? { success: true, contact } : { success: false, error: `Hubspot CRM record not found for email "${email}"` };
    }
    default:
      return { success: false, error: `Internal execution lookup error: tool "${name}" not found.` };
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API router to fetch mock database state for visuals
  app.get("/api/enterprise/state", (req, res) => {
    res.json({ success: true, dbState });
  });

  // Reset database state to standard values
  app.post("/api/enterprise/reset", (req, res) => {
    dbState.postgres.customers = [
      { id: "cust_1", name: "Alice Henderson", email: "alice@company.com", plan: "Enterprise Plus", balance: "$12,450.00", status: "Active" },
      { id: "cust_2", name: "Bob Jenkins", email: "bob@retailco.com", plan: "Pro", balance: "-$120.00 (Overdue)", status: "Suspended" },
      { id: "cust_3", name: "Carla Gomez", email: "carla@startup.io", plan: "Free Developer", balance: "$0.00", status: "Active" }
    ];
    dbState.postgres.orders = [
      { order_id: "ORD-9021", email: "alice@company.com", product: "Database Cloud Host", amount: "$3,500.00", status: "Delivered" },
      { order_id: "ORD-9022", email: "alice@company.com", product: "API Proxy Annual License", amount: "$8,950.00", status: "Processing" },
      { order_id: "ORD-8812", email: "bob@retailco.com", product: "Database Starter Tier", amount: "$120.00", status: "Pending Payment" }
    ];
    dbState.slack.channels = {
      "#cs-alerts": [
        { sender: "BillingBot", message: "Customer alert: bob@retailco.com subscription balance overdue ($120).", timestamp: "Today 8:15 AM" }
      ],
      "#ops-room": [
        { sender: "OpsBot", message: "Production kubernetes deployment code: v2.4.1 finished successfully.", timestamp: "Today 6:00 AM" }
      ],
      "#engineering": [
        { sender: "LeadArchitect", message: "Any updates on the scaling issues for company.com account?", timestamp: "Yesterday 4:30 PM" }
      ]
    };
    dbState.jira.tickets = [
      { id: "SUP-101", title: "RetailCo / Bob Jenkins account suspended query", description: "Bob Jenkins (bob@retailco.com) is complaining his account was suspended. Needs accounting log verification.", priority: "High", status: "Open", comments: [] },
      { id: "SUP-102", title: "Alice Henderson API Rate Limit increase", description: "Request to lift standard rate-limiting caps to 50k req/min for plan validation.", priority: "Normal", status: "In Progress", comments: [{ sender: "Support Agent", text: "Contacted ops to check readiness." }] }
    ];
    dbState.hubspot.contacts = [
      { email: "alice@company.com", phone: "+1-555-0192", lifecycle_stage: "SQL Customer", owner: "Sarah Miller", associated_deal: "Enterprise Renewal Plan - $12,000" },
      { email: "bob@retailco.com", phone: "+1-555-0143", lifecycle_stage: "Inactive/Suspended", owner: "Tom Harris", associated_deal: "Pro Annual RetailCo Deal - $120" },
      { email: "carla@startup.io", phone: "+1-555-0158", lifecycle_stage: "Prospect", owner: "Sarah Miller", associated_deal: "Startup Launch Offer - $1,200" }
    ];
    res.json({ success: true, message: "Database state reset successfully.", dbState });
  });

  // Orchestrate Agent Run
  app.post("/api/agent/run", async (req, res) => {
    const { agent, query, chatHistory = [] } = req.body;
    if (!agent) {
      return res.status(400).json({ success: false, error: "Missing agent configuration." });
    }
    const queryText = query || "";

    const traceSteps: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      payload?: any;
      timestamp: string;
    }> = [];

    const addTrace = (type: string, title: string, message: string, payload?: any) => {
      traceSteps.push({
        id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type,
        title,
        message,
        payload,
        timestamp: new Date().toLocaleTimeString()
      });
    };

    addTrace("agent_input", `${agent.name} Triggered`, `Received query: "${queryText}"`, { role: agent.role, connectedApps: agent.connectedApps });

    // 1. Collect connected tools declarations
    const activeToolsDeclarations: any[] = [];
    (agent.connectedApps || []).forEach((appId: string) => {
      const appTools = TOOLS_DEFINITIONS[appId];
      if (appTools) {
        activeToolsDeclarations.push(...appTools);
      }
    });

    const apiKey = process.env.GEMINI_API_KEY;

    // Check if the API key exists
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      // Graceful local simulation when GEMINI_API_KEY is not configured
      addTrace("system", "Warning: Working in Demo Simulation Mode", "GEMINI_API_KEY is not defined. Using the smart heuristic simulation engine.");
      addTrace("llm_start", "Compiling Agent Intelligence Prompt", "Structuring system constraints & wiring tools in memory.", {
        systemInstructions: agent.systemInstruction,
        temperature: agent.temperature,
        toolsLoaded: activeToolsDeclarations.map(t => t.name)
      });

      // Simple keywords and heuristics parsing to mock realistic tool execution sequence
      let responseText = "";
      const lowerQuery = queryText.toLowerCase();

      if (lowerQuery.includes("bob") || lowerQuery.includes("bob@retailco.com")) {
        // Run database queries
        if (agent.connectedApps.includes("postgres")) {
          addTrace("tool_call", "Postgres DB Tool Call", "Invoking search_customer_by_email for bob@retailco.com", { email: "bob@retailco.com" });
          const customerRes = executeToolLocal("search_customer_by_email", { email: "bob@retailco.com" });
          addTrace("tool_response", "Postgres Response Received", `Found profile: Bob Jenkins, Status: ${customerRes.customer?.status || "Unknown"}`, customerRes);

          if (lowerQuery.includes("active") || lowerQuery.includes("activate") || lowerQuery.includes("status")) {
            addTrace("tool_call", "Postgres DB Status Mutation", "Invoking update_customer_status for bob@retailco.com -> Active", { email: "bob@retailco.com", status: "Active" });
            const updateRes = executeToolLocal("update_customer_status", { email: "bob@retailco.com", status: "Active" });
            addTrace("tool_response", "Postgres Status Confirmed", "Successfully updated Bob Jenkins account to Active", updateRes);
          }
        }
        if (lowerQuery.includes("slack") && agent.connectedApps.includes("slack")) {
          const slackText = "Action completed: Reactivated customer Bob Jenkins (bob@retailco.com) and confirmed payment credentials.";
          addTrace("tool_call", "Slack API Tool Call", "Invoking slack_post_message targeting #cs-alerts", { channel: "#cs-alerts", text: slackText });
          const slackRes = executeToolLocal("slack_post_message", { channel: "#cs-alerts", text: slackText });
          addTrace("tool_response", "Slack Webhook Confirmed", "Message delivered safely to workspace channel #cs-alerts", slackRes);
        }
        if (lowerQuery.includes("ticket") && agent.connectedApps.includes("jira")) {
          addTrace("tool_call", "Jira API Tool Call", "Invoking create_ticket", { title: "Billing audit for RetailCo", description: "Verify Bob Jenkins invoice completion following automated account reactivation.", priority: "High" });
          const ticketRes = executeToolLocal("create_ticket", { title: "Billing audit for RetailCo", description: "Verify Bob Jenkins invoice completion following automated account reactivation.", priority: "High" });
          addTrace("tool_response", "Jira Notification Confirmed", "New issue SUP-103 created successfully with Open status", ticketRes);
        }

        responseText = `### 🤝 Agent Execution Action Report

Hello! I have executed the automated enterprise pipeline for **Bob Jenkins** (**bob@retailco.com**) based on your instructions:

1. **PostgreSQL Database Lookup**: Located bob@retailco.com on the **Pro Plan** which was previously **Suspended** with an overdue balance of -$120.00.
2. **Account Reactivation**: Executed \`update_customer_status\` and set his account status to **Active**.
3. **Workspace Slack Broadcast**: Dispatched a message to **#cs-alerts** alerting support teams that Bob Jenkins' account has been reactivated.
4. **Billing Ticket Created**: Generated High priority Jira ticketing item **SUP-103** to schedule an audit and verify final billing clearance.

Let me know if you would like me to conduct any additional CRM records update in Hubspot!`;
      } else if (lowerQuery.includes("alice") || lowerQuery.includes("alice@company.com")) {
        if (agent.connectedApps.includes("hubspot")) {
          addTrace("tool_call", "Hubspot CRM Tool Call", "Invoking hubspot_get_contact_by_email for alice@company.com", { email: "alice@company.com" });
          const hubspotRes = executeToolLocal("hubspot_get_contact_by_email", { email: "alice@company.com" });
          addTrace("tool_response", "Hubspot CRM Data Received", `Contact found: Sarah Miller owner, deal value: $12,000`, hubspotRes);
        }
        if (agent.connectedApps.includes("postgres")) {
          addTrace("tool_call", "Postgres DB Tool Call", "Invoking list_recent_orders for alice@company.com", { email: "alice@company.com" });
          const ordersRes = executeToolLocal("list_recent_orders", { email: "alice@company.com" });
          addTrace("tool_response", "Postgres Orders Fetched", `Found ${ordersRes.orders?.length} purchases`, ordersRes);
        }
        responseText = `### 📋 Agent CRM Audit Report

I have checked the records for **Alice Henderson** (**alice@company.com**):
- **Hubspot CRM**: She is marked as a **SQL Customer** managed by Sarah Miller. Her associated deal value is **$12,000** (Enterprise Renewal Plan).
- **Postgres Database**: She currently has **2 active orders** (ORD-9021 for Database Cloud Hosting and ORD-9022 for API Proxy Annual License). Her customer subscription profile is fully **Active** with a stellar balance of **$12,450.00**.

Let me know if you would like me to post an update regarding her plan to Slack!`;
      } else {
        // General text answer simulation
        addTrace("llm_start", "Gemini Generation", "Processing conversational output.");
        responseText = `Hello! I am ${agent.name}, acting as a ${agent.role}.

I am connected to tools for: **${agent.connectedApps.join(", ").toUpperCase() || "No Enterprise Apps"}**.

Since you asked a general query, I am standing ready to assist. You can ask me to:
- "Check customer bob@retailco.com, activate them and alert the support team over Slack"
- "Audit CRM data for alice@company.com and summarize her tickets"

**Instructions configured**: "${agent.systemInstruction}"
**Temperature**: ${agent.temperature}`;
      }

      addTrace("llm_end", `${agent.name} Output Formulated`, "Sent response back to orchestrator dashboard.");

      return res.json({
        success: true,
        responseText,
        traceSteps,
        simulated: true,
        dbState
      });
    }

    // IF GEMINI_API_KEY is configured
    try {
      addTrace("llm_start", "Initializing Client Connection", "Securing server-side Gemini orchestration session.", {
        model: "gemini-3.5-flash",
        temperature: agent.temperature
      });

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // Prepare system instructions adding detailed data and context
      const compositeSystemInstruction = `${agent.systemInstruction}
You are an Enterprise AI Agent operating in real time within an enterprise software stack.
Your Name is "${agent.name}" and your target role is "${agent.role}".
You have access to connected business systems. When a user asks you to read, find, search, update, create, or comment inside enterprise data, you MUST call the matching functions/tools immediately before answering.
Do not assume values; always use tool outputs.

At each step, look at the tool definitions and call them. Once you receive the response, analyze it and continue until you have fully solved the user request.`;

      // Build contents array for multi-turn execution (or include chat history)
      const contents: any[] = [];
      chatHistory.forEach((msg: any) => {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        });
      });

      // Add the current query
      contents.push({
         role: "user",
         parts: [{ text: queryText }]
      });

      // We'll run a loop to handle sequential tool calls (up to 4 turns of tool call-and-response)
      let turnLimit = 4;
      let finalText = "";
      let currentInputContents = [...contents];

      addTrace("llm_start", "Dispatched to Gemini Reasoning Engine", "Awaiting execution plan or tool call choices...", {
         instructionSummary: agent.systemInstruction.slice(0, 100),
         toolsRegistered: activeToolsDeclarations.map(t => t.name)
      });

      while (turnLimit > 0) {
        // Convert active tools declarations to Gemini JSON compatible schema
        const functionDeclarations = activeToolsDeclarations.map(t => ({
           name: t.name,
           description: t.description,
           parameters: t.parameters
        }));

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: currentInputContents,
          config: {
            systemInstruction: compositeSystemInstruction,
            temperature: agent.temperature,
            ...(functionDeclarations.length > 0 ? {
              tools: [{ functionDeclarations }]
            } : {})
          }
        });

        // 1. Check if Gemini decided to call a function
        const functionCalls = response.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
          const call = functionCalls[0];
          addTrace("tool_call", "Orchestrator Executing Function", `Agent triggered tool: ${call.name}`, { arguments: call.args });

          // Run the tool immediately on our mock server DB
          const toolResult = executeToolLocal(call.name, call.args);
          addTrace("tool_response", "Executed Tool Successfully", `Mock database evaluated ${call.name}`, { output: toolResult });

          // Append this turn to preserve context
          const modelTurnContent = response.candidates?.[0]?.content;
          if (modelTurnContent) {
            currentInputContents.push(modelTurnContent);
          } else {
             currentInputContents.push({
                role: "model",
                parts: [{ functionCall: call }]
             });
          }

          // Add the tool execution result
          currentInputContents.push({
            role: "user", // The SDK maps functionResponse roles under 'user' contents context
            parts: [{
              functionResponse: {
                name: call.name,
                response: { output: toolResult }
              }
            }]
          });

          turnLimit--;
        } else {
          // No function call, this is the final answer!
          finalText = response.text || "Execution finished with empty response.";
          addTrace("llm_end", "Gemini Generation Finished", "Completed user instructions successfully.");
          break;
        }
      }

      if (turnLimit === 0) {
        finalText = "Execution turn-limit exceeded on the server during tool coordination.";
        addTrace("error", "Turn Limit Exceeded", "Maximum recursive tool call limit reached.");
      }

      res.json({
        success: true,
        responseText: finalText,
        traceSteps,
        simulated: false,
        dbState
      });

    } catch (err: any) {
      console.error("Gemini API error:", err);
      addTrace("error", "AI Orchestration Failed", err.message || "An unexpected error occurred during execution.");
      res.json({
        success: false,
        error: err.message,
        traceSteps,
        dbState
      });
    }
  });

  // Serve static assets / build files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server launched on port ${PORT}`);
  });
}

startServer();
