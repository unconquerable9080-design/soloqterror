import PollingIndicator from '../PollingIndicator';

export default function PollingIndicatorExample() {
  return (
    <div className="p-6 space-y-4">
      <PollingIndicator isActive={true} nextCheckIn={12} />
      <PollingIndicator isActive={true} />
      <PollingIndicator isActive={false} />
    </div>
  );
}
