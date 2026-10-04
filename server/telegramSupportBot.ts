import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

// Support Bot Default Credentials & Official Username
export const SUPPORT_BOT_USERNAME = "tradexora_supportbot";
export const SUPPORT_BOT_LINK = "https://t.me/tradexora_supportbot";
export let SUPPORT_BOT_TOKEN = process.env.SUPPORT_BOT_TOKEN || "8946242059:AAE6woCZhidxTxb6z7DhTOnt--34qL3fDMA";
export let ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "8546421644";
export const TRADEXORA_URL = "https://tradexora.online";

export function updateSupportBotConfig(token?: string, adminChatId?: string) {
  if (token) SUPPORT_BOT_TOKEN = token;
  if (adminChatId) ADMIN_CHAT_ID = adminChatId;
}

export interface SupportTicket {
  ticket_id: string; // e.g. TX-100001
  telegram_user_id: string;
  telegram_username: string;
  telegram_sender_name: string;
  tradexora_user_id?: string;
  category: string; // DEPOSIT | WITHDRAWAL | LOGIN | ACCOUNT | PAYMENT_PROBLEM | TECHNICAL | FRAUD | GENERAL
  message: string;
  attachments?: Array<{
    type: 'photo' | 'document' | 'text';
    file_id?: string;
    caption?: string;
    ocrData?: {
      utr?: string;
      amount?: number;
      date?: string;
      receiverUPI?: string;
      status?: string;
      isDuplicate?: boolean;
    };
  }>;
  transaction_id?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'BOT_HANDLING' | 'WAITING_FOR_USER' | 'WAITING_FOR_ADMIN' | 'RESOLVED' | 'CLOSED';
  created_at: number;
  updated_at: number;
  assigned_admin?: string;
  resolution?: string;
  reason?: string;
  history: Array<{
    sender: 'user' | 'bot' | 'admin';
    message: string;
    timestamp: number;
    adminName?: string;
  }>;
}

export interface ConversationContext {
  chat_id: string;
  current_intent?: string;
  last_ticket_id?: string;
  tradexora_user_id?: string;
  pending_action?: string;
  last_messages: Array<{ role: 'user' | 'model'; text: string; timestamp: number }>;
}

// In-Memory Caches & Anti-Spam / Rate-Limiting Locks
const ticketsMemory = new Map<string, SupportTicket>();
const conversationContexts = new Map<string, ConversationContext>();
let ticketCounter = 100001;

// Overflow & Double-message protection
const processedUpdateIds = new Set<number>();
const recentUserMessages = new Map<string, { hash: string; timestamp: number }>();
const userInteractionLocks = new Map<string, number>();
const callbackDebounceMap = new Map<string, number>();

function isDuplicateUpdate(updateId?: number): boolean {
  if (!updateId) return false;
  if (processedUpdateIds.has(updateId)) return true;
  processedUpdateIds.add(updateId);
  // Cap memory size to prevent overflow
  if (processedUpdateIds.size > 5000) {
    const firstKey = processedUpdateIds.values().next().value;
    if (firstKey !== undefined) processedUpdateIds.delete(firstKey);
  }
  return false;
}

// Reference to Firestore instance passed from server.ts
let firestoreDbRef: any = null;
let getUserFn: ((email: string) => Promise<any>) | null = null;
let getUserTransactionsFn: ((userId: string, limit?: number, type?: string[]) => Promise<any[]>) | null = null;
let getTransactionFn: ((txId: string) => Promise<any>) | null = null;
let getAllTransactionsFn: (() => Promise<Record<string, any>>) | null = null;

export function initSupportBotDb(
  firestoreInstance: any,
  helpers: {
    getUser: (email: string) => Promise<any>;
    getUserTransactions: (userId: string, limit?: number, type?: string[]) => Promise<any[]>;
    getTransaction: (txId: string) => Promise<any>;
    getAllTransactions: () => Promise<Record<string, any>>;
  }
) {
  firestoreDbRef = firestoreInstance;
  getUserFn = helpers.getUser;
  getUserTransactionsFn = helpers.getUserTransactions;
  getTransactionFn = helpers.getTransaction;
  getAllTransactionsFn = helpers.getAllTransactions;
  loadTicketsFromStorage();
}

// Initialize Gemini Client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
}

// -----------------------------------------------------------------
// Storage Helpers (Firestore / Local JSON Fallback)
// -----------------------------------------------------------------
const TICKETS_FILE = path.join(process.cwd(), "support_tickets.json");

async function loadTicketsFromStorage() {
  if (fs.existsSync(TICKETS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(TICKETS_FILE, "utf-8"));
      if (data && Array.isArray(data.tickets)) {
        data.tickets.forEach((t: SupportTicket) => {
          ticketsMemory.set(t.ticket_id, t);
          const num = parseInt(t.ticket_id.replace("TX-", ""), 10);
          if (!isNaN(num) && num >= ticketCounter) {
            ticketCounter = num + 1;
          }
        });
      }
    } catch (e) {
      console.error("Failed to load tickets from local JSON:", e);
    }
  }
}

function persistTicketsToDisk() {
  try {
    const tickets = Array.from(ticketsMemory.values());
    fs.writeFileSync(TICKETS_FILE, JSON.stringify({ tickets }, null, 2));
  } catch (e) {
    console.error("Failed to persist tickets to disk:", e);
  }
}

export async function getTicketById(ticketId: string): Promise<SupportTicket | null> {
  const t = ticketsMemory.get(ticketId);
  if (t) return t;

  if (firestoreDbRef) {
    try {
      const { doc, getDoc } = await import("firebase/firestore");
      const docRef = doc(firestoreDbRef, "support_tickets", ticketId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const ticketData = snap.data() as SupportTicket;
        ticketsMemory.set(ticketId, ticketData);
        return ticketData;
      }
    } catch (e) {
      console.error("Firestore getTicket error:", e);
    }
  }
  return null;
}

export async function saveTicket(ticket: SupportTicket): Promise<void> {
  ticket.updated_at = Date.now();
  ticketsMemory.set(ticket.ticket_id, ticket);
  persistTicketsToDisk();

  if (firestoreDbRef) {
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const docRef = doc(firestoreDbRef, "support_tickets", ticket.ticket_id);
      await setDoc(docRef, ticket, { merge: true });
    } catch (e) {
      console.error("Firestore saveTicket error:", e);
    }
  }
}

export async function getAllTickets(): Promise<SupportTicket[]> {
  if (firestoreDbRef) {
    try {
      const { collection, getDocs } = await import("firebase/firestore");
      const colRef = collection(firestoreDbRef, "support_tickets");
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const list: SupportTicket[] = [];
        snap.forEach(docSnap => {
          const t = docSnap.data() as SupportTicket;
          list.push(t);
          ticketsMemory.set(t.ticket_id, t);
        });
        list.sort((a, b) => b.updated_at - a.updated_at);
        return list;
      }
    } catch (e) {
      console.error("Firestore getAllTickets error:", e);
    }
  }
  const list = Array.from(ticketsMemory.values());
  list.sort((a, b) => b.updated_at - a.updated_at);
  return list;
}

export async function generateTicketId(): Promise<string> {
  const currentNum = ticketCounter++;
  return `TX-${currentNum}`;
}

export function getConversationContext(chatId: string): ConversationContext {
  if (!conversationContexts.has(chatId)) {
    conversationContexts.set(chatId, {
      chat_id: chatId,
      last_messages: []
    });
  }
  return conversationContexts.get(chatId)!;
}

