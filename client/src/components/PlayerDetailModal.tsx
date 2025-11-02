import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trophy, Skull, Target, Coins, Clock, Eye } from "lucide-react";

export interface MatchData {
  matchId: string;
  champion: string;
  result: 'win' | 'loss';
  kills: number;
  deaths: number;
  assists: number;
  wardsPlaced: number;
  creepScore: number;
  goldEarned: number;
  gameDuration: number;
}

export interface PlayerDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summonerName: string;
  recentMatches?: MatchData[];
}

export default function PlayerDetailModal({
  open,
  onOpenChange,
  summonerName,
  recentMatches = [],
}: PlayerDetailModalProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const latestMatch = recentMatches[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="modal-player-detail">
        <DialogHeader>
          <DialogTitle className="text-2xl" data-testid="text-player-name">
            {summonerName}
          </DialogTitle>
        </DialogHeader>

        {latestMatch && (
          <>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Latest Match</h3>
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant={latestMatch.result === 'win' ? 'default' : 'destructive'}>
                    {latestMatch.result === 'win' ? 'Victory' : 'Defeat'}
                  </Badge>
                  <span className="text-sm font-medium">{latestMatch.champion}</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {formatDuration(latestMatch.gameDuration)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">K/D/A</div>
                      <div className="text-xl font-bold font-mono">
                        {latestMatch.kills}/{latestMatch.deaths}/{latestMatch.assists}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">CS</div>
                      <div className="text-xl font-bold font-mono">{latestMatch.creepScore}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Wards</div>
                      <div className="text-xl font-bold font-mono">{latestMatch.wardsPlaced}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Gold</div>
                      <div className="text-xl font-bold font-mono">
                        {(latestMatch.goldEarned / 1000).toFixed(1)}k
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {recentMatches.length > 1 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Match History</h3>
                    <div className="space-y-2">
                      {recentMatches.slice(0, 5).map((match, index) => (
                        <div
                          key={match.matchId}
                          className="flex items-center justify-between p-3 rounded-md bg-card border border-card-border"
                          data-testid={`match-history-${index}`}
                        >
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={match.result === 'win' ? 'default' : 'destructive'}
                              className="w-16 justify-center"
                            >
                              {match.result === 'win' ? 'Win' : 'Loss'}
                            </Badge>
                            <span className="text-sm font-medium">{match.champion}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-mono">
                              {match.kills}/{match.deaths}/{match.assists}
                            </span>
                            <span className="text-muted-foreground font-mono">
                              {formatDuration(match.gameDuration)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {!latestMatch && (
          <div className="py-8 text-center text-muted-foreground">
            No match data available yet
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
