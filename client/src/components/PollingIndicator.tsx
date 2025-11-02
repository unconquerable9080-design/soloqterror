import { Activity } from "lucide-react";

export interface PollingIndicatorProps {
  isActive: boolean;
  nextCheckIn?: number;
}

export default function PollingIndicator({ isActive, nextCheckIn }: PollingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Activity className={`h-4 w-4 ${isActive ? 'animate-pulse text-primary' : ''}`} />
      <span className="font-mono" data-testid="text-polling-status">
        {isActive ? (
          nextCheckIn ? `Next check in ${nextCheckIn}s` : 'Polling active'
        ) : (
          'Polling paused'
        )}
      </span>
    </div>
  );
}
