/**
 * Agentic - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * AI-powered chat title generation using Claude Haiku
 * Generates concise, descriptive titles based on conversation content
 */

interface MessageResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

/**
 * Simple heuristic fallback for title generation
 * Used when API call fails or is unavailable
 */
function generateHeuristicTitle(content: string): string {
  // Clean up the content
  const cleaned = content
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Try to get first sentence
  const firstSentence = cleaned.split(/[.!?]/)[0].trim();

  // Truncate to reasonable length
  const title = firstSentence.slice(0, 50);

  return title.length < firstSentence.length ? `${title}...` : title;
}

/**
 * Generate a chat title using Claude Haiku via direct API call
 * Falls back to heuristic if API is unavailable
 *
 * @param firstUserMessage - The first message from the user
 * @returns A concise, descriptive chat title
 */
export async function generateChatTitle(firstUserMessage: string): Promise<string> {
  // Check for API credentials
  const oauthToken = process.env.CLAUDE_CODE_OAUTH_TOKEN;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';

  if (!oauthToken && !apiKey) {
    console.log('📝 No API credentials available, using heuristic title');
    return generateHeuristicTitle(firstUserMessage);
  }

  try {
    // Build headers with proper types
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    };

    // Add auth header based on available credentials
    if (oauthToken) {
      headers['Authorization'] = `Bearer ${oauthToken}`;
    } else {
      headers['x-api-key'] = apiKey as string;
    }

    // Use Haiku for fast, cheap title generation
    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 30,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: `Generate a concise 3-6 word title for a chat that starts with this message. Be specific and descriptive. No quotes, no emoji, just the title text:

"${firstUserMessage.slice(0, 500)}"

Title:`
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json() as MessageResponse;

    // Extract text from response
    const textBlock = data.content.find(block => block.type === 'text');
    if (textBlock) {
      const title = textBlock.text
        .trim()
        .replace(/^["']|["']$/g, '')  // Remove any quotes
        .replace(/^Title:\s*/i, '')    // Remove "Title:" prefix if present
        .slice(0, 60);                  // Max 60 chars

      if (title.length > 0) {
        console.log(`🏷️  Generated AI title: "${title}"`);
        return title;
      }
    }

    // Fallback if response is empty
    return generateHeuristicTitle(firstUserMessage);

  } catch (error) {
    // Don't spam logs - title generation failure is non-critical
    console.log('📝 Title generation failed, using heuristic:', error instanceof Error ? error.message : 'Unknown error');
    return generateHeuristicTitle(firstUserMessage);
  }
}
