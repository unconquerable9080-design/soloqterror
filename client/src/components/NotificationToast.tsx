import { Bell, TrendingDown, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface NotificationToastProps {
  type: 'game_finished' | 'losing_streak';
  summonerName: string;
  losingStreak?: number;
  onClose?: () => void;
}

export default function NotificationToast({
  type,
  summonerName,
  losingStreak = 0,
  onClose,
}: NotificationToastProps) {
  return (
    <Card className="p-4 shadow-lg border-l-4 border-l-primary animate-in slide-in-from-right duration-300">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {type === 'game_finished' ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <TrendingDown className="h-5 w-5 text-destructive" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {type === 'game_finished'
              ? `${summonerName} just finished a game!`
              : `${summonerName} is on a ${losingStreak}-game losing streak`}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="flex-shrink-0 h-6 w-6"
          onClick={onClose}
          data-testid="button-close-notification"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
