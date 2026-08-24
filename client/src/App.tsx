import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Auth from "./pages/Auth";
import AccessDenied from "./pages/AccessDenied";
import Examinations from "./pages/Examinations";
import Home from "./pages/Home";
import Portal from "./pages/Portal";
import ResetPassword from "./pages/ResetPassword";
import StudentProfile from "./pages/StudentProfile";
import VerifyEmail from "./pages/VerifyEmail";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider delayDuration={180}>
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
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
