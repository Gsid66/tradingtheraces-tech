import { cookies } from 'next/headers';
import LoginForm from './LoginForm';

export default async function BetfairAnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('betfair_analysis_auth');
  const isAuthenticated = authCookie?.value === 'authenticated';

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <>{children}</>;
}
