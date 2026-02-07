import { redirect } from 'next/navigation';

// Force dynamic rendering to ensure today's date is always current
export const dynamic = 'force-dynamic';

export default function TradingDeskPage() {
  // Redirect to today's date dynamically
  const today = new Date().toLocaleDateString('en-CA', { 
    timeZone: 'Australia/Sydney' 
  });
  redirect(`/trading-desk/${today}`);
}