export function saveConversationContext(ctx: ConversationContext) {
  if (ctx.last_messages.length > 10) {
    ctx.last_messages = ctx.last_messages.slice(-10);
  }
  conversationContexts.set(ctx.chat_id, ctx);
}

// Helper to escape HTML characters for Telegram HTML formatting
export function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// -----------------------------------------------------------------
// Telegram Bot API Wrapper Methods
// -----------------------------------------------------------------
export async function sendSupportTelegramMessage(
  chatId: string | number,
  text: string,
  inlineKeyboard?: any
): Promise<boolean> {
  if (!SUPPORT_BOT_TOKEN) return false;
  const url = `https://api.telegram.org/bot${SUPPORT_BOT_TOKEN}/sendMessage`;
  const body: any = {
    chat_id: String(chatId),
    text: text,
    parse_mode: "HTML",
    disable_web_page_preview: false
  };
  if (inlineKeyboard) {
    body.reply_markup = { inline_keyboard: inlineKeyboard };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data: any = await res.json();
    if (data && data.ok) return true;

    // Retry without HTML formatting if entity parsing fails
    if (data && !data.ok && (data.description?.includes("entities") || data.description?.includes("parse"))) {
      console.warn("Retrying sendMessage without HTML parse mode...");
      delete body.parse_mode;
      body.text = text.replace(/<[^>]*>/g, "");
      const retry = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const retryData: any = await retry.json();
      return retryData && retryData.ok;
    }
    console.error("Support bot sendMessage failed:", data);
    return false;
  } catch (e) {
    console.error("Support bot sendMessage error:", e);
    return false;
  }
}

export async function sendSupportTelegramPhoto(
  chatId: string | number,
  photo: string,
  caption?: string,
  inlineKeyboard?: any
): Promise<boolean> {
  if (!SUPPORT_BOT_TOKEN) return false;
  const url = `https://api.telegram.org/bot${SUPPORT_BOT_TOKEN}/sendPhoto`;
  const body: any = {
    chat_id: String(chatId),
    photo: photo,
    caption: caption || "",
    parse_mode: "HTML"
  };
  if (inlineKeyboard) {
    body.reply_markup = { inline_keyboard: inlineKeyboard };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data: any = await res.json();
    if (data && data.ok) return true;

    return await sendSupportTelegramMessage(chatId, caption || "Photo", inlineKeyboard);
  } catch (e) {
    return await sendSupportTelegramMessage(chatId, caption || "Photo", inlineKeyboard);
  }
}

export async function answerSupportCallbackQuery(callbackQueryId: string, text?: string) {
  if (!SUPPORT_BOT_TOKEN) return;
  const url = `https://api.telegram.org/bot${SUPPORT_BOT_TOKEN}/answerCallbackQuery`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text: text || "" })
  }).catch(() => {});
}

export async function editSupportTelegramMessage(
  chatId: string | number,
  messageId: number,
  text: string,
  inlineKeyboard?: any
): Promise<boolean> {
  if (!SUPPORT_BOT_TOKEN) return false;
  const url = `https://api.telegram.org/bot${SUPPORT_BOT_TOKEN}/editMessageText`;
  const body: any = {
    chat_id: String(chatId),
    message_id: messageId,
    text: text,
    parse_mode: "HTML",
    disable_web_page_preview: true
  };
  if (inlineKeyboard) {
    body.reply_markup = { inline_keyboard: inlineKeyboard };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data: any = await res.json();
    if (data && data.ok) return true;
    return false;
  } catch (e) {
    return false;
  }
}

// Download image file buffer from Telegram
export async function downloadTelegramFile(fileId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  if (!SUPPORT_BOT_TOKEN) return null;
  try {
    const getFileUrl = `https://api.telegram.org/bot${SUPPORT_BOT_TOKEN}/getFile?file_id=${fileId}`;
    const res = await fetch(getFileUrl);
    const data: any = await res.json();
    if (!data || !data.ok || !data.result?.file_path) return null;

    const filePath = data.result.file_path;
    const downloadUrl = `https://api.telegram.org/file/bot${SUPPORT_BOT_TOKEN}/${filePath}`;
    const imgRes = await fetch(downloadUrl);
    const arrayBuffer = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let mimeType = "image/jpeg";
    if (filePath.endsWith(".png")) mimeType = "image/png";
    else if (filePath.endsWith(".webp")) mimeType = "image/webp";

    return { buffer, mimeType };
  } catch (e) {
    console.error("Failed to download Telegram file:", e);
    return null;
  }
}

// -----------------------------------------------------------------
// Standard Start Menu & Common Keyboards
// -----------------------------------------------------------------
export const START_MENU_KEYBOARD = [
  [
    { text: "💰 Deposit", callback_data: "sup_deposit" },
    { text: "💸 Withdrawal", callback_data: "sup_withdrawal" }
  ],
  [
    { text: "👤 Account", callback_data: "sup_account" },
    { text: "🔐 Login / OTP", callback_data: "sup_login" }
  ],
  [
    { text: "🎁 Bonus", callback_data: "sup_bonus" },
    { text: "📊 Game / Platform", callback_data: "sup_game" }
  ],
  [
    { text: "⚠️ Payment Problem", callback_data: "sup_payment_prob" },
    { text: "🧾 Transaction Status", callback_data: "sup_tx_status" }
  ],
  [
    { text: "💬 Talk to Support", callback_data: "sup_human" }
  ],
  [
    { text: "🌐 Open TradeXora", url: TRADEXORA_URL }
  ]
];

export function getBotWelcomeText(senderName: string): string {
  return (
    `👋 <b>Welcome to TradeXora Support</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Namaste <b>${escapeHtml(senderName)}</b>!\n` +
    `Aapko kis cheez mein help chahiye?\n\n` +
    `Neeche diye gaye buttons me se select karein ya direct apni problem yahan chat me bhej dijiye.`
  );
}

// -----------------------------------------------------------------
// Vision OCR Screenshot Analysis (Gemini 3.8 Flash)
// -----------------------------------------------------------------
export async function analyzeScreenshotWithGemini(
  imageBuffer: Buffer,
  mimeType: string
): Promise<{
  utr?: string;
  amount?: number;
  date?: string;
  receiverUPI?: string;
  status?: string;
  rawAnalysis?: string;
}> {
  const ai = getGeminiClient();
  if (!ai) {
    return { rawAnalysis: "Gemini API key not configured." };
  }

  try {
    const base64Data = imageBuffer.toString("base64");
    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Data
      }
    };
    const promptPart = {
      text:
        `Analyze this payment receipt screenshot carefully. Extract financial details in JSON format.\n` +
        `JSON format required:\n` +
        `{\n` +
        `  "utr": "12-digit UTR or Reference Number or Transaction ID string (null if not found)",\n` +
        `  "amount": number (extracted payment amount in INR without commas, null if not found),\n` +
        `  "date": "Extracted date string or null",\n` +
        `  "receiverUPI": "UPI ID or bank account paid to, or null",\n` +
        `  "status": "SUCCESS" | "PENDING" | "FAILED" | "UNKNOWN"\n` +
        `}\n` +
        `Return ONLY valid JSON.`
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts: [imagePart, promptPart] },
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonStr = response.text || "{}";
    const parsed = JSON.parse(jsonStr);

    // Clean extracted UTR
    let utr = parsed.utr ? String(parsed.utr).replace(/\D/g, "") : undefined;
    if (utr && utr.length !== 12 && utr.length >= 10) {
      // keep if at least valid reference string
    } else if (utr && utr.length < 10) {
      utr = undefined;
    }

    return {
      utr,
      amount: typeof parsed.amount === 'number' ? parsed.amount : undefined,
      date: parsed.date || undefined,
      receiverUPI: parsed.receiverUPI || undefined,
      status: parsed.status || 'UNKNOWN',
      rawAnalysis: response.text
    };
  } catch (e) {
    console.error("Error analyzing screenshot with Gemini Vision:", e);
    return { rawAnalysis: "Vision analysis failed." };
  }
}

