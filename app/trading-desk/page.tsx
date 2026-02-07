import { redirect } from 'next/navigation';

export default function TradingDeskPage() {
  // Redirect to the most recent hardcoded date with data
  redirect('/trading-desk/2026-02-07');
}
