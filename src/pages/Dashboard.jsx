import { useCurrentUser } from '@/lib/store'

export default function Dashboard() {
  const user = useCurrentUser();
  const showTitle = user ? user.showPageTitles !== false : true;
  const today = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString(undefined, options);

  return (
    <div className="space-y-8">
      {showTitle && <div>
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="mt-1">{formattedDate}</p>
      </div>}
      <div className="bg-card rounded-lg shadow p-6 border">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <p className="text-muted-foreground">No recent activity to display.</p>
      </div>
    </div>
  );
}
