/**
 * PriorityDebugPanel Component
 *
 * Debug panel for observing and tuning the v1 priority system.
 * Shows scoring breakdown, distribution, and explainability for each item.
 *
 * Access: URL param ?debug_priority=1 or dev flag in settings
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import type { PriorityItem } from '@/types/priority';
import { V1_PRIORITY_CONFIG } from '@/types/priority';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PriorityDebugPanelProps {
  allItems: PriorityItem[];
  selected: PriorityItem[];
  distribution: Map<string, number>;
  avgScore: number;
  minScore: number;
  maxScore: number;
}

export function PriorityDebugPanel({
  allItems,
  selected,
  distribution,
  avgScore,
  minScore,
  maxScore,
}: PriorityDebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAllItems, setShowAllItems] = useState(false);

  const exportToJSON = () => {
    const data = {
      timestamp: new Date().toISOString(),
      config: V1_PRIORITY_CONFIG,
      selected: selected.map(item => ({
        id: item.id,
        sourceType: item.sourceType,
        title: item.title,
        priorityScore: item.priorityScore,
        urgencyScore: item.urgencyScore,
        importanceScore: item.importanceScore,
        reasoning: item.reasoning,
        signals: item.signals,
      })),
      allItems: allItems.map(item => ({
        id: item.id,
        sourceType: item.sourceType,
        title: item.title,
        priorityScore: item.priorityScore,
      })),
      stats: {
        totalItems: allItems.length,
        selectedItems: selected.length,
        distribution: Object.fromEntries(distribution),
        avgScore,
        minScore,
        maxScore,
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `priority-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const excluded = allItems.filter(item => !selected.find(s => s.id === item.id));

  return (
    <Card className="mt-4 border-yellow-500/50 bg-yellow-50/10 dark:bg-yellow-950/10">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-yellow-600 dark:text-yellow-400">🔍</span>
            PRIORITY DEBUG PANEL (v1)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                exportToJSON();
              }}
            >
              <Download className="h-4 w-4 mr-1" />
              Export JSON
            </Button>
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 text-sm font-mono">
          {/* Scoring Formula */}
          <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded">
            <div className="font-bold mb-1">SCORING FORMULA:</div>
            <div>
              priorityScore = {V1_PRIORITY_CONFIG.weights.urgency.toFixed(2)} * urgency +{' '}
              {V1_PRIORITY_CONFIG.weights.importance.toFixed(2)} * importance
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Max items: {V1_PRIORITY_CONFIG.maxItems} | No diversity rules | No score threshold
            </div>
          </div>

          {/* Top Items */}
          <div>
            <div className="font-bold mb-2">
              TOP {selected.length} PRIORITY ITEMS:
            </div>
            <div className="space-y-3">
              {selected.map((item, index) => (
                <DebugPriorityItem key={item.id} item={item} rank={index + 1} />
              ))}
            </div>
          </div>

          {/* Excluded Items (samples) */}
          {excluded.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold">
                  EXCLUDED ITEMS ({excluded.length} total):
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllItems(!showAllItems)}
                >
                  {showAllItems ? 'Show less' : 'Show all'}
                </Button>
              </div>
              <div className="space-y-2 text-xs">
                {(showAllItems ? excluded : excluded.slice(0, 5)).map(item => (
                  <div key={item.id} className="text-gray-600 dark:text-gray-400">
                    <Badge variant="outline" className="mr-2">{item.sourceType}</Badge>
                    {item.title} (score: {item.priorityScore.toFixed(2)})
                  </div>
                ))}
                {!showAllItems && excluded.length > 5 && (
                  <div className="text-gray-500">... and {excluded.length - 5} more</div>
                )}
              </div>
            </div>
          )}

          {/* Distribution */}
          <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded">
            <div className="font-bold mb-2">DISTRIBUTION:</div>
            {Array.from(distribution.entries()).map(([source, count]) => (
              <div key={source}>
                {source}: {count} items
              </div>
            ))}
            <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-700">
              <div>Avg Score: {avgScore.toFixed(2)}</div>
              <div>Min Score: {minScore.toFixed(2)}</div>
              <div>Max Score: {maxScore.toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function DebugPriorityItem({ item, rank }: { item: PriorityItem; rank: number }) {
  const [showDetails, setShowDetails] = useState(false);

  const sourceTypeLabels: Record<string, string> = {
    task: 'TASK',
    inbox: 'INBOX',
    calendar_event: 'CALENDAR',
  };

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold">{rank}.</span>
            <Badge variant="secondary">{sourceTypeLabels[item.sourceType] || item.sourceType}</Badge>
            <span className="font-semibold">{item.title}</span>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Score: {item.priorityScore.toFixed(2)} |
            Urgency: {item.urgencyScore.toFixed(2)} ({(item.urgencyScore * V1_PRIORITY_CONFIG.weights.urgency).toFixed(2)}) |
            Importance: {item.importanceScore.toFixed(2)} ({(item.importanceScore * V1_PRIORITY_CONFIG.weights.importance).toFixed(2)})
          </div>
          <div className="text-xs mb-2">{item.reasoning}</div>

          {/* Signals */}
          <div className="flex flex-wrap gap-1">
            {item.signals.map((signal, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {signal.source}({signal.weight.toFixed(2)}): {signal.description}
              </Badge>
            ))}
          </div>

          {/* Context Labels */}
          {item.contextLabels && item.contextLabels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.contextLabels.map((label, i) => (
                <Badge key={i} className="text-xs">{label}</Badge>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-700 text-xs">
          <div><strong>ID:</strong> {item.sourceId}</div>
          {item.dueAt && <div><strong>Due:</strong> {item.dueAt}</div>}
          {item.eventStartAt && <div><strong>Starts:</strong> {item.eventStartAt}</div>}
          {item.companyName && <div><strong>Company:</strong> {item.companyName}</div>}
          {item.projectName && <div><strong>Project:</strong> {item.projectName}</div>}
          <div><strong>Recency Score (debug):</strong> {item.recencyScore?.toFixed(2) || 'N/A'}</div>
        </div>
      )}
    </div>
  );
}