// -----------------------------------------------------------------
// Check Duplicate UTR across system transactions
// -----------------------------------------------------------------
export async function checkDuplicateUTR(utr: string): Promise<{ isDuplicate: boolean; existingTx?: any }> {
  if (!utr || !getAllTransactionsFn) return { isDuplicate: false };
  try {
    const allTxs = await getAllTransactionsFn();
    for (const [id, tx] of Object.entries(allTxs)) {
      if (tx.utr && String(tx.utr).trim() === String(utr).trim()) {
        return { isDuplicate: true, existingTx: { id, ...tx } };
      }
    }
  } catch (e) {
    console.error("Error checking duplicate UTR:", e);
  }
  return { isDuplicate: false };
}

// -----------------------------------------------------------------
// Gemini Support AI Logic Layer & Intent Classification
// -----------------------------------------------------------------
export async function classifyAndRespondWithAI(
  userText: string,
  context: ConversationContext,
  linkedUser?: any,
  userTransactions?: any[]
): Promise<{
  intent: string;
  responseText: string;
  shouldEscalate: boolean;
  escalationReason?: string;
  category?: string;
}> {
  const ai = getGeminiClient();

  // Basic Account / Transaction Context
  let accountContextStr = "No TradeXora account linked yet.";
  if (linkedUser) {
    accountContextStr = 
      `Linked TradeXora User:\n` +
      `- Email: ${linkedUser.email}\n` +
      `- Name: ${linkedUser.name || "Trader"}\n` +
      `- Real Balance: ₹${linkedUser.balance || 0}\n` +
      `- Demo Balance: ₹${linkedUser.demoBalance || 0}\n` +
      `- Has Deposited: ${linkedUser.hasDeposited ? 'YES' : 'NO'}`;
  }

  let txContextStr = "No recent transactions found.";
  if (userTransactions && userTransactions.length > 0) {
    const topTxs = userTransactions.slice(0, 5).map(t => 
      `• [${t.type.toUpperCase()}] ID: ${t.id} | Amt: ₹${t.amount} | Status: ${t.status.toUpperCase()} | Date: ${t.date} ${t.utr ? '| UTR: ' + t.utr : ''}`
    );
    txContextStr = topTxs.join("\n");
  }

  const prompt = 
    `You are TradeXora's official, highly trained Customer Support Executive responding on Telegram.\n` +
    `Website: ${TRADEXORA_URL}\n\n` +
    `RULES & PERSONALITY:\n` +
    `1. Use natural, friendly, clear Hinglish (or Hindi/English based on user language).\n` +
    `2. Keep replies short, precise, and polite with clean emojis.\n` +
    `3. PLATFORM RULES: Withdrawals are strictly processed into Bank Account (IMPS/NEFT) only with 4% standard bank gateway processing fee. UPI withdrawals are not supported.\n` +
    `4. Deposits are via PhonePe/GPay/Paytm UPI QR with 12-digit UTR verification (credited in 2-5 min).\n` +
    `5. Do NOT give trading indicator advice or discuss off-topic random market strategies. Focus 100% on platform support (Deposits, Bank Withdrawals, Turnover, Accounts, Demo Refill, Security).\n` +
    `6. NEVER say "I am an AI language model" or "As an AI". Act like a trained support executive named TradeXora Support.\n` +
    `7. NEVER make fake promises or approve transactions without verified backend status.\n` +
    `8. Understand context from previous user messages. Do not ask for the same ID repeatedly.\n` +
    `9. If the issue is complex, uncertain, duplicate UTR, or user explicitly demands human agent, mark 'shouldEscalate': true.\n\n` +
    `USER ACCOUNT INFORMATION:\n` +
    `${accountContextStr}\n\n` +
    `RECENT USER TRANSACTIONS:\n` +
    `${txContextStr}\n\n` +
    `USER MESSAGE HISTORY:\n` +
    `${JSON.stringify(context.last_messages)}\n\n` +
    `CURRENT LATEST MESSAGE:\n"${userText}"\n\n` +
    `Produce a JSON response with fields:\n` +
    `{\n` +
    `  "intent": "DEPOSIT" | "DEPOSIT_PENDING" | "DEPOSIT_FAILED" | "WITHDRAWAL" | "WITHDRAWAL_PENDING" | "WITHDRAWAL_COMPLETED" | "WITHDRAWAL_FAILED" | "LOGIN" | "OTP" | "PASSWORD" | "ACCOUNT" | "BONUS" | "TRANSACTION" | "PAYMENT_PROBLEM" | "TECHNICAL_PROBLEM" | "FRAUD_REPORT" | "GENERAL_QUERY" | "HUMAN_SUPPORT",\n` +
    `  "responseText": "Short, clear, friendly Hinglish reply for the user",\n` +
    `  "shouldEscalate": boolean,\n` +
    `  "escalationReason": "Reason if human escalation is required, or null",\n` +
    `  "category": "DEPOSIT" | "WITHDRAWAL" | "ACCOUNT" | "PAYMENT_PROBLEM" | "TECHNICAL" | "GENERAL"\n` +
    `}`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const parsed = JSON.parse(response.text || "{}");
      return {
        intent: parsed.intent || 'GENERAL_QUERY',
        responseText: parsed.responseText || "Haan, main aapki problem check karta hoon. Apna User ID ya UTR share kar dijiye.",
        shouldEscalate: !!parsed.shouldEscalate,
        escalationReason: parsed.escalationReason || undefined,
        category: parsed.category || 'GENERAL'
      };
    } catch (e) {
      console.error("Gemini support AI classification error:", e);
    }
  }

  // Fallback Rule Engine if AI unavailable
  const lower = userText.toLowerCase();
  if (lower.includes("deposit") || lower.includes("balance") || lower.includes("utr")) {
    return {
      intent: "DEPOSIT",
      responseText: "Haan bhai, main deposit status check karta hoon. Apna 12-digit UTR number ya Payment Screenshot yahan bhej dijiye.",
      shouldEscalate: false,
      category: "DEPOSIT"
    };
  } else if (lower.includes("withdraw") || lower.includes("paisa") || lower.includes("bank")) {
    return {
      intent: "WITHDRAWAL",
      responseText: "Main aapka withdrawal status check kar raha hoon. Apna Withdrawal ID ya registered email share karein.",
      shouldEscalate: false,
      category: "WITHDRAWAL"
    };
  } else if (lower.includes("human") || lower.includes("agent") || lower.includes("support")) {
    return {
      intent: "HUMAN_SUPPORT",
      responseText: "Maine aapka request TradeXora Human Executive Desk ko forward kar diya hai. Agent jald hi yahan reply karenge.",
      shouldEscalate: true,
      escalationReason: "User requested human support",
      category: "GENERAL"
    };
  }

  return {
    intent: "GENERAL_QUERY",
    responseText: "TradeXora Support active hai. Aapka kis topic me help chahiye: Deposit, Withdrawal, ya Account?",
    shouldEscalate: false,
    category: "GENERAL"
  };
}

