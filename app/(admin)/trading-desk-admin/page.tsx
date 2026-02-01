import { cookies } from 'next/headers';
import AdminLoginForm from './AdminLoginForm';
import PasswordManager from './PasswordManager';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get('trading_desk_admin');
  const isAuthenticated = adminCookie?.value === 'authenticated';

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <AdminLoginForm />;
  }

  // Show password manager if authenticated
  return <PasswordManager />;
}
