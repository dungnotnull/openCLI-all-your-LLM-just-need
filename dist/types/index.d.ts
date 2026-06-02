export interface Message {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    toolCalls?: ToolCall[];
    toolCallId?: string;
    images?: ImageInput[];
}
export interface ImageInput {
    data: string;
    mediaType: string;
}
export interface ToolCall {
    id: string;
    name: string;
    input: Record<string, unknown>;
}
export interface ToolResult {
    toolCallId: string;
    content: string;
    isError?: boolean;
}
export interface AgentEvent {
    type: "delta" | "tool_call" | "tool_result" | "complete" | "error" | "compression";
    data: unknown;
}
export interface ChatOptions {
    tools?: ToolSchema[];
    temperature?: number;
    maxTokens?: number;
    enableThinking?: boolean;
    retainChainOfThought?: boolean;
    model?: string;
}
export interface Delta {
    type: "content" | "tool_call" | "done" | "usage" | "tool_call_start" | "tool_call_delta";
    content?: string;
    toolCall?: ToolCall;
    toolCallId?: string;
    toolName?: string;
    toolInput?: string;
    inputTokens?: number;
    outputTokens?: number;
}
export interface ChatResponse {
    finalMessage: Message;
    stopReason: "end_turn" | "max_tokens" | "error";
    inputTokens: number;
    outputTokens: number;
}
export interface ModelDescriptor {
    id: string;
    name: string;
    contextWindow: number;
    supportsTools: boolean;
    supportsImages: boolean;
}
export declare abstract class ModelProvider {
    abstract get id(): string;
    abstract get name(): string;
    abstract get models(): ModelDescriptor[];
    abstract chat(messages: Message[], options: ChatOptions): AsyncGenerator<Delta>;
    abstract countTokens(messages: Message[]): Promise<number>;
    supportsMCP(): boolean;
    supportsTools(): boolean;
    maxContextWindow(): number;
}
export interface ToolSchema {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}
export declare abstract class Tool {
    abstract get name(): string;
    abstract get description(): string;
    abstract get inputSchema(): Record<string, unknown>;
    abstract execute(input: Record<string, unknown>): Promise<ToolResult>;
}
export interface Session {
    id: string;
    messages: Message[];
    provider: ModelProvider;
    model: ModelDescriptor;
    createdAt: Date;
    updatedAt: Date;
    appendMessage(message: Message): void;
    appendToolResult(toolCallId: string, result: ToolResult): void;
    isComplete(): boolean;
    compressIfNeeded(): Promise<CompressionMetrics | undefined>;
}
export interface CompressionStrategy {
    maxTokenBudget: number;
    priorityWeights: {
        systemPrompt: number;
        currentTask: number;
        recentTools: number;
        oldToolResults: number;
        oldConversation: number;
    };
    episodicReconstruction: boolean;
    pruningMode: "sliding" | "semantic" | "adaptive";
}
export interface CompressionMetrics {
    beforeTokens: number;
    afterTokens: number;
    reduction: number;
    reductionPercent: number;
    mode: string;
}
//# sourceMappingURL=index.d.ts.map