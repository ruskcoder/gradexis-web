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
        <h2 className="text-2xl font-semibold mb-4">Feature Request</h2>
        <p className="text-muted-foreground">Feature requests are available to make at: </p>
        <a href="https://forms.gle/GmXtne4w9yGxVcDH8">https://forms.gle/GmXtne4w9yGxVcDH8</a>
      </div>
    </div>
  );
}
