import React from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NodeValidationBadgeProps {
  errors: number;
  warnings: number;
  className?: string;
}

/** Small badge shown on canvas nodes when they have validation issues */
export default function NodeValidationBadge({ errors, warnings, className }: NodeValidationBadgeProps) {
  if (errors === 0 && warnings === 0) return null;

  const total = errors + warnings;
  const isError = errors > 0;

  return (
    <div
      className={cn(
        'absolute -top-2 -left-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm z-30',
        isError ? 'bg-destructive text-destructive-foreground' : 'bg-amber-500 text-white',
        className,
      )}
      title={`${errors} error(s), ${warnings} warning(s)`}
    >
      {isError ? <XCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      {total}
    </div>
  );
}
