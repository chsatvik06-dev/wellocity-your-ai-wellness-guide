import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Heart, Brain, Sparkles, Apple, Dumbbell, Moon, MessageCircle, TrendingUp, Send, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfWeek, addDays } from "date-fns";

const moodOptions = [
  { emoji: "😊", label: "Great", color: "bg-green-500/20 border-green-500/50", value: 5 },
  { emoji: "🙂", label: "Good", color: "bg-blue-500/20 border-blue-500/50", value: 4 },
  { emoji: "😐", label: "Okay", color: "bg-yellow-500/20 border-yellow-500/50", value: 3 },
  { emoji: "😔", label: "Low", color: "bg-orange-500/20 border-orange-500/50", value: 2 },
  { emoji: "😢", label: "Struggling", color: "bg-red-500/20 border-red-500/50", value: 1 },
];

const teenTopics = [
  {
    icon: Brain,
    title: "Mood & Emotions",
    description: "Understanding and managing mood swings",
    tips: ["It's normal to feel emotional", "Talk to someone you trust", "Practice deep breathing"],
  },
  {
    icon: Apple,
    title: "Growth Nutrition",
    description: "Fuel your body for healthy development",
    tips: ["Eat protein with every meal", "Don't skip breakfast", "Stay hydrated throughout the day"],
  },
  {
    icon: Dumbbell,
    title: "Age-Appropriate Fitness",
    description: "Safe exercises for growing bodies",
    tips: ["Focus on fun activities", "Avoid overtraining", "Include rest days"],
  },
  {
    icon: Moon,
    title: "Sleep Health",
    description: "Quality rest for teens",
    tips: ["Aim for 8-10 hours", "Consistent bedtime routine", "Limit screen time before bed"],
  },
];

interface MoodEntry {
  day: string;
  mood: number;
  date: Date;
}

interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

