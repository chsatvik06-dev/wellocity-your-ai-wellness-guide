import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Dumbbell, Play, Pause, Check, Clock, Flame, Trophy, Sparkles, RefreshCw, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const todaysWorkout = {
  name: "Full Body Strength",
  duration: "45 min",
  calories: 350,
  exercises: [
    { name: "Warm-up", duration: "5 min", sets: 1, reps: "-", rest: "-", completed: true },
    { name: "Push-ups", duration: "3 min", sets: 3, reps: "15", rest: "60s", completed: true },
    { name: "Squats", duration: "4 min", sets: 3, reps: "12", rest: "60s", completed: true },
    { name: "Dumbbell Rows", duration: "4 min", sets: 3, reps: "12", rest: "60s", completed: false },
    { name: "Lunges", duration: "4 min", sets: 3, reps: "10/leg", rest: "60s", completed: false },
    { name: "Plank", duration: "3 min", sets: 3, reps: "45s", rest: "30s", completed: false },
    { name: "Cool-down", duration: "5 min", sets: 1, reps: "-", rest: "-", completed: false },
  ],
};

const weeklyStats = [
  { day: "Mon", completed: true, type: "Strength" },
  { day: "Tue", completed: true, type: "Cardio" },
  { day: "Wed", completed: true, type: "Rest" },
  { day: "Thu", completed: false, type: "Strength" },
  { day: "Fri", completed: false, type: "HIIT" },
  { day: "Sat", completed: false, type: "Yoga" },
  { day: "Sun", completed: false, type: "Rest" },
];

const achievements = [
  { name: "7-Day Streak", icon: Trophy, unlocked: true },
  { name: "100 Push-ups", icon: Dumbbell, unlocked: true },
  { name: "5K Steps", icon: Flame, unlocked: false },
];

export default function Fitness() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [exercises, setExercises] = useState(todaysWorkout.exercises);

  const completedCount = exercises.filter((e) => e.completed).length;
  const progress = (completedCount / exercises.length) * 100;

  const handleGeneratePlan = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "Workout plan updated!",
        description: "Your AI trainer has created a new personalized workout.",
      });
    }, 2000);
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
            <p className="text-muted-foreground">Workouts tailored to your goals and fitness level</p>
          </div>
          <Button variant="hero" className="gap-2" onClick={handleGeneratePlan} disabled={isGenerating}>
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
                <h2 className="font-display text-2xl font-bold">{todaysWorkout.name}</h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {todaysWorkout.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-4 h-4" /> {todaysWorkout.calories} cal
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant={isWorkoutActive ? "outline" : "hero"}
              size="lg"
              className="gap-2"
              onClick={() => setIsWorkoutActive(!isWorkoutActive)}
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
          <div className="space-y-3">
            {exercises.map((exercise, index) => (
              <div
                key={exercise.name}
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
        </div>

        {/* Weekly Overview & Achievements */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Overview */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-xl font-semibold mb-4">This Week</h3>
            <div className="grid grid-cols-7 gap-2">
              {weeklyStats.map((day) => (
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
              <p className="text-sm text-muted-foreground">Personalized recommendations</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              "Great progress this week! Your consistency is paying off. Consider increasing weight on squats.",
              "Your recovery time has improved. You're ready for more challenging HIIT sessions.",
              "Don't forget to stretch after workouts - it helps prevent injury and improves flexibility.",
            ].map((insight, index) => (
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
