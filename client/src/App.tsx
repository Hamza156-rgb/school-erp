import { useAuth } from "@/_core/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const AccessDenied = lazy(() => import("./pages/AccessDenied"));
const Auth = lazy(() => import("./pages/Auth"));
const Examinations = lazy(() => import("./pages/Examinations"));
const Home = lazy(() => import("./pages/Home"));
const Landing = lazy(() => import("./pages/Landing"));
const Portal = lazy(() => import("./pages/Portal"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const StudentProfile = lazy(() => import("./pages/StudentProfile"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));

function SecureSessionGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/sign-in", { replace: true });
  }, [isAuthenticated, loading, navigate]);

  if (loading || !isAuthenticated) {
    return <div className="grid min-h-screen place-items-center bg-cloud text-xs font-bold text-slate-500">Checking your secure school session…</div>;
  }
  return <>{children}</>;
}

function ProtectedRoutes() {
  return <SecureSessionGate><Switch>
    <Route path="/dashboard" component={Home} />
    <Route path="/access-denied" component={AccessDenied} />
    <Route path="/student-profile" component={StudentProfile} />
    <Route path="/examinations" component={Examinations} />
    <Route path="/portal" component={Portal} />
    <Route component={Home} />
  </Switch></SecureSessionGate>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider delayDuration={180}><Suspense fallback={<div className="grid min-h-screen place-items-center bg-cloud text-xs font-bold text-slate-500">Loading School ERP…</div>}><Switch>
    <Route path="/" component={Landing} />
    <Route path="/sign-in" component={Auth} />
    <Route path="/verify-email" component={VerifyEmail} />
    <Route path="/reset-password" component={ResetPassword} />
    <Route component={ProtectedRoutes} />
  </Switch></Suspense><Toaster richColors position="top-right" /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
