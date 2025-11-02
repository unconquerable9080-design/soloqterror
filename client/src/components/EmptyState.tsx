import { UserPlus } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-state">
      <div className="rounded-full bg-muted p-6 mb-4">
        <UserPlus className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No Players Tracked Yet</h3>
      <p className="text-muted-foreground max-w-md">
        Add your first player above to start tracking their League of Legends matches in real-time.
      </p>
    </div>
  );
}