export default function TeenHealth() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [weeklyMoodData, setWeeklyMoodData] = useState<MoodEntry[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      content: "Hi there! 👋 I'm here to help you navigate the ups and downs of being a teenager. Feel free to ask me anything about mood swings, nutrition, fitness, or just life in general. Everything you share is private and judgment-free!",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWeeklyMoods();
    } else {
      initializeWeekData();
      setIsLoading(false);
    }
  }, [user]);

  const initializeWeekData = () => {
    const weekStart = startOfWeek(new Date());
    const weekData = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return {
        day: format(date, "EEE"),
        mood: 0,
        date,
      };
    });
    setWeeklyMoodData(weekData);
  };

  const fetchWeeklyMoods = async () => {
    try {
      const weekStart = startOfWeek(new Date());
      const weekEnd = addDays(weekStart, 7);

      const { data, error } = await supabase
        .from("teen_mood_logs")
        .select("*")
        .eq("user_id", user?.id)
        .gte("logged_at", weekStart.toISOString())
        .lt("logged_at", weekEnd.toISOString())
        .order("logged_at", { ascending: true });

      if (error) throw error;

      const weekData = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(weekStart, i);
        const dayStr = format(date, "EEE");
        const log = data?.find(d => format(new Date(d.logged_at), "EEE") === dayStr);
        return {
          day: dayStr,
          mood: log?.mood_value || 0,
          date,
        };
      });

      setWeeklyMoodData(weekData);

      // Check if today has a mood logged
      const today = format(new Date(), "EEE");
      const todayLog = weekData.find(d => d.day === today);
      if (todayLog?.mood) {
        setSelectedMood(todayLog.mood);
      }
    } catch (error) {
      console.error("Error fetching moods:", error);
      initializeWeekData();
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoodSelect = async (moodValue: number) => {
    setSelectedMood(moodValue);
    setIsSaving(true);

    const moodLabel = moodOptions.find((m) => m.value === moodValue)?.label || "";
    
    // Update local state immediately
    const today = format(new Date(), "EEE");
    setWeeklyMoodData((prev) =>
      prev.map((entry) => entry.day === today ? { ...entry, mood: moodValue } : entry)
    );

    if (user) {
      try {
        // Check if there's already a log for today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const { data: existing } = await supabase
          .from("teen_mood_logs")
          .select("id")
          .eq("user_id", user.id)
          .gte("logged_at", todayStart.toISOString())
          .lte("logged_at", todayEnd.toISOString())
          .single();

        if (existing) {
          // Update existing
          await supabase
            .from("teen_mood_logs")
            .update({ mood_value: moodValue, mood_label: moodLabel })
            .eq("id", existing.id);
        } else {
          // Insert new
          await supabase.from("teen_mood_logs").insert({
            user_id: user.id,
            mood_value: moodValue,
            mood_label: moodLabel,
          });
        }
      } catch (error) {
        console.error("Error saving mood:", error);
      }
    }

    toast({
      title: "Mood logged!",
      description: `You're feeling ${moodLabel.toLowerCase()} today. Thanks for checking in!`,
    });
    setIsSaving(false);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke("health-chat", {
        body: {
          message: userMessage,
          chatType: "teen",
          userId: user?.id,
          context: {
            mood: selectedMood ? moodOptions.find(m => m.value === selectedMood)?.label : undefined,
          },
        },
      });

      if (error) throw error;
      setChatMessages((prev) => [...prev, { role: "ai", content: data.response }]);
    } catch (error: any) {
      console.error("Error sending chat:", error);
      // Fallback to local responses if AI fails
      const fallbackResponses = [
        "That's a great question! During your teenage years, your body goes through many changes. It's completely normal to feel confused or overwhelmed sometimes. Remember to be patient with yourself!",
        "I understand how you feel. Many teens experience similar things. One thing that might help is talking to a trusted adult or writing in a journal to express your thoughts.",
        "Thanks for sharing that with me. It takes courage to open up. Remember that whatever you're going through, you're not alone, and things can get better with time and support.",
      ];
      setChatMessages((prev) => [...prev, { role: "ai", content: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)] }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Teenage Doctor AI</h1>
          <p className="text-muted-foreground">Your supportive guide through growing up</p>
        </div>

        {/* Mood Check-in */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display text-xl font-semibold mb-4">How are you feeling today?</h3>
          <div className="flex flex-wrap gap-3">
            {moodOptions.map((mood) => (
              <button
                key={mood.label}
                onClick={() => handleMoodSelect(mood.value)}
                disabled={isSaving}
                className={cn(
                  "px-6 py-4 rounded-xl border-2 transition-all duration-200 hover:scale-105",
                  mood.color,
                  selectedMood === mood.value && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
              >
                <span className="text-3xl block mb-1">{mood.emoji}</span>
                <span className="text-sm font-medium">{mood.label}</span>
              </button>
            ))}
          </div>
          {selectedMood && (
            <p className="mt-4 text-sm text-muted-foreground">
              Thanks for checking in! Your mood has been recorded.
            </p>
          )}
        </div>

        {/* Mood Trend */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-xl font-semibold">Your Mood This Week</h3>
              <p className="text-sm text-muted-foreground">Track your emotional wellbeing</p>
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between h-32 px-4">
                {weeklyMoodData.map((day) => (
                  <div key={day.day} className="flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        "w-8 rounded-t-lg transition-all duration-300",
                        day.mood > 0 ? "bg-primary" : "bg-secondary"
                      )}
                      style={{ height: day.mood > 0 ? `${day.mood * 20}%` : "10%" }}
                    />
                    <span className="text-xs text-muted-foreground">{day.day}</span>
                  </div>
                ))}
              </div>
              {weeklyMoodData.every((d) => d.mood === 0) && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Start logging your mood to see your weekly trend!
                </p>
              )}
            </>
          )}
        </div>

        {/* Topic Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {teenTopics.map((topic) => (
            <div key={topic.title} className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <topic.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">{topic.title}</h3>
                  <p className="text-sm text-muted-foreground">{topic.description}</p>
                </div>
              </div>
              <div className="space-y-2">
                {topic.tips.map((tip, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <span className="text-sm">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* AI Chat */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold">Talk to Teenage Doctor AI</h3>
              <p className="text-sm text-muted-foreground">A safe space to ask questions</p>
            </div>
          </div>

          <div className="space-y-4 mb-4 max-h-80 overflow-y-auto">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}>
                {msg.role === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "p-4 rounded-2xl max-w-[80%]",
                    msg.role === "ai"
                      ? "rounded-tl-none bg-secondary/50"
                      : "rounded-tr-none bg-primary text-primary-foreground"
                  )}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="p-4 rounded-2xl rounded-tl-none bg-secondary/50">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Type your question here..."
              className="flex-1 h-12 px-4 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={isTyping}
              className="h-12 px-6 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </div>

        {/* Puberty Assistant Section */}
        <div className="glass rounded-2xl p-6 border-2 border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold">Puberty Assistant</h3>
              <p className="text-sm text-muted-foreground">Understanding your body's changes</p>
            </div>
          </div>
          <p className="text-muted-foreground mb-4">
            Have questions about puberty? Our AI assistant can help you understand physical changes, emotional changes, growth, nutrition, and self-care in a private, non-judgmental way.
          </p>
          <div className="grid md:grid-cols-4 gap-3">
            {["Physical Changes", "Emotional Health", "Growth & Nutrition", "Self-Care Tips"].map((topic) => (
              <button
                key={topic}
                onClick={() => setChatInput(`Tell me about ${topic.toLowerCase()} during puberty`)}
                className="p-3 rounded-lg bg-secondary/50 text-sm hover:bg-secondary/70 transition-colors"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Helpful Resources */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display text-xl font-semibold mb-4">Quick Tips</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                title: "Feeling Overwhelmed?",
                content: "Take 5 deep breaths. Breathe in for 4 counts, hold for 4, exhale for 4.",
                icon: Heart,
              },
              {
                title: "Can't Sleep?",
                content: "Put away your phone 30 minutes before bed. Try reading or gentle stretching.",
                icon: Moon,
              },
              {
                title: "Need Energy?",
                content: "A quick walk or 10 jumping jacks can boost your mood and energy instantly.",
                icon: Dumbbell,
              },
            ].map((tip) => (
              <div key={tip.title} className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <tip.icon className="w-4 h-4 text-primary" />
                  <h4 className="font-medium text-sm">{tip.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground">{tip.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Support Notice */}
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
          <p className="text-sm text-center">
            <Heart className="w-4 h-4 inline mr-2 text-primary" />
            Remember: It's okay to ask for help. If you're struggling, talk to a trusted adult or call a helpline.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
