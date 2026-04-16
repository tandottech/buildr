import { getDb } from "@/lib/db";
import { SubTask, OrchestrationEvent } from "@/lib/schema";
import { findBestAgent, updateAgentStatus, incrementAgentStats } from "./registry";
import { negotiate } from "./negotiator";
import { transfer, getTransaction, getBasescanTxUrl } from "@/lib/locus";
import { ORCHESTRATOR_AGENT_ID } from "@/lib/constants";

const URL_REGEX = /https?:\/\/[^\s,)}\]]+/gi;

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; buildr/1.0)",
        Accept: "text/html,application/xhtml+xml,text/plain",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    // Strip HTML tags, scripts, styles to get plain text
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    // Return first ~4000 chars to stay within token limits
    return text.slice(0, 4000);
  } catch {
    return "";
  }
}

async function resolveUrls(input: string): Promise<string> {
  const urls = input.match(URL_REGEX);
  if (!urls || urls.length === 0) return input;

  let enriched = input;
  for (const url of urls.slice(0, 3)) {
    const content = await fetchUrlContent(url);
    if (content.length > 100) {
      enriched += `\n\n--- Content from ${url} ---\n${content}`;
    }
  }
  return enriched;
}

export async function orchestrateTask(
  taskId: string,
  userInput: string,
  onEvent: (event: OrchestrationEvent) => void
) {
  const db = getDb();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    // Step 0: Fetch content from any URLs in the input
    const enrichedInput = await resolveUrls(userInput);

    // Step 1: Decompose task
    db.prepare("UPDATE tasks SET status = 'decomposing' WHERE id = ?").run(taskId);
    const subTasks = decomposeTask(enrichedInput);

    onEvent({
      type: "decomposition",
      timestamp: new Date().toISOString(),
      data: { sub_tasks: subTasks, count: subTasks.length },
    });

    db.prepare("UPDATE tasks SET status = 'hiring', sub_tasks = ? WHERE id = ?").run(
      JSON.stringify(subTasks),
      taskId
    );

    let totalCost = 0;
    const results: { agent_name: string; task: string; result: string }[] = [];

    // Step 2-6: For each sub-task, discover, negotiate, pay, execute
    for (const subTask of subTasks) {
      // Discover
      onEvent({
        type: "discovery",
        timestamp: new Date().toISOString(),
        data: { category: subTask.category, searching: true },
      });

      const agent = findBestAgent(subTask.category);
      if (!agent) {
        onEvent({
          type: "error",
          timestamp: new Date().toISOString(),
          data: { message: `No agent found for category: ${subTask.category}` },
        });
        continue;
      }

      subTask.assigned_agent_id = agent.id;
      subTask.assigned_agent_name = agent.name;
      subTask.status = "assigned";

      // Negotiate
      const negotiation = negotiate(agent.price_per_call);

      onEvent({
        type: "negotiation",
        timestamp: new Date().toISOString(),
        data: {
          agent_id: agent.id,
          agent_name: agent.name,
          category: subTask.category,
          asking_price: negotiation.asking_price,
          final_price: negotiation.final_price,
          savings_percent: negotiation.savings_percent,
          steps: negotiation.steps,
        },
      });

      // Pay via Locus
      updateAgentStatus(agent.id, "busy");
      const apiKey = process.env.LOCUS_API_KEY || "";
      const txResult = await transfer(
        apiKey,
        agent.locus_wallet_address,
        negotiation.final_price,
        `Payment for ${subTask.category} task #${taskId.slice(0, 8)}`
      );

      // Poll Locus for the on-chain tx_hash (confirmation typically takes 10-30s)
      let txHash: string | null = null;
      if (txResult.success) {
        for (let i = 0; i < 5; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          const txDetail = await getTransaction(apiKey, txResult.tx_id);
          if (txDetail?.tx_hash) {
            txHash = txDetail.tx_hash;
            break;
          }
        }
      }

      // Record transaction
      const txId = crypto.randomUUID();
      const txStatus = txResult.success ? "paid" : "failed";
      db.prepare(`
        INSERT INTO transactions (id, task_id, buyer_agent_id, seller_agent_id, amount, negotiated_from, negotiated_to, status, locus_tx_id, tx_hash, task_description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        txId, taskId, ORCHESTRATOR_AGENT_ID, agent.id,
        negotiation.final_price, negotiation.asking_price, negotiation.final_price,
        txStatus, txResult.tx_id, txHash, subTask.description
      );

      onEvent({
        type: "payment",
        timestamp: new Date().toISOString(),
        data: {
          agent_name: agent.name,
          amount: negotiation.final_price,
          tx_id: txResult.tx_id,
          locus_tx_id: txResult.tx_id,
          tx_hash: txHash,
          basescan_url: txHash ? getBasescanTxUrl(txHash) : null,
          locus_status: txResult.status,
          success: txResult.success,
        },
      });

      totalCost += negotiation.final_price;

      // Execute
      db.prepare("UPDATE tasks SET status = 'executing' WHERE id = ?").run(taskId);
      subTask.status = "executing";

      onEvent({
        type: "execution",
        timestamp: new Date().toISOString(),
        data: { agent_name: agent.name, status: "working", sub_task: subTask.description },
      });

      let agentResult = "";
      try {
        const execRes = await fetch(`${appUrl}${agent.endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: subTask.description }),
        });
        const execData = await execRes.json();
        agentResult = execData.result || "No result returned";
      } catch {
        agentResult = `[Demo] ${agent.name} processed: "${subTask.description.slice(0, 100)}"`;
      }

      subTask.result = agentResult;
      subTask.status = "completed";

      // Update transaction with result
      db.prepare("UPDATE transactions SET status = 'completed', result = ?, completed_at = datetime('now') WHERE id = ?").run(
        agentResult, txId
      );

      incrementAgentStats(agent.id, negotiation.final_price);
      updateAgentStatus(agent.id, "online");

      results.push({ agent_name: agent.name, task: subTask.description, result: agentResult });

      onEvent({
        type: "execution",
        timestamp: new Date().toISOString(),
        data: { agent_name: agent.name, status: "completed", result: agentResult },
      });
    }

    // Step 7: Assemble results
    db.prepare("UPDATE tasks SET status = 'assembling' WHERE id = ?").run(taskId);

    onEvent({
      type: "assembly",
      timestamp: new Date().toISOString(),
      data: { results_count: results.length },
    });

    const finalResult = results
      .map((r) => `**${r.agent_name}** (${r.task}):\n${r.result}`)
      .join("\n\n---\n\n");

    // Complete
    db.prepare(
      "UPDATE tasks SET status = 'completed', final_result = ?, total_cost = ?, completed_at = datetime('now'), sub_tasks = ? WHERE id = ?"
    ).run(finalResult, totalCost, JSON.stringify(subTasks), taskId);

    onEvent({
      type: "completion",
      timestamp: new Date().toISOString(),
      data: {
        total_cost: Math.round(totalCost * 10000) / 10000,
        agents_hired: results.length,
        final_result: finalResult,
      },
    });
  } catch (error) {
    db.prepare("UPDATE tasks SET status = 'failed' WHERE id = ?").run(taskId);
    onEvent({
      type: "error",
      timestamp: new Date().toISOString(),
      data: { message: error instanceof Error ? error.message : "Unknown error" },
    });
  }
}

