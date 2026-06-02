/**
 * MCP (Model Context Protocol) Client Bridge
 *
 * Implements MCP protocol compatibility for OpenCLI.
 * Supports both stdio and HTTP transports.
 *
 * MCP Specification: https://modelcontextprotocol.io/specification
 */
import type { ToolSchema } from '../types/index.js';
/**
 * MCP server configuration
 */
export interface MCPServerConfig {
    name: string;
    transport: 'stdio' | 'http';
    command?: string;
    args?: string[];
    url?: string;
    env?: Record<string, string>;
}
/**
 * MCP tool schema from server
 */
export interface MCPToolSchema {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}
/**
 * MCP server capabilities
 */
export interface MCPServerCapabilities {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
}
/**
 * MCP initialize response
 */
export interface MCPInitializeResponse {
    protocolVersion: string;
    capabilities: MCPServerCapabilities;
    serverInfo: {
        name: string;
        version: string;
    };
}
/**
 * MCP call tool response
 */
export interface MCPToolResponse {
    content: Array<{
        type: 'text' | 'image' | 'resource';
        text?: string;
        data?: string;
    }>;
    isError?: boolean;
}
/**
 * MCP Client Bridge
 *
 * Manages communication with MCP servers.
 */
export declare class MCPClientBridge {
    private servers;
    private serverCapabilities;
    private serverTools;
    /**
     * Register an MCP server
     */
    registerServer(config: MCPServerConfig): void;
    /**
     * Unregister an MCP server
     */
    unregisterServer(name: string): void;
    /**
     * Initialize a server and get its capabilities
     */
    initializeServer(name: string): Promise<MCPInitializeResponse | null>;
    /**
     * Initialize HTTP-based MCP server
     */
    private initializeHTTPServer;
    /**
     * Initialize stdio-based MCP server
     */
    private initializeStdioServer;
    /**
     * List available tools from all servers
     */
    listTools(): Promise<MCPToolSchema[]>;
    /**
     * Get tools from a specific server
     */
    getServerTools(serverName: string): Promise<MCPToolSchema[]>;
    /**
     * Call a tool on an MCP server
     */
    callTool(serverName: string, toolName: string, input: Record<string, unknown>): Promise<MCPToolResponse>;
    /**
     * Call tool via HTTP
     */
    private callHTTPTool;
    /**
     * Call tool via stdio
     */
    private callStdioTool;
    /**
     * Convert MCP tool schema to OpenCLI tool schema
     */
    mcpToOpenCLISchema(mcpTool: MCPToolSchema): ToolSchema;
    /**
     * Get all registered servers
     */
    getServers(): MCPServerConfig[];
    /**
     * Get server by name
     */
    getServer(name: string): MCPServerConfig | undefined;
}
/**
 * Get or create MCP client instance
 */
export declare function getMCPClient(): MCPClientBridge;
//# sourceMappingURL=mcp-bridge.d.ts.map