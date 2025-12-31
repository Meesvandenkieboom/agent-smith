/**
 * Agent Smith - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { ProviderType } from '../client/config/models';

const MCP_CONFIG_PATH = path.join(process.cwd(), '.claude', 'mcp-servers.json');

interface McpHttpServerConfig {
  type: 'http';
  url: string;
  headers?: Record<string, string>;
}

interface McpStdioServerConfig {
  type: 'stdio';
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

type McpServerConfig = McpHttpServerConfig | McpStdioServerConfig;

/**
 * Load header overrides from config file
 */
async function loadHeaderOverrides(): Promise<Record<string, Record<string, string>>> {
  try {
    const data = await fs.readFile(MCP_CONFIG_PATH, 'utf-8');
    const config = JSON.parse(data);
    return config.headerOverrides || {};
  } catch {
    return {};
  }
}

/**
 * MCP servers configuration for different providers
 * - Shared MCP servers (grep.app): Available to all providers
 * - Provider-specific MCP servers: Z.AI has additional web-search and media analysis tools
 */
export const MCP_SERVERS_BY_PROVIDER: Record<ProviderType, Record<string, McpServerConfig>> = {
  'anthropic': {
    // Grep.app MCP - code search across public GitHub repositories
    'grep': {
      type: 'http',
      url: 'https://mcp.grep.app',
    },
    // Context7 MCP - real-time library documentation lookup
    'context7': {
      type: 'http',
      url: 'https://mcp.context7.com/mcp',
    },
  },
  'z-ai': {
    // Grep.app MCP - code search across public GitHub repositories
    'grep': {
      type: 'http',
      url: 'https://mcp.grep.app',
    },
    // Context7 MCP - real-time library documentation lookup
    'context7': {
      type: 'http',
      url: 'https://mcp.context7.com/mcp',
    },
    // GLM models use Z.AI MCP servers
    'web-search-prime': {
      type: 'http',
      url: 'https://api.z.ai/api/mcp/web_search_prime/mcp',
      headers: {
        'Authorization': `Bearer ${process.env.ZAI_API_KEY || ''}`,
      },
    },
    'zai-mcp-server': {
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@z_ai/mcp-server'],
      env: {
        'Z_AI_API_KEY': process.env.ZAI_API_KEY || '',
        'Z_AI_MODE': 'ZAI',
      },
    },
  },
  'moonshot': {
    // Grep.app MCP - code search across public GitHub repositories
    'grep': {
      type: 'http',
      url: 'https://mcp.grep.app',
    },
    // Context7 MCP - real-time library documentation lookup
    'context7': {
      type: 'http',
      url: 'https://mcp.context7.com/mcp',
    },
  },
};

/**
 * Get MCP servers for a specific provider (with header overrides merged)
 *
 * @param provider - The provider type
 * @param _modelId - Optional model ID for model-specific MCP server restrictions
 */
export async function getMcpServers(provider: ProviderType, _modelId?: string): Promise<Record<string, McpServerConfig>> {
  const baseServers = MCP_SERVERS_BY_PROVIDER[provider] || {};
  const headerOverrides = await loadHeaderOverrides();

  // Deep clone and merge header overrides
  const servers: Record<string, McpServerConfig> = {};
  for (const [id, config] of Object.entries(baseServers)) {
    if (config.type === 'http' && headerOverrides[id]) {
      servers[id] = {
        ...config,
        headers: {
          ...config.headers,
          ...headerOverrides[id],
        },
      };
    } else {
      servers[id] = config;
    }
  }

  return servers;
}

/**
 * Get allowed tools for a provider's MCP servers
 *
 * @param provider - The provider type
 * @param _modelId - Optional model ID for model-specific tool restrictions
 */
export function getAllowedMcpTools(provider: ProviderType, _modelId?: string): string[] {
  // Grep.app MCP tools - available to all providers
  const grepTools = [
    'mcp__grep__searchGitHub',
  ];

  // Context7 MCP tools - real-time library documentation lookup
  const context7Tools = [
    'mcp__context7__resolve-library-id',
    'mcp__context7__get-library-docs',
  ];

  if (provider === 'anthropic') {
    return [
      ...grepTools,
      ...context7Tools,
    ];
  }

  if (provider === 'z-ai') {
    return [
      ...grepTools,
      ...context7Tools,
      'mcp__web-search-prime__search',
      'mcp__zai-mcp-server__image_analysis',
      'mcp__zai-mcp-server__video_analysis',
    ];
  }

  if (provider === 'moonshot') {
    return [
      ...grepTools,
      ...context7Tools,
    ];
  }

  return [];
}
