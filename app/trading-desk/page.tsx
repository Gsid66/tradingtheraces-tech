import { redirect } from 'next/navigation';

export default function TradingDeskPage() {
  // Redirect to today's date dynamically
  const today = new Date().toLocaleDateString('en-CA', { 
    timeZone: 'Australia/Sydney' 
  });
  redirect(`/trading-desk/${today}`);
}
