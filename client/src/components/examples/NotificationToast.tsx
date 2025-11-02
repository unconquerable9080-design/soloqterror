import NotificationToast from '../NotificationToast';

export default function NotificationToastExample() {
  return (
    <div className="p-6 space-y-4 max-w-md">
      <NotificationToast
        type="game_finished"
        summonerName="FakerGaming"
        onClose={() => console.log('Close notification')}
      />
      <NotificationToast
        type="losing_streak"
        summonerName="DuoPartner123"
        losingStreak={4}
        onClose={() => console.log('Close notification')}
      />
    </div>
  );
}