// -----------------------------------------------------------------
// Escalate Ticket to Telegram Admin & System Log
// -----------------------------------------------------------------
export async function createAndEscalateTicket(params: {
  telegramUserId: string;
  telegramUsername: string;
  telegramSenderName: string;
  tradexoraUserId?: string;
  category: string;
  message: string;
  reason: string;
  attachments?: any[];
  transactionId?: string;
  utr?: string;
  amount?: number;
}): Promise<SupportTicket> {
  const ticketId = await generateTicketId();
  const ticket: SupportTicket = {
    ticket_id: ticketId,
    telegram_user_id: params.telegramUserId,
    telegram_username: params.telegramUsername,
    telegram_sender_name: params.telegramSenderName,
    tradexora_user_id: params.tradexoraUserId,
    category: params.category || 'GENERAL',
    message: params.message,
    attachments: params.attachments || [],
    transaction_id: params.transactionId,
    priority: (params.amount && params.amount >= 5000) ? 'HIGH' : 'MEDIUM',
    status: 'WAITING_FOR_ADMIN',
    created_at: Date.now(),
    updated_at: Date.now(),
    reason: params.reason,
    history: [
      { sender: 'user', message: params.message, timestamp: Date.now() },
      { sender: 'bot', message: `Ticket ${ticketId} created and escalated to Support Team. Reason: ${params.reason}`, timestamp: Date.now() }
    ]
  };

  await saveTicket(ticket);

  // Send Alert Notification to Admin Telegram Chat ID
  const adminAlert = 
    `🚨 <b>HUMAN SUPPORT REQUIRED</b>\n\n` +
    `<b>Ticket:</b> <code>${ticketId}</code>\n\n` +
    `<b>User:</b>\n` +
    `• Telegram ID: <code>${params.telegramUserId}</code>\n` +
    `• Name: ${escapeHtml(params.telegramSenderName)} (${params.telegramUsername})\n` +
    `• TradeXora User ID: <code>${params.tradexoraUserId || "Not linked"}</code>\n\n` +
    `<b>Issue Category:</b> ${params.category}\n` +
    `<b>User Message:</b>\n<i>"${escapeHtml(params.message)}"</i>\n\n` +
    (params.utr ? `<b>UTR / Ref:</b> <code>${params.utr}</code>\n` : "") +
    (params.amount ? `<b>Amount:</b> ₹${params.amount}\n` : "") +
    `<b>Current Status:</b> Manual Review\n` +
    `<b>Reason:</b> ${escapeHtml(params.reason)}\n\n` +
    `💡 <i>Reply directly in Telegram:</i>\n` +
    `<code>/reply ${ticketId} &lt;your message&gt;</code>`;

  const adminKb = [
    [
      { text: `💬 Reply User`, callback_data: `adm_reply_${ticketId}` },
      { text: `✅ Resolve Ticket`, callback_data: `adm_resolve_${ticketId}` }
    ]
  ];

  await sendSupportTelegramMessage(ADMIN_CHAT_ID, adminAlert, adminKb);

  return ticket;
}

