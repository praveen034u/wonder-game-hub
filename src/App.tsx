import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/Auth/AuthPage";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import ParentSetup from "./pages/ParentSetup";
import ModeSelector from "./pages/ModeSelector";
import GameDashboard from "./pages/GameDashboard";
import StoryDashboard from "./pages/StoryDashboard";
import StoryViewer from "./pages/StoryViewer";
import ProgressRewards from "./pages/ProgressRewards";
import RiddleGame from "./pages/games/RiddleGame";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ProgressProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth routes */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* App routes */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/parent-setup" element={<ParentSetup />} />
            <Route path="/modes" element={<ModeSelector />} />
            <Route path="/games" element={<GameDashboard />} />
            <Route path="/stories" element={<StoryDashboard />} />
            <Route path="/story-viewer" element={<StoryViewer />} />
            <Route path="/progress" element={<ProgressRewards />} />
            <Route path="/games/:gameId" element={<RiddleGame />} />
            
            {/* Root redirect */}
            <Route path="/" element={<Index />} />
            
            {/* 404 fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ProgressProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;