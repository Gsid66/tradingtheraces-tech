import { redirect } from 'next/navigation';
import { formatInTimeZone } from 'date-fns-tz';

export default function TradingDeskPage() {
  // Get today's date in Sydney timezone
  const today = new Date();
  const sydneyToday = formatInTimeZone(today, 'Australia/Sydney', 'yyyy-MM-dd');
  
  // Redirect to today's date
  redirect(`/trading-desk/${sydneyToday}`);
}
