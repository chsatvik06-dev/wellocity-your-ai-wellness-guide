-- Add micronutrient columns to nutrition_logs
ALTER TABLE public.nutrition_logs
ADD COLUMN IF NOT EXISTS quantity numeric,
ADD COLUMN IF NOT EXISTS unit text DEFAULT 'serving',
ADD COLUMN IF NOT EXISTS iron numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS calcium numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS magnesium numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS zinc numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS vitamin_a numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS vitamin_b12 numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS vitamin_c numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS vitamin_d numeric DEFAULT 0;

-- Add mood and flow_intensity to menstrual_cycles
ALTER TABLE public.menstrual_cycles
ADD COLUMN IF NOT EXISTS mood text,
ADD COLUMN IF NOT EXISTS flow_intensity text DEFAULT 'medium';

-- Create menopause_profiles table
CREATE TABLE IF NOT EXISTS public.menopause_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stage text NOT NULL DEFAULT 'perimenopause',
  age integer,
  gender text DEFAULT 'female',
  symptoms text[] DEFAULT '{}',
  hormonal_changes text,
  hot_flash_severity text DEFAULT 'none',
  bone_density_concern boolean DEFAULT false,
  fatigue_level text DEFAULT 'none',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on menopause_profiles
ALTER TABLE public.menopause_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for menopause_profiles
CREATE POLICY "Users can view their own menopause profile"
ON public.menopause_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own menopause profile"
ON public.menopause_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own menopause profile"
ON public.menopause_profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own menopause profile"
ON public.menopause_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_menopause_profiles_updated_at
BEFORE UPDATE ON public.menopause_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create teen_mood_logs table for mood tracking
CREATE TABLE IF NOT EXISTS public.teen_mood_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mood_value integer NOT NULL CHECK (mood_value >= 1 AND mood_value <= 5),
  mood_label text NOT NULL,
  notes text,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on teen_mood_logs
ALTER TABLE public.teen_mood_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for teen_mood_logs
CREATE POLICY "Users can view their own mood logs"
ON public.teen_mood_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mood logs"
ON public.teen_mood_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood logs"
ON public.teen_mood_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Create chat_logs table for AI chatbot interactions
CREATE TABLE IF NOT EXISTS public.chat_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  chat_type text NOT NULL,
  user_message text NOT NULL,
  ai_response text NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on chat_logs
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_logs (anonymous allowed for privacy)
CREATE POLICY "Users can view their own chat logs"
ON public.chat_logs
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can insert chat logs"
ON public.chat_logs
FOR INSERT
WITH CHECK (true);

-- Create daily_micronutrients view/table for historical tracking
CREATE TABLE IF NOT EXISTS public.daily_micronutrients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date date NOT NULL,
  iron numeric DEFAULT 0,
  calcium numeric DEFAULT 0,
  magnesium numeric DEFAULT 0,
  zinc numeric DEFAULT 0,
  vitamin_a numeric DEFAULT 0,
  vitamin_b12 numeric DEFAULT 0,
  vitamin_c numeric DEFAULT 0,
  vitamin_d numeric DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on daily_micronutrients
ALTER TABLE public.daily_micronutrients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for daily_micronutrients
CREATE POLICY "Users can view their own daily micronutrients"
ON public.daily_micronutrients
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily micronutrients"
ON public.daily_micronutrients
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily micronutrients"
ON public.daily_micronutrients
FOR UPDATE
USING (auth.uid() = user_id);