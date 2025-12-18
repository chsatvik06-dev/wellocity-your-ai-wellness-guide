import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import Health from "./pages/Health";
import Nutrition from "./pages/Nutrition";
import Fitness from "./pages/Fitness";
import PeriodTracker from "./pages/PeriodTracker";
import Menopause from "./pages/Menopause";
import TeenHealth from "./pages/TeenHealth";
import Feedback from "./pages/Feedback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile/setup" element={
              <ProtectedRoute><ProfileSetup /></ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/health" element={
              <ProtectedRoute><Health /></ProtectedRoute>
            } />
            <Route path="/nutrition" element={
              <ProtectedRoute><Nutrition /></ProtectedRoute>
            } />
            <Route path="/fitness" element={
              <ProtectedRoute><Fitness /></ProtectedRoute>
            } />
            <Route path="/period" element={
              <ProtectedRoute><PeriodTracker /></ProtectedRoute>
            } />
            <Route path="/menopause" element={
              <ProtectedRoute><Menopause /></ProtectedRoute>
            } />
            <Route path="/teen" element={
              <ProtectedRoute><TeenHealth /></ProtectedRoute>
            } />
            <Route path="/feedback" element={
              <ProtectedRoute><Feedback /></ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
