import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, TrendingDown, CheckCircle2 } from "lucide-react";

export interface PlayerCardProps {
  id: string;
  summonerName: string;
  status: 'idle' | 'just_finished' | 'losing_streak';
  losingStreak?: number;
  lastChecked?: string;
  onClick?: () => void;
  onRemove?: () => void;
}

export default function PlayerCard({
  summonerName,
  status,
  losingStreak = 0,
  lastChecked,
  onClick,
  onRemove,
}: PlayerCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case 'just_finished':
        return (
          <Badge variant="default" className="gap-1.5">
            <CheckCircle2 className="h-3 w-3" />
            Just Finished
          </Badge>
        );
      case 'losing_streak':
        return (
          <Badge variant="destructive" className="gap-1.5">
            <TrendingDown className="h-3 w-3" />
            {losingStreak}-Game Streak
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1.5">
            <Clock className="h-3 w-3" />
            Idle
          </Badge>
        );
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card
      className="p-4 hover-elevate active-elevate-2 cursor-pointer transition-shadow duration-200"
      onClick={onClick}
      data-testid={`card-player-${summonerName}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium truncate mb-2" data-testid={`text-summoner-name-${summonerName}`}>
            {summonerName}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge()}
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          data-testid={`button-remove-${summonerName}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-3 text-xs text-muted-foreground font-mono" data-testid={`text-last-checked-${summonerName}`}>
        Last checked: {formatTime(lastChecked)}
      </div>
    </Card>
  );
}
