import { AiProvider } from '../../server/src/services/aiProvider.js';
import { executeLocalFallbackTurn } from '../../server/src/services/groqService.js';

export class MockAiProvider extends AiProvider {
  constructor(cannedResponses = {}) {
    super();
    this.cannedResponses = cannedResponses;
    this.recordedCalls = [];
  }

  async processTurn({ messages }) {
    this.recordedCalls.push(messages);
    const lastMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';

    if (this.cannedResponses[lastMsg]) {
      return {
        agent_text: this.cannedResponses[lastMsg].agent_text,
        tool_called: this.cannedResponses[lastMsg].tool_called || null,
        provider: 'mock-ai-provider'
      };
    }

    const deterministicResult = executeLocalFallbackTurn(messages);
    return {
      ...deterministicResult,
      provider: 'mock-ai-provider'
    };
  }
}
