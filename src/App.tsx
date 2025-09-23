import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProgressProvider } from "@/contexts/ProgressContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
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
      <AuthProvider>
        <ProgressProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Protected routes */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              <Route path="/modes" element={
                <ProtectedRoute requireProfile>
                  <ModeSelector />
                </ProtectedRoute>
              } />
              
              <Route path="/games" element={
                <ProtectedRoute requireProfile>
                  <GameDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/stories" element={
                <ProtectedRoute requireProfile>
                  <StoryDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/story-viewer" element={
                <ProtectedRoute requireProfile>
                  <StoryViewer />
                </ProtectedRoute>
              } />
              
              <Route path="/progress" element={
                <ProtectedRoute requireProfile>
                  <ProgressRewards />
                </ProtectedRoute>
              } />
              
              <Route path="/games/:gameId" element={
                <ProtectedRoute requireProfile>
                  <RiddleGame />
                </ProtectedRoute>
              } />
              
              {/* Root redirect */}
              <Route path="/" element={<Index />} />
              
              {/* 404 fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ProgressProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;