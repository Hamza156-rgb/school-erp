/**
 * Compatibility layout wrapper retained for feature pages that import the
 * template component. Authentication is handled by School ERP's custom
 * session APIs rather than the retired starter OAuth flow.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-cloud text-ink">{children}</div>;
}
