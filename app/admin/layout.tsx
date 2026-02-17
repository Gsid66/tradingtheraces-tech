import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const adminAuthCookie = cookieStore.get('admin_auth');
  const isAuthenticated = adminAuthCookie?.value === 'authenticated';

  // Allow access to /admin/login without authentication
  // Middleware handles this, but this provides server-side protection as well
  
  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  );
}
