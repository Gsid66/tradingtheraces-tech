// Admin route uses its own layout to bypass parent authentication
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