// -----------------------------------------------------------------
// Primary Telegram Update Handler (Webhook & Polling)
// -----------------------------------------------------------------
export async function handleTelegramSupportUpdate(update: any): Promise<void> {
  if (!update) return;

  // Deduplicate update IDs to prevent webhook retry and double polling storm
  if (update.update_id && isDuplicateUpdate(update.update_id)) {
    return;
  }

  // 1. Handle Inline Button Callbacks (With Over-tapping & Double-click Protection)
  if (update.callback_query) {
    const cb = update.callback_query;
    const cbChatId = String(cb.message?.chat?.id || cb.from?.id);
    const cbData = cb.data;
    const msgId = cb.message?.message_id;
    const fromUser = cb.from;
    const senderName = [fromUser?.first_name, fromUser?.last_name].filter(Boolean).join(" ") || "Trader";

    // Immediate callback acknowledgement to stop client spinner and suppress double tap
    await answerSupportCallbackQuery(cb.id).catch(() => {});

    // Debounce rapid repeated button clicks (<600ms)
    const debounceKey = `${cbChatId}:${cbData}`;
    const lastTap = callbackDebounceMap.get(debounceKey) || 0;
    if (Date.now() - lastTap < 600) {
      return;
    }
    callbackDebounceMap.set(debounceKey, Date.now());

    // Handle Admin Action Callbacks
    if (cbData.startsWith("adm_resolve_")) {
      const ticketId = cbData.replace("adm_resolve_", "");
      const ticket = await getTicketById(ticketId);
      if (ticket) {
        ticket.status = "RESOLVED";
        ticket.history.push({
          sender: "admin",
          message: "Ticket marked resolved by Admin via Telegram button.",
          timestamp: Date.now()
        });
        await saveTicket(ticket);

        await sendSupportTelegramMessage(
          ticket.telegram_user_id,
          `✅ <b>TradeXora Support Ticket ${ticketId} Resolved</b>\n\n` +
          `Aapki samasya resolve kar di gayi hai. Support team se judne ke liye dhanyawad! 🤝`,
          START_MENU_KEYBOARD
        );

        if (msgId) {
          await editSupportTelegramMessage(
            cbChatId,
            msgId,
            (cb.message?.text || "Ticket") + `\n\n✅ <b>RESOLVED BY ADMIN</b>`
          );
        }
      }
      return;
    }

    // Standard User Buttons
    if (cbData === "sup_deposit") {
      const text = 
        `💰 <b>TradeXora Deposit Support</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `• <b>Minimum Deposit:</b> ₹100\n` +
        `• <b>Instant UPI & QR Code:</b> Active 24/7\n\n` +
        `Agar aapne deposit kiya hai aur balance credited nahi hua, to apna <b>12-digit UTR</b> ya <b>Payment Screenshot</b> yahan chat me bhej dijiye. Bot automatically verify karega!`;
      
      const kb = [
        [{ text: "📸 Submit UTR / Screenshot", callback_data: "sup_human" }],
        [{ text: "🚀 Deposit Now on Web", url: `${TRADEXORA_URL}/deposit` }],
        [{ text: "« Back to Main Menu", callback_data: "sup_menu" }]
      ];
      await editSupportTelegramMessage(cbChatId, msgId, text, kb);
      await answerSupportCallbackQuery(cb.id, "Deposit Assistance");
    } else if (cbData === "sup_withdrawal") {
      const text = 
        `💸 <b>TradeXora Withdrawal Support</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `• <b>Minimum Withdrawal:</b> ₹200\n` +
        `• <b>Processing Time:</b> 15 - 30 minutes\n\n` +
        `Apna withdrawal status check karne ke liye apna <b>Registered Email</b> ya <b>User ID</b> yahan share karein.`;
      
      const kb = [
        [{ text: "👤 Check Account Details", callback_data: "sup_account" }],
        [{ text: "🚀 Open Withdrawal Page", url: `${TRADEXORA_URL}/withdraw` }],
        [{ text: "« Back to Main Menu", callback_data: "sup_menu" }]
      ];
      await editSupportTelegramMessage(cbChatId, msgId, text, kb);
      await answerSupportCallbackQuery(cb.id, "Withdrawal Assistance");
    } else if (cbData === "sup_account") {
      const text = 
        `👤 <b>TradeXora Account Lookup</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Kripya apna registered email address yahan chat me type karein.\n` +
        `Example: <code>trader@gmail.com</code>\n\n` +
        `Main aapka live wallet balance aur verification status check kar deta hoon.`;
      
      const kb = [
        [{ text: "« Back to Main Menu", callback_data: "sup_menu" }]
      ];
      await editSupportTelegramMessage(cbChatId, msgId, text, kb);
      await answerSupportCallbackQuery(cb.id, "Account Verification");
    } else if (cbData === "sup_login") {
      const text = 
        `🔐 <b>Login & Account Recovery</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Login me kya problem aa rahi hai? Select option:`;
      
      const kb = [
        [{ text: "🔑 Password Reset", callback_data: "sup_pass" }, { text: "📱 OTP Not Received", callback_data: "sup_otp" }],
        [{ text: "🚫 Account Locked", callback_data: "sup_locked" }, { text: "📵 Phone Change", callback_data: "sup_phone" }],
        [{ text: "💬 Talk to Support", callback_data: "sup_human" }],
        [{ text: "« Back to Main Menu", callback_data: "sup_menu" }]
      ];
      await editSupportTelegramMessage(cbChatId, msgId, text, kb);
      await answerSupportCallbackQuery(cb.id, "Login & Account Troubleshooting");
    } else if (cbData === "sup_bonus") {
      const text = 
        `🎁 <b>TradeXora Bonus & Promotions</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `• <b>100% First Deposit Bonus:</b> Deposit ₹1000, play with ₹2000!\n` +
        `• <b>Referral Rewards:</b> Lifetime trade commission.\n` +
        `• <b>VIP Rebates:</b> Weekly automated cashback.\n` +
        `• <b>Turnover Policy:</b> 100% unlocked liquidity with zero withdrawal traps.`;
      const kb = [
        [{ text: "🚀 Claim Bonus Now", url: `${TRADEXORA_URL}/deposit` }],
        [{ text: "« Back to Main Menu", callback_data: "sup_menu" }]
      ];
      await editSupportTelegramMessage(cbChatId, msgId, text, kb);
      await answerSupportCallbackQuery(cb.id, "Bonus Offers");
    } else if (cbData === "sup_game") {
      const text = 
        `📊 <b>TradeXora Platform & Trading Guide</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `• <b>1. Binary Trading:</b> 1m, 2m, 5m, 15m predictions with up to 91% fixed return on CALL (Up) or PUT (Down).\n` +
        `• <b>2. 20X Futures:</b> Trade Bitcoin, Ethereum, US Tech Titans (Nvidia, Apple, Tesla), and Commodities with 20X leverage.\n` +
        `• <b>3. Official TradingView Chart:</b> Direct institutional market data with zero delay.\n` +
        `• <b>4. Free ₹10,000 Demo:</b> Tap ↻ reload icon on web anytime for unlimited free practice.`;
      const kb = [
        [{ text: "📈 Trade on Web Now", url: TRADEXORA_URL }],
        [{ text: "« Back to Main Menu", callback_data: "sup_menu" }]
      ];
      await editSupportTelegramMessage(cbChatId, msgId, text, kb);
      await answerSupportCallbackQuery(cb.id, "Trading Guide");
    } else if (cbData === "sup_payment_prob") {
      const text = 
        `⚠️ <b>Payment & Settlement Assistance</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Agar aapke deposit ya withdrawal me koi problem aayi hai:\n\n` +
        `1️⃣ <b>Deposit Late / Pending:</b> Apna 12-digit UTR number ya bank receipt screenshot yahan chat me bhej dijiye. Automated OCR verify karke update kar dega.\n` +
        `2️⃣ <b>Withdrawal Processing:</b> Standard IMPS processing time 15-30 minutes hota hai.\n` +
        `3️⃣ <b>Bank Clearance:</b> Peak banking hours me UPI clearing me 5-10 minute lag sakte hain.\n\n` +
        `Aap niche button se action select kar sakte hain:`;
      const kb = [
        [{ text: "🧾 Check Transaction Status", callback_data: "sup_tx_status" }],
        [{ text: "📸 Submit UTR / Screenshot", callback_data: "sup_human" }],
        [{ text: "« Back to Main Menu", callback_data: "sup_menu" }]
      ];
      await editSupportTelegramMessage(cbChatId, msgId, text, kb);
      await answerSupportCallbackQuery(cb.id, "Payment Assistance");
    } else if (cbData === "sup_tx_status") {
      let statusReport = "";
      const ctx = getConversationContext(cbChatId);
      if (ctx.tradexora_user_id && getUserTransactionsFn) {
        const txs = await getUserTransactionsFn(ctx.tradexora_user_id, 4);
        if (txs && txs.length > 0) {
          statusReport = `<b>Aapke Recent Transactions:</b>\n\n` + txs.map(t => {
            const typeIcon = t.type === 'deposit' ? '📥' : '📤';
            const statusIcon = t.status === 'approved' ? '✅' : (t.status === 'rejected' ? '❌' : '⏳');
            return `${typeIcon} <b>${t.type?.toUpperCase()}:</b> ₹${t.amount} ${statusIcon} <i>(${t.status})</i>\nUTR: <code>${t.utr || t.id}</code>`;
          }).join("\n\n");
        } else {
          statusReport = `Aapke account (${ctx.tradexora_user_id}) par koi recent transactions nahi mile.`;
        }
      } else {
        statusReport = `Apna live transaction status check karne ke liye apna <b>Registered Email</b> ya <b>12-digit UTR</b> yahan chat me type karein.`;
      }
      const text = 
        `🧾 <b>Live Transaction Status Tracker</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `${statusReport}`;
      const kb = [
        [{ text: "📸 Submit New UTR", callback_data: "sup_human" }],
        [{ text: "« Back to Main Menu", callback_data: "sup_menu" }]
      ];
      await editSupportTelegramMessage(cbChatId, msgId, text, kb);
      await answerSupportCallbackQuery(cb.id, "Transaction Status");
    } else if (cbData === "sup_pass") {
      const text = 
        `🔑 <b>Password Reset Assistance</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `1. TradeXora website par Login screen open karein.\n` +
        `2. <b>"Forgot Password?"</b> par tap karein.\n` +
        `3. Apna registered email enter karke OTP verify karein.\n` +
        `4. Naya password set karein aur instant login karein!`;
      const kb = [
        [{ text: "🌐 Open Login Page", url: TRADEXORA_URL }],
        [{ text: "💬 Talk to Support", callback_data: "sup_human" }],
        [{ text: "« Back to Main Menu", callback_data: "sup_menu" }]
      ];
      await editSupportTelegramMessage(cbChatId, msgId, text, kb);
      await answerSupportCallbackQuery(cb.id, "Password Reset");
    } else if (cbData === "sup_otp") {
      const text = 
        `📱 <b>OTP Not Received Help</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `• <b>Email OTP:</b> Apna <b>Spam / Promotions</b> folder check karein.\n` +
        `• <b>Resend:</b> 30 seconds wait karke "Resend OTP" par tap karein.\n` +
        `• Agar abhi bhi OTP nahi mil raha, to apna registered email yahan chat me bhej dijiye, support executive instant verify kar dega.`;
      const kb = [
        [{ text: "💬 Talk to Support", callback_data: "sup_human" }],
        [{ text: "« Back to Main Menu", callback_data: "sup_menu" }]
      ];
      await editSupportTelegramMessage(cbChatId, msgId, text, kb);
      await answerSupportCallbackQuery(cb.id, "OTP Assistance");
    } else if (cbData === "sup_locked") {
      const text = 
        `🚫 <b>Account Unlock Assistance</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Security verification ki wajah se account review par hai.\n\n` +
        `Unlock karne ke liye apna <b>Registered Email</b> yahan chat me send karein. Senior Desk Officer turant account review karke access restore kar dega.`;
      const kb = [
        [{ text: "💬 Talk to Support", callback_data: "sup_human" }],
        [{ text: "« Back to Main Menu", callback_data: "sup_menu" }]
      ];
      await editSupportTelegramMessage(cbChatId, msgId, text, kb);
      await answerSupportCallbackQuery(cb.id, "Account Unlock");
    } else if (cbData === "sup_phone") {
      const text = 
        `📵 <b>Registered Mobile Number Change</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Phone number change karne ke liye:\n\n` +
        `1. Apna <b>Registered Email</b> yahan chat me type karein.\n` +
        `2. Naya mobile number mention karein.\n` +
        `3. Security confirmation ke baad support team database me update kar degi.`;
      const kb = [
        [{ text: "💬 Submit Request", callback_data: "sup_human" }],
        [{ text: "« Back to Main Menu", callback_data: "sup_menu" }]
      ];
      await editSupportTelegramMessage(cbChatId, msgId, text, kb);
      await answerSupportCallbackQuery(cb.id, "Phone Update");
    } else if (cbData === "sup_human") {
      const text = 
        `💬 <b>Connected to TradeXora Support Desk</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Namaste! TradeXora human executive team active hai.\n\n` +
        `Kripya apna UTR, registered email, ya screenshot yahan send kar dijiye. Support agent turant aapki problem resolve karega.`;
      const kb = [
        [{ text: "« Back to Main Menu", callback_data: "sup_menu" }]
      ];
      await editSupportTelegramMessage(cbChatId, msgId, text, kb);
      await answerSupportCallbackQuery(cb.id, "Live Support Active");
    } else if (cbData === "sup_menu") {
      const welcome = getBotWelcomeText(senderName);
      await editSupportTelegramMessage(cbChatId, msgId, welcome, START_MENU_KEYBOARD);
      await answerSupportCallbackQuery(cb.id, "Main Menu");
    }
    return;
  }

  // 2. Handle Text & Photo Messages
  if (update.message) {
    const msg = update.message;
    const senderChatId = String(msg.chat.id);
    const fromUser = msg.from;
    const senderName = [fromUser?.first_name, fromUser?.last_name].filter(Boolean).join(" ") || "Trader";
    const username = fromUser?.username ? `@${fromUser.username}` : "No username";
    const rawText = msg.text ? msg.text.trim() : "";
    const isAdmin = senderChatId === String(ADMIN_CHAT_ID);

    const context = getConversationContext(senderChatId);

    // -------------------------------------------------------------
    // ADMIN COMMANDS (Executed by Admin in Telegram)
    // -------------------------------------------------------------
    if (isAdmin) {
      // Direct Reply via Native Reply to forwarded ticket
      if (msg.reply_to_message) {
        const repliedText = msg.reply_to_message.text || msg.reply_to_message.caption || "";
        const ticketMatch = repliedText.match(/Ticket:\s*(TX-\d+)/i) || repliedText.match(/(TX-\d+)/i);
        const tgIdMatch = repliedText.match(/Telegram ID:\s*<code>?(\d+)<\/code>?/i) || repliedText.match(/(\d{8,12})/);

        let targetTgId: string | null = null;
        let ticketObj: SupportTicket | null = null;

        if (ticketMatch && ticketMatch[1]) {
          ticketObj = await getTicketById(ticketMatch[1]);
          if (ticketObj) targetTgId = ticketObj.telegram_user_id;
        }
        if (!targetTgId && tgIdMatch && tgIdMatch[1]) {
          targetTgId = tgIdMatch[1];
        }

        if (targetTgId && rawText) {
          const userNotice = 
            `🛎️ <b>TradeXora Official Support Response</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `${escapeHtml(rawText)}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `<i>Aap aur kuch poochna chahte hain to yahan sidhe reply kar sakte hain.</i>`;

          const sent = await sendSupportTelegramMessage(targetTgId, userNotice, START_MENU_KEYBOARD);

          if (ticketObj) {
            ticketObj.status = "WAITING_FOR_USER";
            ticketObj.history.push({
              sender: "admin",
              message: rawText,
              timestamp: Date.now(),
              adminName: senderName
            });
            await saveTicket(ticketObj);
          }

          if (sent !== false) {
            await sendSupportTelegramMessage(ADMIN_CHAT_ID, `✅ <b>Reply sent to trader <code>${targetTgId}</code>!</b>`);
          } else {
            await sendSupportTelegramMessage(ADMIN_CHAT_ID, `❌ <b>Failed to deliver to <code>${targetTgId}</code>. User may have blocked bot.</b>`);
          }
          return;
        }
      }

      // /reply <TicketID_or_TelegramID> <message>
      if (rawText.startsWith("/reply ")) {
        const parts = rawText.split(" ");
        const targetId = parts[1];
        const replyMsg = parts.slice(2).join(" ").trim();

        if (!targetId || !replyMsg) {
          await sendSupportTelegramMessage(ADMIN_CHAT_ID, "⚠️ <b>Usage:</b> <code>/reply TX-100001 &lt;message&gt;</code> or <code>/reply &lt;telegram_id&gt; &lt;message&gt;</code>");
          return;
        }

        let targetTgId = targetId;
        let ticketObj: SupportTicket | null = null;

        if (targetId.startsWith("TX-")) {
          ticketObj = await getTicketById(targetId);
          if (ticketObj) targetTgId = ticketObj.telegram_user_id;
        }

        const userNotice = 
          `🛎️ <b>TradeXora Official Support Response</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `${escapeHtml(replyMsg)}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `<i>Aap aur kuch poochna chahte hain to yahan sidhe reply kar sakte hain.</i>`;

        const sent = await sendSupportTelegramMessage(targetTgId, userNotice, START_MENU_KEYBOARD);

        if (ticketObj) {
          ticketObj.status = "WAITING_FOR_USER";
          ticketObj.history.push({
            sender: "admin",
            message: replyMsg,
            timestamp: Date.now(),
            adminName: senderName
          });
          await saveTicket(ticketObj);
        }

        if (sent !== false) {
          await sendSupportTelegramMessage(ADMIN_CHAT_ID, `✅ <b>Reply sent to ticket <code>${targetId}</code>!</b>`);
        } else {
          await sendSupportTelegramMessage(ADMIN_CHAT_ID, `❌ <b>Failed to deliver message to <code>${targetId}</code>.</b>`);
        }
        return;
      }

      // /resolve <TicketID>
      if (rawText.startsWith("/resolve ")) {
        const ticketId = rawText.split(" ")[1];
        if (ticketId) {
          const ticket = await getTicketById(ticketId);
          if (ticket) {
            ticket.status = "RESOLVED";
            ticket.history.push({
              sender: "admin",
              message: "Ticket resolved by Admin command.",
              timestamp: Date.now()
            });
            await saveTicket(ticket);
            await sendSupportTelegramMessage(ticket.telegram_user_id, `✅ <b>Ticket ${ticketId} has been resolved by Support Admin!</b>`, START_MENU_KEYBOARD);
            await sendSupportTelegramMessage(ADMIN_CHAT_ID, `✅ Ticket <code>${ticketId}</code> marked RESOLVED.`);
            return;
          }
        }
      }
    }

    // -------------------------------------------------------------
    // TRADER COMMANDS & MESSAGES
    // -------------------------------------------------------------

    // Anti-spam, rapid message burst, and duplicate message suppression for traders
    if (!isAdmin && rawText) {
      const msgHash = rawText.toLowerCase().replace(/\s+/g, " ");
      const lastMsg = recentUserMessages.get(senderChatId);
      const now = Date.now();
      
      // If exact same text is sent within 3 seconds, ignore duplicate
      if (lastMsg && lastMsg.hash === msgHash && (now - lastMsg.timestamp < 3000)) {
        return;
      }
      
      // If user sends messages faster than 450ms, debounce burst
      const lastInteraction = userInteractionLocks.get(senderChatId) || 0;
      if (now - lastInteraction < 450) {
        return;
      }

      recentUserMessages.set(senderChatId, { hash: msgHash, timestamp: now });
      userInteractionLocks.set(senderChatId, now);
      
      // Cap size to prevent memory leaks
      if (recentUserMessages.size > 2000) {
        const firstKey = recentUserMessages.keys().next().value;
        if (firstKey) recentUserMessages.delete(firstKey);
      }
    }

    // Commands: /start, /help, /menu
    if (/^\/(start|help|menu|hi|hello)/i.test(rawText)) {
      const welcome = getBotWelcomeText(senderName);
      await sendSupportTelegramMessage(senderChatId, welcome, START_MENU_KEYBOARD);
      return;
    }

    // Direct command: /support, /agent, /human
    if (/^\/(support|human|agent)/i.test(rawText)) {
      const humanText = 
        `💬 <b>TradeXora Live Executive Support Desk</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Namaste! TradeXora human support desk active hai.\n\n` +
        `Kripya apna UTR, registered email, ya problem screenshot yahan bhej dijiye. Agent turant reply karega! 🤝`;
      await sendSupportTelegramMessage(senderChatId, humanText, START_MENU_KEYBOARD);
      return;
    }

    // Direct command: /status, /balance, /history
    if (/^\/(status|balance|tx|transaction|history)/i.test(rawText)) {
      let statusReport = "";
      if (context.tradexora_user_id && getUserFn) {
        const u = await getUserFn(context.tradexora_user_id);
        if (u) {
          const realBal = u.realBalance || 0;
          const demoBal = u.demoBalance || 10000;
          statusReport += `💰 <b>Wallet Balance:</b>\n• Real: ₹${realBal}\n• Demo: ₹${demoBal}\n\n`;
        }
      }
      if (context.tradexora_user_id && getUserTransactionsFn) {
        const txs = await getUserTransactionsFn(context.tradexora_user_id, 3);
        if (txs && txs.length > 0) {
          statusReport += `<b>Recent Transactions:</b>\n` + txs.map(t => {
            const typeIcon = t.type === 'deposit' ? '📥' : '📤';
            const statusIcon = t.status === 'approved' ? '✅' : (t.status === 'rejected' ? '❌' : '⏳');
            return `${typeIcon} ${t.type?.toUpperCase()}: ₹${t.amount} ${statusIcon} (UTR: <code>${t.utr || t.id}</code>)`;
          }).join("\n");
        }
      }
      if (!statusReport) {
        statusReport = `Apna live wallet balance aur transaction status check karne ke liye apna <b>Registered Email Address</b> yahan chat me type karein.`;
      }
      await sendSupportTelegramMessage(senderChatId, `📊 <b>Account & Status Tracker</b>\n━━━━━━━━━━━━━━━━━━━━━━━━\n${statusReport}`, START_MENU_KEYBOARD);
      return;
    }

    // Direct command: /deposit
    if (/^\/(deposit|dep)/i.test(rawText)) {
      const depText = 
        `💰 <b>TradeXora Instant Deposit Guide</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `• <b>Minimum Deposit:</b> ₹100\n` +
        `• <b>Payment Methods:</b> Google Pay, PhonePe, Paytm, BHIM, UPI QR\n` +
        `• <b>Automated Verification:</b> Deposit karne ke baad apna 12-digit UTR number ya screenshot yahan chat me bhej dijiye!`;
      await sendSupportTelegramMessage(senderChatId, depText, [
        [{ text: "🚀 Open Web Deposit", url: `${TRADEXORA_URL}/deposit` }],
        [{ text: "« Back to Menu", callback_data: "sup_menu" }]
      ]);
      return;
    }

    // Direct command: /withdraw
    if (/^\/(withdraw|payout)/i.test(rawText)) {
      const withText = 
        `💸 <b>TradeXora Bank Withdrawal Guide</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `• <b>Minimum Withdrawal:</b> ₹200 (100% unlocked balance)\n` +
        `• <b>Speed:</b> 15 to 30 minutes direct bank IMPS\n` +
        `• <b>Zero Turnover Traps:</b> Aapka poora available balance instant payout ke liye eligible hai.`;
      await sendSupportTelegramMessage(senderChatId, withText, [
        [{ text: "🚀 Open Web Withdrawal", url: `${TRADEXORA_URL}/withdraw` }],
        [{ text: "« Back to Menu", callback_data: "sup_menu" }]
      ]);
      return;
    }

    // Check if message is a 12-digit UTR
    const isUtrOnly = /^\d{12}$/.test(rawText);

    // Look up linked user account if email is provided or saved in context
    let linkedUser: any = null;
    let userTxs: any[] = [];

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawText);
    if (isEmail) {
      context.tradexora_user_id = rawText.toLowerCase().trim();
      saveConversationContext(context);
    }

    if (context.tradexora_user_id && getUserFn) {
      linkedUser = await getUserFn(context.tradexora_user_id);
      if (linkedUser && getUserTransactionsFn) {
        userTxs = await getUserTransactionsFn(context.tradexora_user_id, 10);
      }
    }

    // If message is a raw 12-digit UTR
    if (isUtrOnly) {
      const utr = rawText;
      const dupCheck = await checkDuplicateUTR(utr);

      if (dupCheck.isDuplicate) {
        const dupReply = 
          `⚠️ <b>Transaction Reference Already Submitted</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Ye transaction reference (UTR: <code>${utr}</code>) pehle hi system mein submit ho chuka hai.\n\n` +
          `Main ise further verification ke liye support team ko forward kar raha hoon. Kripya 10-15 minute wait karein.`;

        await sendSupportTelegramMessage(senderChatId, dupReply, START_MENU_KEYBOARD);

        await createAndEscalateTicket({
          telegramUserId: senderChatId,
          telegramUsername: username,
          telegramSenderName: senderName,
          tradexoraUserId: context.tradexora_user_id,
          category: 'FRAUD_REPORT',
          message: `User submitted duplicate UTR: ${utr}`,
          reason: 'Duplicate UTR submitted by user.',
          utr
        });
        return;
      }

      // Check if UTR matches any pending transaction of linked user
      let matchedTx = userTxs.find(t => t.utr === utr || t.id === utr);
      if (matchedTx) {
        if (matchedTx.status === 'approved') {
          await sendSupportTelegramMessage(
            senderChatId,
            `✅ <b>Deposit Approved & Credited!</b>\n\n` +
            `Aapka deposit (UTR: <code>${utr}</code>, Amount: ₹${matchedTx.amount}) successfully verify ho chuka hai aur balance wallet me update ho gaya hai!`,
            [[{ text: "🚀 Trade Now", url: TRADEXORA_URL }]]
          );
          return;
        } else if (matchedTx.status === 'pending') {
          await sendSupportTelegramMessage(
            senderChatId,
            `⏳ <b>Deposit Under Verification</b>\n\n` +
            `Aapka deposit (UTR: <code>${utr}</code>, Amount: ₹${matchedTx.amount}) abhi verification mein hai. Main status check kar raha hoon.\n\n` +
            `Jise hi bank server se clearance milega, balance instantly add ho jayega.`,
            START_MENU_KEYBOARD
          );
          return;
        }
      }

      // If UTR is new / unverified in automated DB
      const utrPendingReply = 
        `📥 <b>UTR Reference Received: <code>${utr}</code></b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Aapka UTR number system mein log ho gaya hai. Support executive bank statement se match karke balance wallet mein credit kar dega.`;

      await sendSupportTelegramMessage(senderChatId, utrPendingReply, START_MENU_KEYBOARD);

      await createAndEscalateTicket({
        telegramUserId: senderChatId,
        telegramUsername: username,
        telegramSenderName: senderName,
        tradexoraUserId: context.tradexora_user_id,
        category: 'DEPOSIT',
        message: `User submitted UTR: ${utr}`,
        reason: 'New UTR submitted for verification.',
        utr
      });
      return;
    }

    // -------------------------------------------------------------
    // HANDLE PHOTO / SCREENSHOT MESSAGES
    // -------------------------------------------------------------
    if (msg.photo && msg.photo.length > 0) {
      const largestPhoto = msg.photo[msg.photo.length - 1];
      const fileId = largestPhoto.file_id;
      const userCaption = msg.caption ? escapeHtml(msg.caption) : "Payment / Issue Screenshot";

      await sendSupportTelegramMessage(
        senderChatId,
        `📸 <b>Payment Proof Received!</b>\n\n` +
        `Aapka screenshot hamara OCR & AI engine verify kar raha hai. Support executive iski jaanch karke status update karega.`,
        START_MENU_KEYBOARD
      );

      // Download file and run Vision OCR
      const downloaded = await downloadTelegramFile(fileId);
      let ocrData: any = {};

      if (downloaded) {
        ocrData = await analyzeScreenshotWithGemini(downloaded.buffer, downloaded.mimeType);
      }

      let isDuplicate = false;
      if (ocrData.utr) {
        const dupCheck = await checkDuplicateUTR(ocrData.utr);
        if (dupCheck.isDuplicate) {
          isDuplicate = true;
          ocrData.isDuplicate = true;
        }
      }

      // Forward alert to Admin Telegram
      const adminCaption = 
        `📸 <b>NEW SUPPORT SCREENSHOT</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 <b>User:</b> ${escapeHtml(senderName)} (${username})\n` +
        `🆔 <b>Telegram ID:</b> <code>${senderChatId}</code>\n` +
        `📧 <b>TradeXora ID:</b> <code>${context.tradexora_user_id || "Not linked"}</code>\n` +
        (ocrData.utr ? `🔢 <b>Extracted UTR:</b> <code>${ocrData.utr}</code> ${isDuplicate ? "⚠️ DUPLICATE DETECTED!" : "✅"}\n` : "") +
        (ocrData.amount ? `💰 <b>Extracted Amount:</b> ₹${ocrData.amount}\n` : "") +
        `📝 <b>Caption:</b> ${userCaption}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💡 <i>To reply, send:</i>\n` +
        `<code>/reply ${senderChatId} &lt;response&gt;</code>`;

      await sendSupportTelegramPhoto(ADMIN_CHAT_ID, fileId, adminCaption);

      await createAndEscalateTicket({
        telegramUserId: senderChatId,
        telegramUsername: username,
        telegramSenderName: senderName,
        tradexoraUserId: context.tradexora_user_id,
        category: isDuplicate ? 'FRAUD_REPORT' : 'DEPOSIT',
        message: `Screenshot received. ${userCaption}. Extracted UTR: ${ocrData.utr || 'N/A'}, Amount: ₹${ocrData.amount || 'N/A'}`,
        reason: isDuplicate ? 'DUPLICATE UTR SCREENSHOT DETECTED' : 'Payment screenshot submitted for manual review.',
        attachments: [{ type: 'photo', file_id: fileId, caption: userCaption, ocrData }],
        utr: ocrData.utr,
        amount: ocrData.amount
      });
      return;
    }

    // -------------------------------------------------------------
    // HANDLE STANDARD TEXT MESSAGES VIA GEMINI AI ENGINE
    // -------------------------------------------------------------
    if (rawText) {
      context.last_messages.push({ role: 'user', text: rawText, timestamp: Date.now() });

      const aiResult = await classifyAndRespondWithAI(rawText, context, linkedUser, userTxs);

      context.last_messages.push({ role: 'model', text: aiResult.responseText, timestamp: Date.now() });
      context.current_intent = aiResult.intent;
      saveConversationContext(context);

      // Send AI Response to User
      await sendSupportTelegramMessage(senderChatId, aiResult.responseText, START_MENU_KEYBOARD);

      // Check if ticket escalation is required
      if (aiResult.shouldEscalate || aiResult.intent === 'HUMAN_SUPPORT' || aiResult.intent === 'PAYMENT_PROBLEM' || aiResult.intent === 'FRAUD_REPORT') {
        await createAndEscalateTicket({
          telegramUserId: senderChatId,
          telegramUsername: username,
          telegramSenderName: senderName,
          tradexoraUserId: context.tradexora_user_id,
          category: aiResult.category || 'GENERAL',
          message: rawText,
          reason: aiResult.escalationReason || `Intent classified as ${aiResult.intent}`
        });
      }
    }
  }
}

// -----------------------------------------------------------------
// Long-Polling Fallback Worker for Local Dev & Server Background
// -----------------------------------------------------------------
let isPollingActive = false;
let lastUpdateId = 0;

export function startTelegramSupportPolling() {
  if (isPollingActive) return;
  isPollingActive = true;
  console.log("Started 24/7 Telegram Support Bot Long-Polling Worker (Token:", SUPPORT_BOT_TOKEN.slice(0, 10) + "...)");

  const poll = async () => {
    if (!SUPPORT_BOT_TOKEN) return;
    try {
      const url = `https://api.telegram.org/bot${SUPPORT_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=15`;
      const res = await fetch(url);
      const data: any = await res.json();

      if (data && data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastUpdateId = Math.max(lastUpdateId, update.update_id);
          try {
            await handleTelegramSupportUpdate(update);
          } catch (err) {
            console.error("Error handling Telegram update:", err);
          }
        }
      } else if (data && !data.ok && data.error_code === 409) {
        // Conflict with active webhook -> delete webhook and switch back to polling
        console.warn("Telegram bot conflict detected (webhook active). Deleting webhook for polling mode...");
        await fetch(`https://api.telegram.org/bot${SUPPORT_BOT_TOKEN}/deleteWebhook`).catch(() => {});
      }
    } catch (e: any) {
      // Ignore network timeouts
    } finally {
      if (isPollingActive) {
        setTimeout(poll, 1500);
      }
    }
  };

  poll();
}

export function stopTelegramSupportPolling() {
  isPollingActive = false;
}
