import { cookies } from 'next/headers';
import LoginForm from '../trading-desk/LoginForm';
import SidebarClient from '../trading-desk/SidebarClient';

export default async function RaceDataLayout({
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
