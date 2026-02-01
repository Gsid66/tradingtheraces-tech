import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';
import DateNavigation from './DateNavigation';

export default async function TradingDeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('trading_desk_auth');
  const isAuthenticated = authCookie?.value === 'authenticated';

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Show trading desk layout with sidebar
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-purple-400 mb-2">Trading Desk</h1>
          <p className="text-sm text-gray-400">Daily Race Analysis</p>
        </div>

        <div className="mb-6">
          <h2 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
            Select Date
          </h2>
          <DateNavigation />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
