import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Dumbbell, Play, Pause, Check, Clock, Flame, Trophy, Sparkles, RefreshCw, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Exercise {
  name: string;
  duration: string;
  sets: number;
  reps: string;
  rest: string;
  completed?: boolean;
}

interface Workout {
  name: string;
  duration: string;
  calories: number;
  exercises: Exercise[];
}

interface WeeklyDay {
  day: string;
  type: string;
  completed?: boolean;
}

interface FitnessPlan {
  workout: Workout;
  weeklyPlan: WeeklyDay[];
  insights: string[];
}

const defaultPlan: FitnessPlan = {
  workout: {
    name: "Full Body Workout",
    duration: "30 min",
    calories: 200,
    exercises: [],
  },
  weeklyPlan: [
    { day: "Mon", type: "Rest" },
    { day: "Tue", type: "Rest" },
    { day: "Wed", type: "Rest" },
    { day: "Thu", type: "Rest" },
    { day: "Fri", type: "Rest" },
    { day: "Sat", type: "Rest" },
    { day: "Sun", type: "Rest" },
  ],
  insights: ["Complete your profile to get personalized workout recommendations."],
};

const achievements = [
  { name: "7-Day Streak", icon: Trophy, unlocked: true },
  { name: "100 Push-ups", icon: Dumbbell, unlocked: true },
  { name: "5K Steps", icon: Flame, unlocked: false },
];

export default function Fitness() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [plan, setPlan] = useState<FitnessPlan>(defaultPlan);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [bmiInfo, setBmiInfo] = useState<{ bmi: number | null; category: string }>({ bmi: null, category: "unknown" });
  const [isLoading, setIsLoading] = useState(true);

  const completedCount = exercises.filter((e) => e.completed).length;
  const progress = exercises.length > 0 ? (completedCount / exercises.length) * 100 : 0;

  useEffect(() => {
    if (user) {
      fetchProfileAndGeneratePlan();
    }
  }, [user]);

  const fetchProfileAndGeneratePlan = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (profile && (profile.age || profile.height || profile.weight)) {
        await generatePlan(profile);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setIsLoading(false);
    }
  };

  const generatePlan = async (profile?: any) => {
    setIsGenerating(true);
    try {
      let userProfile = profile;
      if (!userProfile) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user?.id)
          .single();
        userProfile = data;
      }

      if (!userProfile) {
        toast({
          title: "Profile incomplete",
          description: "Please complete your profile to get personalized plans.",
          variant: "destructive",
        });
        setIsLoading(false);
        setIsGenerating(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-plan", {
        body: { profile: userProfile, planType: "fitness" },
      });

      if (error) throw error;

      if (data.plan) {
        const newPlan = data.plan;
        // Mark first few exercises as completed for demo
        const exercisesWithCompletion = newPlan.workout.exercises.map((ex: Exercise, index: number) => ({
          ...ex,
          completed: index < 3,
        }));
        
        // Mark some days as completed in weekly plan
        const weeklyWithCompletion = newPlan.weeklyPlan.map((day: WeeklyDay, index: number) => ({
          ...day,
          completed: index < 3 && day.type !== "Rest",
        }));

        setPlan({ ...newPlan, weeklyPlan: weeklyWithCompletion });
        setExercises(exercisesWithCompletion);
        setBmiInfo({ bmi: data.bmi, category: data.bmiCategory });

        toast({
          title: "Workout plan updated!",
          description: `Personalized for your BMI of ${data.bmi} (${data.bmiCategory}).`,
        });
      }
    } catch (error: any) {
      console.error("Error generating plan:", error);
      toast({
        title: "Error generating plan",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  const toggleExercise = (index: number) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, completed: !ex.completed } : ex))
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">AI Fitness Trainer</h1>
            <p className="text-muted-foreground">
              {bmiInfo.bmi 
                ? `Personalized for BMI ${bmiInfo.bmi} (${bmiInfo.category})`
                : "Complete your profile for personalized workouts"}
            </p>
          </div>
          <Button variant="hero" className="gap-2" onClick={() => generatePlan()} disabled={isGenerating || isLoading}>
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate Plan
          </Button>
        </div>

        {/* Today's Workout Card */}
        <div className="glass rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                <Dumbbell className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold">{plan.workout.name}</h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {plan.workout.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-4 h-4" /> {plan.workout.calories} cal
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant={isWorkoutActive ? "outline" : "hero"}
              size="lg"
              className="gap-2"
              onClick={() => setIsWorkoutActive(!isWorkoutActive)}
              disabled={exercises.length === 0}
            >
              {isWorkoutActive ? (
                <>
                  <Pause className="w-5 h-5" /> Pause Workout
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" /> Start Workout
                </>
              )}
            </Button>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm font-medium">{completedCount}/{exercises.length} exercises</span>
            </div>
            <Progress value={progress} className="h-3 bg-secondary" />
          </div>

          {/* Exercise List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No workout plan yet. Click "Generate Plan" to create your personalized workout.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((exercise, index) => (
                <div
                  key={exercise.name + index}
                  className={cn(
                    "p-4 rounded-xl border transition-all duration-200 cursor-pointer",
                    exercise.completed
                      ? "bg-primary/5 border-primary/30"
                      : "bg-secondary/50 border-border hover:border-primary/30"
                  )}
                  onClick={() => toggleExercise(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                          exercise.completed ? "bg-primary" : "bg-secondary"
                        )}
                      >
                        {exercise.completed ? (
                          <Check className="w-5 h-5 text-primary-foreground" />
                        ) : (
                          <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>
                        )}
                      </div>
                      <div>
                        <p className={cn("font-medium", exercise.completed && "line-through opacity-60")}>
                          {exercise.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {exercise.sets} sets × {exercise.reps} {exercise.rest !== "-" && `• ${exercise.rest} rest`}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{exercise.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Overview & Achievements */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Overview */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-xl font-semibold mb-4">This Week</h3>
            <div className="grid grid-cols-7 gap-2">
              {plan.weeklyPlan.map((day) => (
                <div key={day.day} className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">{day.day}</p>
                  <div
                    className={cn(
                      "w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-all",
                      day.completed
                        ? "bg-primary glow-sm"
                        : day.type === "Rest"
                        ? "bg-secondary/50 border border-border"
                        : "bg-secondary border border-border"
                    )}
                  >
                    {day.completed ? (
                      <Check className="w-5 h-5 text-primary-foreground" />
                    ) : day.type === "Rest" ? (
                      <span className="text-xs text-muted-foreground">R</span>
                    ) : (
                      <Dumbbell className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 truncate">{day.type}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-xl font-semibold mb-4">Achievements</h3>
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.name}
                  className={cn(
                    "p-4 rounded-xl flex items-center justify-between transition-all",
                    achievement.unlocked
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-secondary/50 border border-border opacity-60"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        achievement.unlocked ? "bg-primary/20" : "bg-secondary"
                      )}
                    >
                      <achievement.icon
                        className={cn("w-5 h-5", achievement.unlocked ? "text-primary" : "text-muted-foreground")}
                      />
                    </div>
                    <span className="font-medium">{achievement.name}</span>
                  </div>
                  {achievement.unlocked && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                      Unlocked
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">AI Trainer Insights</h3>
              <p className="text-sm text-muted-foreground">Based on your BMI and profile</p>
            </div>
          </div>
          <div className="space-y-3">
            {plan.insights.map((insight, index) => (
              <div key={index} className="p-4 rounded-lg bg-secondary/50 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <p className="text-sm text-muted-foreground">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
