import fetch from 'node-fetch';
import { SYSTEM_PROMPT } from './groqService.js';
import { orderToolDefinition, getOrderDetails } from '../tools/orderTool.js';
import { executeLocalFallbackTurn } from './groqService.js';
import { config, isGroqConfigured } from '../config/index.js';

/**
 * Interface for AI providers
 */
export class AiProvider {
  async processTurn({ messages }) {
    throw new Error('processTurn must be implemented by subclass');
  }
}

/**
 * Groq Cloud LPU Provider
 */
export class GroqProvider extends AiProvider {
  constructor({ apiKey, model, timeoutMs } = {}) {
    super();
    this.apiKey = apiKey || config.groq.apiKey;
    this.model = model || config.groq.model;
    this.timeoutMs = timeoutMs || config.groq.timeoutMs;
  }

  async processTurn({ messages }) {
    if (!this.apiKey || this.apiKey === 'gsk_your_groq_api_key_placeholder') {
      console.warn('Groq key not configured, routing to deterministic provider');
      return new DeterministicProvider().processTurn({ messages });
    }

    try {
      const groqMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ];

      const payload = {
        model: this.model,
        messages: groqMessages,
        tools: [orderToolDefinition],
        tool_choice: 'auto',
        temperature: 0.3,
        max_tokens: 300
      };

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeoutMs)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Groq API error (${response.status}): ${errorBody}`);
      }

      const data = await response.json();
      const choice = data.choices[0];
      const message = choice.message;

      // Handle function calling
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        if (toolCall.function && toolCall.function.name === 'get_order_details') {
          let args = {};
          try {
            args = typeof toolCall.function.arguments === 'string'
              ? JSON.parse(toolCall.function.arguments)
              : toolCall.function.arguments;
          } catch (e) {
            args = { order_id: String(toolCall.function.arguments) };
          }

          const toolResult = getOrderDetails(args.order_id);

          const followUpMessages = [
            ...groqMessages,
            message,
            {
              role: 'tool',
              tool_call_id: toolCall.id,
              name: 'get_order_details',
              content: JSON.stringify(toolResult)
            }
          ];

          const followUpResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: this.model,
              messages: followUpMessages,
              temperature: 0.3,
              max_tokens: 300
            }),
            signal: AbortSignal.timeout(this.timeoutMs)
          });

          if (!followUpResponse.ok) {
            const errorText = await followUpResponse.text();
            throw new Error(`Groq tool follow-up error (${followUpResponse.status}): ${errorText}`);
          }

          const followUpData = await followUpResponse.json();
          return {
            agent_text: followUpData.choices[0].message.content,
            tool_called: {
              name: 'get_order_details',
              args: args,
              result: toolResult
            },
            provider: `groq-${this.model}`
          };
        } else {
          // Model attempted an unknown or out-of-scope tool call
          const attemptedName = toolCall.function?.name || 'unknown_tool';
          console.warn(`Model attempted to call unknown tool "${attemptedName}"`);
          return {
            agent_text: "I can only assist with Aura Skincare order lookups, returns, and brand policies. How may I help you with your order?",
            tool_called: {
              name: attemptedName,
              args: {},
              rejected: true
            },
            provider: `groq-${this.model}`
          };
        }
      }

      return {
        agent_text: message.content || "Namaste! I'm Aria from Aura Skincare. How can I assist you with your orders or policies?",
        tool_called: null,
        provider: `groq-${this.model}`
      };
    } catch (err) {
      console.warn('GroqProvider failed or timed out, executing deterministic fallback:', err.message);
      return new DeterministicProvider().processTurn({ messages });
    }
  }
}

/**
 * Deterministic local provider (Authoritative brand policy execution)
 */
export class DeterministicProvider extends AiProvider {
  async processTurn({ messages }) {
    return executeLocalFallbackTurn(messages);
  }
}

/**
 * Mock provider for hermetic automated tests
 */
export class MockAiProvider extends AiProvider {
  constructor(customResponses = {}) {
    super();
    this.customResponses = customResponses;
  }

  async processTurn({ messages }) {
    const lastMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    if (this.customResponses[lastMsg]) {
      return {
        agent_text: this.customResponses[lastMsg].agent_text,
        tool_called: this.customResponses[lastMsg].tool_called || null,
        provider: 'mock-ai-provider'
      };
    }
    // Fall back to deterministic logic for standard queries
    const result = executeLocalFallbackTurn(messages);
    return {
      ...result,
      provider: 'mock-ai-provider'
    };
  }
}

/**
 * Factory function to retrieve active AI provider
 */
export function getActiveAiProvider(mockInstance = null) {
  if (mockInstance) return mockInstance;
  if (isGroqConfigured()) {
    return new GroqProvider();
  }
  return new DeterministicProvider();
}
