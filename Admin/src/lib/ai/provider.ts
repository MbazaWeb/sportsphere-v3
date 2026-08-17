/**
 * SportSphere AI Workforce — Provider Abstraction Layer
 *
 * Model-agnostic provider interface with concrete implementations for
 * OpenAI, Anthropic, and Google, all using raw fetch (no npm packages).
 * The ProviderRegistry resolves the correct provider based on model name.
 */

import type {
  ChatMessage,
  ProviderChatResult,
  ProviderEmbedResult,
  ToolCall,
} from './types';

// ═══════════════════════════════════════════════════════════════
// PROVIDER INTERFACE
// ═══════════════════════════════════════════════════════════════

export interface AIProviderInterface {
  readonly name: string;

  chat(
    messages: ChatMessage[],
    model: string,
    tools?: ProviderToolDef[],
    maxTokens?: number,
  ): Promise<ProviderChatResult>;

  embed(
    text: string,
    model: string,
  ): Promise<ProviderEmbedResult>;
}

export interface ProviderToolDef {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

// ═══════════════════════════════════════════════════════════════
// SHARED HELPERS
// ═══════════════════════════════════════════════════════════════

const REQUEST_TIMEOUT_MS = 120_000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ═══════════════════════════════════════════════════════════════
// OPENAI PROVIDER
// ═══════════════════════════════════════════════════════════════

export class OpenAIProvider implements AIProviderInterface {
  readonly name = 'openai';
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://api.openai.com/v1';
  }

  async chat(
    messages: ChatMessage[],
    model: string,
    tools?: ProviderToolDef[],
    maxTokens?: number,
  ): Promise<ProviderChatResult> {
    const start = Date.now();
    const body: Record<string, unknown> = {
      model,
      messages: messages.map(m => {
        const out: Record<string, unknown> = { role: m.role, content: m.content };
        if (m.toolCalls) out.tool_calls = m.toolCalls;
        if (m.toolCallId) out.tool_call_id = m.toolCallId;
        if (m.name) out.name = m.name;
        return out;
      }),
    };
    if (tools && tools.length > 0) body.tools = tools;
    if (maxTokens) body.max_tokens = maxTokens;

    const res = await fetchWithTimeout(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${err}`);
    }

    const json = await res.json() as Record<string, unknown>;
    const choice = (json.choices as Record<string, unknown>[])?.[0];
    const message = choice?.message as Record<string, unknown> | undefined;
    const usage = json.usage as Record<string, unknown> | undefined;

    const toolCalls = this.parseToolCalls(message?.tool_calls);
    const content = typeof message?.content === 'string' ? message.content : '';

    return {
      content,
      inputTokens: (usage?.prompt_tokens as number) || 0,
      outputTokens: (usage?.completion_tokens as number) || 0,
      model: (json.model as string) || model,
      latencyMs: Date.now() - start,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  }

  async embed(text: string, model: string): Promise<ProviderEmbedResult> {
    const start = Date.now();
    const res = await fetchWithTimeout(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model, input: text }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI embed error ${res.status}: ${err}`);
    }

    const json = await res.json() as Record<string, unknown>;
    const data = (json.data as Record<string, unknown>[])?.[0];
    const usage = json.usage as Record<string, unknown> | undefined;

    return {
      embedding: data?.embedding as number[] || [],
      inputTokens: (usage?.prompt_tokens as number) || 0,
      model: (json.model as string) || model,
      latencyMs: Date.now() - start,
    };
  }

  private parseToolCalls(raw: unknown): ToolCall[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((tc: Record<string, unknown>) => ({
        id: tc.id as string,
        name: (tc.function as Record<string, unknown>)?.name as string || '',
        arguments: (tc.function as Record<string, unknown>)?.arguments as string || '{}',
      }))
      .filter(tc => tc.name);
  }
}

// ═══════════════════════════════════════════════════════════════
// ANTHROPIC PROVIDER
// ═══════════════════════════════════════════════════════════════

