import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserSettingsProvider } from "@/contexts/UserSettingsContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PublicOnlyRoute from "@/components/auth/PublicOnlyRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Workspace from "./pages/Workspace";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
        <UserSettingsProvider>
          <Routes>
            {/* Public marketing pages */}
            <Route path="/" element={<Index />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />

            {/* Auth routes — redirect to dashboard if already logged in */}
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
            <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Authenticated app routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/workspace" element={<Navigate to="/dashboard" replace />} />
            <Route path="/workspace/:projectId" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </UserSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
