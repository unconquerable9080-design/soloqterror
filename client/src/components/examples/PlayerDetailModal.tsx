import { useState } from 'react';
import PlayerDetailModal from '../PlayerDetailModal';
import { Button } from '@/components/ui/button';

export default function PlayerDetailModalExample() {
  const [open, setOpen] = useState(true);

  const mockMatches = [
    {
      matchId: 'NA1_12345',
      champion: 'Ahri',
      result: 'win' as const,
      kills: 12,
      deaths: 3,
      assists: 8,
      wardsPlaced: 15,
      creepScore: 234,
      goldEarned: 15420,
      gameDuration: 1820,
    },
    {
      matchId: 'NA1_12346',
      champion: 'Yasuo',
      result: 'loss' as const,
      kills: 5,
      deaths: 7,
      assists: 4,
      wardsPlaced: 8,
      creepScore: 189,
      goldEarned: 11200,
      gameDuration: 1620,
    },
    {
      matchId: 'NA1_12347',
      champion: 'Zed',
      result: 'win' as const,
      kills: 18,
      deaths: 5,
      assists: 12,
      wardsPlaced: 12,
      creepScore: 267,
      goldEarned: 18900,
      gameDuration: 2100,
    },
  ];

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Open Player Details</Button>
      <PlayerDetailModal
        open={open}
        onOpenChange={setOpen}
        summonerName="FakerGaming"
        recentMatches={mockMatches}
      />
    </div>
  );
}
