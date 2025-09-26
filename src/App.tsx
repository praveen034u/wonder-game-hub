import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProgressProvider } from "@/contexts/ProgressContext";
import { Auth0ProviderWrapper } from "@/contexts/Auth0Context";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthPage } from "./pages/Auth/AuthPage";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import ParentSetup from "./pages/ParentSetup";
import ModeSelector from "./pages/ModeSelector";
import GameDashboard from "./pages/GameDashboard";
import StoryDashboard from "./pages/StoryDashboard";
import StoryViewer from "./pages/StoryViewer";
import ProgressRewards from "./pages/ProgressRewards";
import RiddleGame from "./pages/games/RiddleGame";
import NotFound from "./pages/NotFound";
import VoicePricingPlans from "./pages/VoicePricingPlans";
import PaymentPage from "./pages/Payment";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Auth0ProviderWrapper>
        <AuthProvider>
          <ProgressProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
              {/* Auth routes */}
              <Route path="/auth" element={<AuthPage />} />
              
              {/* App routes */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/parent-setup" element={<ParentSetup />} />
              <Route path="/modes" element={<ModeSelector />} />
              <Route path="/games" element={<GameDashboard />} />
              <Route path="/stories" element={<StoryDashboard />} />
              <Route path="/story-viewer" element={<StoryViewer />} />
              <Route path="/progress" element={<ProgressRewards />} />
              <Route path="/games/:gameId" element={<RiddleGame />} />
              <Route path="/pricing" element={<VoicePricingPlans />} />
              <Route path="/payment" element={<PaymentPage />} />
              
              {/* Root redirect */}
              <Route path="/" element={<Index />} />
              
              {/* 404 fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ProgressProvider>
        </AuthProvider>
      </Auth0ProviderWrapper>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;