import { cookies } from 'next/headers';
import AdminLoginForm from './AdminLoginForm';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const adminAuthCookie = cookieStore.get('trading_desk_admin_auth');
  const isAuthenticated = adminAuthCookie?.value === 'authenticated';

  if (!isAuthenticated) {
    return <AdminLoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
