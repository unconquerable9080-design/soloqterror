import PlayerCard from '../PlayerCard';

export default function PlayerCardExample() {
  return (
    <div className="p-6 space-y-4 max-w-md">
      <PlayerCard
        id="1"
        summonerName="FakerGaming"
        status="just_finished"
        lastChecked={new Date().toISOString()}
        onClick={() => console.log('Player clicked')}
        onRemove={() => console.log('Remove clicked')}
      />
      <PlayerCard
        id="2"
        summonerName="DuoPartner123"
        status="losing_streak"
        losingStreak={4}
        lastChecked={new Date(Date.now() - 300000).toISOString()}
        onClick={() => console.log('Player clicked')}
        onRemove={() => console.log('Remove clicked')}
      />
      <PlayerCard
        id="3"
        summonerName="TopLaner"
        status="idle"
        lastChecked={new Date(Date.now() - 3600000).toISOString()}
        onClick={() => console.log('Player clicked')}
        onRemove={() => console.log('Remove clicked')}
      />
    </div>
  );
}
