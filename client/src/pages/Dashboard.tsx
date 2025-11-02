import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AddPlayerForm from "@/components/AddPlayerForm";
import PlayerCard from "@/components/PlayerCard";
import PlayerDetailModal from "@/components/PlayerDetailModal";
import NotificationToast from "@/components/NotificationToast";
import EmptyState from "@/components/EmptyState";
import PollingIndicator from "@/components/PollingIndicator";
import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import type { MatchData } from "@/components/PlayerDetailModal";

interface Player {
  id: string;
  summonerName: string;
  puuid: string;
  status: 'idle' | 'just_finished' | 'losing_streak';
  losingStreak: number;
  lastChecked: string | null;
  lastMatchId: string | null;
  region: string;
  addedAt: string;
}

interface Match {
  id: string;
  playerId: string;
  matchId: string;
  champion: string | null;
  result: string | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  wardsPlaced: number | null;
  creepScore: number | null;
  goldEarned: number | null;
  gameDuration: number | null;
  completedAt: string;
}

interface Notification {
  id: string;
  type: 'game_finished' | 'losing_streak';
  summonerName: string;
  losingStreak?: number;
  timestamp: number;
}

export default function Dashboard() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastNotificationCheck, setLastNotificationCheck] = useState(Date.now());
  const { toast } = useToast();

  const { data: players = [], isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ['/api/players'],
    refetchInterval: 3000,
  });

  const { data: selectedPlayerMatches = [] } = useQuery<Match[]>({
    queryKey: ['/api/players', selectedPlayer?.id, 'matches'],
    enabled: !!selectedPlayer,
  });

  const { data: pollingStatus } = useQuery<{ isActive: boolean; queueLength: number }>({
    queryKey: ['/api/status'],
    refetchInterval: 2000,
  });

  const addPlayerMutation = useMutation({
    mutationFn: async ({ summonerName, region }: { summonerName: string; region: string }) => {
      const res = await apiRequest('POST', '/api/players', { summonerName, region });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
      toast({
        title: "Player added",
        description: "Player is now being tracked",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding player",
        description: error.message || "Failed to add player",
        variant: "destructive",
      });
    },
  });

  const removePlayerMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/players/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
      toast({
        title: "Player removed",
        description: "Player is no longer being tracked",
      });
    },
  });

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications?since=${lastNotificationCheck}`);
        const newNotifications: Array<{ type: string; summonerName: string; losingStreak?: number; timestamp: number }> = await response.json();
        
        if (newNotifications.length > 0) {
          const withIds = newNotifications.map(n => ({
            id: `${n.timestamp}-${Math.random()}`,
            type: n.type as 'game_finished' | 'losing_streak',
            summonerName: n.summonerName,
            losingStreak: n.losingStreak,
            timestamp: n.timestamp,
          }));
          
          setNotifications(prev => [...withIds, ...prev].slice(0, 5));
          setLastNotificationCheck(Date.now());

          withIds.forEach(notification => {
            toast({
              title: notification.type === 'game_finished' ? 'Game Finished' : 'Losing Streak',
              description: notification.type === 'game_finished'
                ? `${notification.summonerName} just finished a game!`
                : `${notification.summonerName} is on a ${notification.losingStreak}-game losing streak`,
            });
          });

          queryClient.invalidateQueries({ queryKey: ['/api/players'] });
        }
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

    const interval = setInterval(checkNotifications, 3000);
    return () => clearInterval(interval);
  }, [lastNotificationCheck, toast]);

  const handleAddPlayer = (summonerName: string, region: string) => {
    addPlayerMutation.mutate({ summonerName, region });
  };

  const handleRemovePlayer = (id: string) => {
    removePlayerMutation.mutate(id);
  };

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
  };

  const handleCloseNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const sortedPlayers = [...players].sort((a, b) => {
    const statusPriority = { just_finished: 0, losing_streak: 1, idle: 2 };
    if (statusPriority[a.status] !== statusPriority[b.status]) {
      return statusPriority[a.status] - statusPriority[b.status];
    }
    if (a.status === 'losing_streak' && b.status === 'losing_streak') {
      return b.losingStreak - a.losingStreak;
    }
    return a.summonerName.localeCompare(b.summonerName);
  });

  const convertedMatches: MatchData[] = selectedPlayerMatches.map(m => ({
    matchId: m.matchId,
    champion: m.champion || 'Unknown',
    result: (m.result === 'win' ? 'win' : 'loss') as 'win' | 'loss',
    kills: m.kills || 0,
    deaths: m.deaths || 0,
    assists: m.assists || 0,
    wardsPlaced: m.wardsPlaced || 0,
    creepScore: m.creepScore || 0,
    goldEarned: m.goldEarned || 0,
    gameDuration: m.gameDuration || 0,
  }));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">LoL Player Tracker</h1>
          </div>
          <div className="flex items-center gap-4">
            <PollingIndicator 
              isActive={pollingStatus?.isActive || false} 
              nextCheckIn={pollingStatus?.queueLength ? 
                Math.max(1, Math.floor((pollingStatus.queueLength * 1.5))) : 
                undefined
              }
            />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <AddPlayerForm 
            onAdd={handleAddPlayer}
            isLoading={addPlayerMutation.isPending}
          />
        </div>

        {playersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-card rounded-md animate-pulse" />
            ))}
          </div>
        ) : players.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPlayers.map((player) => (
              <PlayerCard
                key={player.id}
                id={player.id}
                summonerName={player.summonerName}
                status={player.status}
                losingStreak={player.losingStreak}
                lastChecked={player.lastChecked || undefined}
                onClick={() => handlePlayerClick(player)}
                onRemove={() => handleRemovePlayer(player.id)}
              />
            ))}
          </div>
        )}
      </main>

      <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm w-full">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            type={notification.type}
            summonerName={notification.summonerName}
            losingStreak={notification.losingStreak}
            onClose={() => handleCloseNotification(notification.id)}
          />
        ))}
      </div>

      {selectedPlayer && (
        <PlayerDetailModal
          open={!!selectedPlayer}
          onOpenChange={(open) => !open && setSelectedPlayer(null)}
          summonerName={selectedPlayer.summonerName}
          recentMatches={convertedMatches}
        />
      )}
    </div>
  );
}
