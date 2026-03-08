import React, { useMemo, useState } from 'react';
import { validateProject, type ProjectValidationResult, type NodeValidationResult, type ValidationSeverity } from '@/lib/validation';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronRight, X, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const severityIcon = (s: ValidationSeverity, className?: string) =>
  s === 'error'
    ? <XCircle className={cn('h-3.5 w-3.5 text-destructive shrink-0', className)} />
    : <AlertTriangle className={cn('h-3.5 w-3.5 text-amber-500 shrink-0', className)} />;

const readinessLabel: Record<string, { label: string; color: string }> = {
  empty: { label: 'Empty', color: 'text-muted-foreground' },
  incomplete: { label: 'Incomplete', color: 'text-destructive' },
  has_warnings: { label: 'Has Warnings', color: 'text-amber-500' },
  ready: { label: 'Ready', color: 'text-emerald-500' },
};

function NodeSection({ result, onSelect }: { result: NodeValidationResult; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const errors = result.issues.filter(i => i.severity === 'error').length;
  const warnings = result.issues.filter(i => i.severity === 'warning').length;

  if (result.issues.length === 0) return null;

  const typeLabel = result.elementType === 'adset' ? 'Ad Set' : result.elementType.charAt(0).toUpperCase() + result.elementType.slice(1);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
        <span className="text-xs font-medium truncate flex-1">
          <span className="text-muted-foreground">{typeLabel}:</span> {result.elementName}
        </span>
        {errors > 0 && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">{errors}</Badge>}
        {warnings > 0 && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/50 text-amber-500">{warnings}</Badge>}
      </button>
      {open && (
        <div className="px-3 pb-2 space-y-1">
          {result.issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-2 text-xs py-1">
              {severityIcon(issue.severity)}
              <span className="text-muted-foreground leading-tight">{issue.message}</span>
            </div>
          ))}
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2 mt-1" onClick={() => onSelect(result.elementId)}>
            Select node →
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ValidationPanel() {
  const { elements, connections, setSelectedElementIds } = useWorkspace();
  const [open, setOpen] = useState(false);

  const result = useMemo(() => validateProject(elements, connections), [elements, connections]);
  const { readiness, stats } = result;
  const meta = readinessLabel[readiness];
  const hasIssues = stats.errors > 0 || stats.warnings > 0;
  const nodesWithIssues = result.nodeResults.filter(r => r.issues.length > 0);

  const handleSelectNode = (id: string) => {
    setSelectedElementIds([id]);
  };

  return (
    <div className="absolute top-4 left-4 z-30">
      {/* Toggle button */}
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "gap-1.5 shadow-md bg-card/95 backdrop-blur-sm border",
          readiness === 'ready' && 'border-emerald-500/30',
          readiness === 'has_warnings' && 'border-amber-500/30',
          readiness === 'incomplete' && 'border-destructive/30',
        )}
        onClick={() => setOpen(!open)}
      >
        {readiness === 'ready' ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        ) : readiness === 'incomplete' ? (
          <XCircle className="h-3.5 w-3.5 text-destructive" />
        ) : readiness === 'has_warnings' ? (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        ) : (
          <ClipboardCheck className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className={cn('text-xs font-medium', meta.color)}>{meta.label}</span>
        {hasIssues && (
          <span className="text-[10px] text-muted-foreground ml-1">
            {stats.errors > 0 && `${stats.errors}E`}
            {stats.errors > 0 && stats.warnings > 0 && ' '}
            {stats.warnings > 0 && `${stats.warnings}W`}
          </span>
        )}
      </Button>

      {/* Panel */}
      {open && (
        <div className="mt-2 w-80 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Validation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-medium', meta.color)}>{meta.label}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="px-3 py-2 border-b border-border flex items-center gap-3 text-xs text-muted-foreground">
            <span>{stats.total} node{stats.total !== 1 ? 's' : ''}</span>
            <span className="text-emerald-500">{stats.ready} ready</span>
            {stats.errors > 0 && <span className="text-destructive">{stats.errors} error{stats.errors !== 1 ? 's' : ''}</span>}
            {stats.warnings > 0 && <span className="text-amber-500">{stats.warnings} warning{stats.warnings !== 1 ? 's' : ''}</span>}
          </div>

          <ScrollArea className="max-h-80">
            {/* Project-level issues */}
            {result.projectIssues.length > 0 && (
              <div className="border-b border-border">
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold bg-muted/30">
                  Project
                </div>
                {result.projectIssues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs px-3 py-1.5">
                    {severityIcon(issue.severity)}
                    <span className="text-muted-foreground leading-tight">{issue.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Node issues */}
            {nodesWithIssues.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold bg-muted/30">
                  Nodes
                </div>
                {nodesWithIssues.map(nr => (
                  <NodeSection key={nr.elementId} result={nr} onSelect={handleSelectNode} />
                ))}
              </div>
            )}

            {/* All good */}
            {!hasIssues && result.projectIssues.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                All nodes are properly configured.
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
