-- Enable Row-Level Security on all tables that have policies but RLS disabled
-- This is critical for protecting children's personal information

ALTER TABLE public.children_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_game_sessions ENABLE ROW LEVEL SECURITY;