import { cookies } from 'next/headers';
import LoginForm from './LoginForm';

export default async function MergedRatingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('merged_ratings_auth');
  const isAuthenticated = authCookie?.value === 'authenticated';

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {children}
    </div>
  );
}
