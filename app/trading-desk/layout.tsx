import { cookies } from 'next/headers';
import Link from 'next/link';
import LoginForm from './LoginForm';
import DateNavigation from './DateNavigation';
import SidebarClient from './SidebarClient';

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

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <SidebarClient />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:ml-0">
        {children}
      </main>
    </div>
  );
}