export class AnthropicProvider implements AIProviderInterface {
  readonly name = 'anthropic';
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://api.anthropic.com/v1';
  }

  async chat(
    messages: ChatMessage[],
    model: string,
    tools?: ProviderToolDef[],
    maxTokens?: number,
  ): Promise<ProviderChatResult> {
    const start = Date.now();

    // Anthropic requires the system message separately
    const systemMessages: ChatMessage[] = [];
    const chatMessages: ChatMessage[] = [];
    for (const m of messages) {
      if (m.role === 'system') {
        systemMessages.push(m);
      } else {
        chatMessages.push(m);
      }
    }

    const body: Record<string, unknown> = {
      model,
      max_tokens: maxTokens || 4096,
      messages: chatMessages.map(m => {
        const out: Record<string, unknown> = { role: m.role, content: m.content };
        if (m.toolCalls && m.toolCalls.length > 0) {
          // Anthropic format: tool_use content blocks
          const blocks = m.toolCalls.map(tc => ({
            type: 'tool_use',
            id: tc.id,
            name: tc.name,
            input: JSON.parse(tc.arguments),
          }));
          out.content = blocks;
        }
        if (m.toolCallId && m.name) {
          out.content = [{
            type: 'tool_result',
            tool_use_id: m.toolCallId,
            content: m.content,
          }];
        }
        return out;
      }),
    };

    if (systemMessages.length > 0) {
      body.system = systemMessages.map(m => m.content).join('\n\n');
    }

    if (tools && tools.length > 0) {
      body.tools = tools.map(t => t.function);
    }

    const res = await fetchWithTimeout(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${err}`);
    }

    const json = await res.json() as Record<string, unknown>;
    const content = json.content as Record<string, unknown>[];
    const usage = json.usage as Record<string, unknown>;

    let textContent = '';
    const toolCalls: ToolCall[] = [];

    if (Array.isArray(content)) {
      for (const block of content) {
        if (block.type === 'text') {
          textContent += (block.text as string) || '';
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id as string,
            name: block.name as string,
            arguments: JSON.stringify(block.input || {}),
          });
        }
      }
    }

    return {
      content: textContent,
      inputTokens: (usage?.input_tokens as number) || 0,
      outputTokens: (usage?.output_tokens as number) || 0,
      model: (json.model as string) || model,
      latencyMs: Date.now() - start,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  }

  async embed(text: string, model: string): Promise<ProviderEmbedResult> {
    // Anthropic doesn't have a native embeddings API.
    // Use Voyage or fall back to OpenAI-compatible endpoint.
    const start = Date.now();
    throw new Error(
      `Anthropic does not provide an embeddings API. ` +
      `Cannot embed with model "${model}". Use OpenAI or a dedicated embedding provider.`
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// GOOGLE (GEMINI) PROVIDER
// ═══════════════════════════════════════════════════════════════

export class GoogleProvider implements AIProviderInterface {
  readonly name = 'google';
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  }

  async chat(
    messages: ChatMessage[],
    model: string,
    tools?: ProviderToolDef[],
    maxTokens?: number,
  ): Promise<ProviderChatResult> {
    const start = Date.now();

    // Separate system instruction
    const systemParts: Record<string, unknown>[] = [];
    const contents: Record<string, unknown>[] = [];

    for (const m of messages) {
      if (m.role === 'system') {
        systemParts.push({ text: m.content });
      } else if (m.role === 'tool') {
        // Gemini expects tool responses as functionResponse parts
        contents.push({
          role: 'function',
          parts: [{
            functionResponse: {
              name: m.name || '',
              response: { result: m.content },
            },
          }],
        });
      } else if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
        // Assistant message with tool calls
        const parts: Record<string, unknown>[] = [];
        if (m.content) parts.push({ text: m.content });
        for (const tc of m.toolCalls) {
          parts.push({
            functionCall: {
              name: tc.name,
              args: JSON.parse(tc.arguments),
            },
          });
        }
        contents.push({ role: 'model', parts });
      } else {
        contents.push({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        });
      }
    }

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens || 8192,
      },
    };

    if (systemParts.length > 0) {
      body.systemInstruction = { parts: systemParts };
    }

    if (tools && tools.length > 0) {
      body.tools = [{
        functionDeclarations: tools.map(t => t.function),
      }];
    }

    const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google API error ${res.status}: ${err}`);
    }

    const json = await res.json() as Record<string, unknown>;
    const candidate = ((json.candidates as Record<string, unknown>[]) || [])[0];
    const contentParts = candidate?.content as Record<string, unknown> | undefined;
    const parts = (contentParts?.parts as Record<string, unknown>[]) || [];
    const usageMeta = json.usageMetadata as Record<string, unknown> | undefined;

    let textContent = '';
    const toolCalls: ToolCall[] = [];

    for (const part of parts) {
      if (part.text) {
        textContent += part.text as string;
      } else if (part.functionCall) {
        const fc = part.functionCall as Record<string, unknown>;
        toolCalls.push({
          id: `call_${Math.random().toString(36).slice(2, 10)}`,
          name: fc.name as string,
          arguments: JSON.stringify(fc.args || {}),
        });
      }
    }

    return {
      content: textContent,
      inputTokens: (usageMeta?.promptTokenCount as number) || 0,
      outputTokens: (usageMeta?.candidatesTokenCount as number) || 0,
      model: (json.modelVersion as string) || model,
      latencyMs: Date.now() - start,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  }

  async embed(text: string, model: string): Promise<ProviderEmbedResult> {
    const start = Date.now();
    const url = `${this.baseUrl}/models/${model}:embedContent?key=${this.apiKey}`;

    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: `models/${model}`, content: { parts: [{ text }] } }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google embed error ${res.status}: ${err}`);
    }

    const json = await res.json() as Record<string, unknown>;
    const embedding = json.embedding as Record<string, unknown>;
    const values = (embedding?.values as number[]) || [];

    return {
      embedding: values,
      inputTokens: (json.usageMetadata as Record<string, unknown>)?.promptTokenCount as number || 0,
      model,
      latencyMs: Date.now() - start,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// PROVIDER REGISTRY
// ═══════════════════════════════════════════════════════════════

/**
 * Registry that holds all configured providers and returns
 * the correct one based on model name prefix.
 *
 * Usage:
 *   const registry = new ProviderRegistry();
 *   registry.register('openai', new OpenAIProvider(key));
 *   registry.register('anthropic', new AnthropicProvider(key));
 *   const provider = registry.getForModel('gpt-4o-mini');
 */
export class ProviderRegistry {
  private providers = new Map<string, AIProviderInterface>();

  /** Model prefix → provider name mappings */
  private static readonly MODEL_PREFIXES: Record<string, string[]> = {
    openai: ['gpt-3.5', 'gpt-4', 'gpt-4o', 'o1-', 'o3-', 'o4-', 'dall-e', 'text-embedding-ada', 'text-embedding-3'],
    anthropic: ['claude'],
    google: ['gemini', 'text-bison', 'chat-bison', 'embedding-gecko'],
  };

  register(name: string, provider: AIProviderInterface): void {
    this.providers.set(name, provider);
  }

  get(name: string): AIProviderInterface {
    const p = this.providers.get(name);
    if (!p) throw new Error(`Provider "${name}" is not registered`);
    return p;
  }

  /**
   * Resolve the provider for a given model ID based on name prefix.
   * Throws if no provider matches.
   */
  getForModel(modelId: string): AIProviderInterface {
    const lowerModel = modelId.toLowerCase();

    for (const [providerName, prefixes] of Object.entries(ProviderRegistry.MODEL_PREFIXES)) {
      for (const prefix of prefixes) {
        if (lowerModel.startsWith(prefix.toLowerCase())) {
          const provider = this.providers.get(providerName);
          if (provider) return provider;
        }
      }
    }

    // Fallback: if only one provider is registered, use it
    if (this.providers.size === 1) {
      return this.providers.values().next().value!;
    }

    throw new Error(
      `No provider registered for model "${modelId}". ` +
      `Available providers: ${[...this.providers.keys()].join(', ')}`
    );
  }

  /** Check if any provider is available */
  hasProvider(): boolean {
    return this.providers.size > 0;
  }

  /** List all registered provider names */
  listProviders(): string[] {
    return [...this.providers.keys()];
  }
}

// ═══════════════════════════════════════════════════════════════
// FACTORY — build from DB AIProvider records
// ═══════════════════════════════════════════════════════════════

interface DBProviderRecord {
  name: string;
  apiKey: string;
  baseUrl: string | null;
  isActive: boolean;
}

/**
 * Build a ProviderRegistry from an array of DB AIProvider records.
 * Only includes active providers with non-empty API keys.
 */
export function buildRegistryFromDB(providers: DBProviderRecord[]): ProviderRegistry {
  const registry = new ProviderRegistry();

  for (const p of providers) {
    if (!p.isActive || !p.apiKey) continue;

    const name = p.name.toLowerCase();
    let instance: AIProviderInterface | null = null;

    switch (name) {
      case 'openai':
        instance = new OpenAIProvider(p.apiKey, p.baseUrl || undefined);
        break;
      case 'anthropic':
        instance = new AnthropicProvider(p.apiKey, p.baseUrl || undefined);
        break;
      case 'google':
        instance = new GoogleProvider(p.apiKey, p.baseUrl || undefined);
        break;
      default:
        // Try to infer from base URL or name
        if (p.baseUrl?.includes('openai.com') || name.includes('openai')) {
          instance = new OpenAIProvider(p.apiKey, p.baseUrl || undefined);
        } else if (p.baseUrl?.includes('anthropic.com') || name.includes('anthropic')) {
          instance = new AnthropicProvider(p.apiKey, p.baseUrl || undefined);
        } else if (p.baseUrl?.includes('googleapis.com') || name.includes('google')) {
          instance = new GoogleProvider(p.apiKey, p.baseUrl || undefined);
        }
        break;
    }

    if (instance) {
      registry.register(name, instance);
    }
  }

  return registry;
}