function decomposeTask(userInput: string): SubTask[] {
  const input = userInput.toLowerCase();
  const subTasks: SubTask[] = [];

  if (input.includes("summar") || input.includes("condense") || input.includes("brief")) {
    subTasks.push({
      id: crypto.randomUUID(),
      description: `Summarize: ${userInput}`,
      category: "summarization",
      status: "pending",
    });
  }

  if (input.includes("translat") || input.includes("spanish") || input.includes("french") ||
      input.includes("japanese") || input.includes("chinese") || input.includes("german")) {
    const lang = input.includes("spanish") ? "Spanish" :
                 input.includes("french") ? "French" :
                 input.includes("japanese") ? "Japanese" :
                 input.includes("chinese") ? "Chinese" :
                 input.includes("german") ? "German" : "Spanish";
    subTasks.push({
      id: crypto.randomUUID(),
      description: `Translate to ${lang}: ${userInput}`,
      category: "translation",
      status: "pending",
    });
  }

  if (input.includes("review") || input.includes("code") || input.includes("bug") || input.includes("debug")) {
    subTasks.push({
      id: crypto.randomUUID(),
      description: `Review code: ${userInput}`,
      category: "code-review",
      status: "pending",
    });
  }

  if (input.includes("research") || input.includes("investigate") || input.includes("analyze") || input.includes("study")) {
    subTasks.push({
      id: crypto.randomUUID(),
      description: `Research: ${userInput}`,
      category: "research",
      status: "pending",
    });
  }

  if (input.includes("write") || input.includes("copy") || input.includes("blog") ||
      input.includes("market") || input.includes("content") || input.includes("email")) {
    subTasks.push({
      id: crypto.randomUUID(),
      description: `Create content: ${userInput}`,
      category: "content",
      status: "pending",
    });
  }

  if (input.includes("extract") || input.includes("scrape") || input.includes("parse") ||
      input.includes("csv") || input.includes("json") || input.includes("pdf")) {
    subTasks.push({
      id: crypto.randomUUID(),
      description: `Extract data: ${userInput}`,
      category: "data-extraction",
      status: "pending",
    });
  }

  if (input.includes("sentiment") || input.includes("opinion") || input.includes("mood") ||
      input.includes("feeling") || input.includes("positive") || input.includes("negative")) {
    subTasks.push({
      id: crypto.randomUUID(),
      description: `Analyze sentiment: ${userInput}`,
      category: "sentiment-analysis",
      status: "pending",
    });
  }

  if (input.includes("image") || input.includes("picture") || input.includes("illustration") ||
      input.includes("visual") || input.includes("generate image") || input.includes("draw") ||
      input.includes("design")) {
    subTasks.push({
      id: crypto.randomUUID(),
      description: `Generate image: ${userInput}`,
      category: "image-generation",
      status: "pending",
    });
  }

  if (input.includes("transcri") || input.includes("audio") || input.includes("speech") ||
      input.includes("voice") || input.includes("podcast") || input.includes("recording")) {
    subTasks.push({
      id: crypto.randomUUID(),
      description: `Transcribe audio: ${userInput}`,
      category: "audio-transcription",
      status: "pending",
    });
  }

  if (input.includes("legal") || input.includes("contract") || input.includes("compliance") ||
      input.includes("regulation") || input.includes("terms") || input.includes("privacy policy") ||
      input.includes("law")) {
    subTasks.push({
      id: crypto.randomUUID(),
      description: `Legal analysis: ${userInput}`,
      category: "legal",
      status: "pending",
    });
  }

  if (input.includes("financ") || input.includes("invest") || input.includes("stock") ||
      input.includes("budget") || input.includes("revenue") || input.includes("profit") ||
      input.includes("forecast")) {
    subTasks.push({
      id: crypto.randomUUID(),
      description: `Financial analysis: ${userInput}`,
      category: "finance",
      status: "pending",
    });
  }

  if (input.includes("seo") || input.includes("keyword") || input.includes("search engine") ||
      input.includes("ranking") || input.includes("backlink") || input.includes("meta tag")) {
    subTasks.push({
      id: crypto.randomUUID(),
      description: `SEO optimization: ${userInput}`,
      category: "seo",
      status: "pending",
    });
  }

  if (input.includes("qa") || input.includes("quality") || input.includes("regression") ||
      input.includes("automation test")) {
    subTasks.push({
      id: crypto.randomUUID(),
      description: `QA testing: ${userInput}`,
      category: "qa-testing",
      status: "pending",
    });
  }

  if (input.includes("chart") || input.includes("graph") || input.includes("dashboard") ||
      input.includes("visualiz") || input.includes("plot") || input.includes("diagram")) {
    subTasks.push({
      id: crypto.randomUUID(),
      description: `Visualize data: ${userInput}`,
      category: "data-visualization",
      status: "pending",
    });
  }

  if (input.includes("security") || input.includes("vulnerab") || input.includes("penetration") ||
      input.includes("threat") || input.includes("firewall") || input.includes("encrypt")) {
    subTasks.push({
      id: crypto.randomUUID(),
      description: `Security analysis: ${userInput}`,
      category: "cybersecurity",
      status: "pending",
    });
  }

  if (input.includes("support") || input.includes("customer") || input.includes("ticket") ||
      input.includes("help desk") || input.includes("faq") || input.includes("chatbot")) {
    subTasks.push({
      id: crypto.randomUUID(),
      description: `Customer support: ${userInput}`,
      category: "customer-support",
      status: "pending",
    });
  }

  if (input.includes("newsletter") || input.includes("drip") || input.includes("campaign") ||
      input.includes("autorespond") || input.includes("mail")) {
    subTasks.push({
      id: crypto.randomUUID(),
      description: `Email automation: ${userInput}`,
      category: "email-automation",
      status: "pending",
    });
  }

  // Default: if nothing matched, use summarization
  if (subTasks.length === 0) {
    subTasks.push({
      id: crypto.randomUUID(),
      description: `Process: ${userInput}`,
      category: "summarization",
      status: "pending",
    });
  }

  return subTasks;
}
