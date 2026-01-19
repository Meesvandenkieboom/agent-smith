/**
 * Agentic - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import React from 'react';
import { GitBranch, ArrowLeft } from 'lucide-react';

interface BranchIndicatorProps {
  parentSessionTitle: string;
  parentSessionId: string;
  onNavigateToParent?: () => void;
  compact?: boolean;
}

export function BranchIndicator({
  parentSessionTitle,
  parentSessionId: _parentSessionId,
  onNavigateToParent,
  compact = false,
}: BranchIndicatorProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-[rgba(99,102,241,0.15)] rounded-md">
        <GitBranch size={12} className="text-[rgb(165,180,252)]" />
        <span className="text-xs text-[rgb(165,180,252)]">Branch</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)] rounded-lg">
      <GitBranch size={14} className="text-[rgb(165,180,252)] flex-shrink-0" />
      <div className="flex items-center gap-1 text-sm text-[rgb(156,163,175)]">
        <span>Branched from:</span>
        {onNavigateToParent ? (
          <button
            onClick={onNavigateToParent}
            className="font-medium text-[rgb(165,180,252)] hover:text-[rgb(196,181,253)]
                     hover:underline transition-colors flex items-center gap-1"
          >
            {parentSessionTitle}
            <ArrowLeft size={12} className="opacity-60" />
          </button>
        ) : (
          <span className="font-medium text-[rgb(243,244,246)]">
            {parentSessionTitle}
          </span>
        )}
      </div>
    </div>
  );
}

interface BranchBadgeProps {
  count: number;
  onClick?: () => void;
}

export function BranchBadge({ count, onClick }: BranchBadgeProps) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-0.5 bg-[rgba(99,102,241,0.15)]
               hover:bg-[rgba(99,102,241,0.25)] rounded-md transition-colors"
      title={`${count} branch${count !== 1 ? 'es' : ''}`}
    >
      <GitBranch size={12} className="text-[rgb(165,180,252)]" />
      <span className="text-xs font-medium text-[rgb(165,180,252)]">{count}</span>
    </button>
  );
}
