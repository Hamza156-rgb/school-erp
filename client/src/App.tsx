import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const Auth = lazy(() => import("./pages/Auth"));
const AccessDenied = lazy(() => import("./pages/AccessDenied"));
const Examinations = lazy(() => import("./pages/Examinations"));
const Home = lazy(() => import("./pages/Home"));
const Portal = lazy(() => import("./pages/Portal"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const StudentProfile = lazy(() => import("./pages/StudentProfile"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider delayDuration={180}>
          <Suspense fallback={<div className="grid min-h-screen place-items-center bg-cloud text-xs font-bold text-slate-500">Loading School ERP…</div>}>
            <Switch>
              <Route path="/sign-in" component={Auth} />
              <Route path="/access-denied" component={AccessDenied} />
              <Route path="/verify-email" component={VerifyEmail} />
              <Route path="/reset-password" component={ResetPassword} />
              <Route path="/student-profile" component={StudentProfile} />
              <Route path="/examinations" component={Examinations} />
              <Route path="/portal" component={Portal} />
              <Route path="/" component={Home} />
            </Switch>
          </Suspense>
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
