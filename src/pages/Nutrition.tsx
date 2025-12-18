import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Utensils, Plus, Flame, Beef, Wheat, Droplet, Apple, ChevronRight, Sparkles, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface MealItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Meal {
  meal: string;
  time: string;
  items: MealItem[];
  logged?: boolean;
}

interface NutritionPlan {
  dailyGoals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  mealPlan: Meal[];
  insights: string[];
}

const defaultPlan: NutritionPlan = {
  dailyGoals: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
  mealPlan: [],
  insights: ["Complete your profile to get personalized nutrition recommendations."],
};

export default function Nutrition() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchFood, setSearchFood] = useState("");
  const [plan, setPlan] = useState<NutritionPlan>(defaultPlan);
  const [bmiInfo, setBmiInfo] = useState<{ bmi: number | null; category: string }>({ bmi: null, category: "unknown" });
  const [currentIntake, setCurrentIntake] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [isLoading, setIsLoading] = useState(true);

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
        body: { profile: userProfile, planType: "nutrition" },
      });

      if (error) throw error;

      if (data.plan) {
        const newPlan = {
          ...data.plan,
          mealPlan: data.plan.mealPlan.map((meal: Meal, index: number) => ({
            ...meal,
            logged: index < 2, // First two meals logged by default for demo
          })),
        };
        setPlan(newPlan);
        setBmiInfo({ bmi: data.bmi, category: data.bmiCategory });
        
        // Calculate current intake from logged meals
        const loggedMeals = newPlan.mealPlan.filter((m: Meal) => m.logged);
        const intake = loggedMeals.reduce(
          (acc: typeof currentIntake, meal: Meal) => {
            meal.items.forEach((item) => {
              acc.calories += item.calories;
              acc.protein += item.protein;
              acc.carbs += item.carbs;
              acc.fat += item.fat;
            });
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
        setCurrentIntake(intake);

        toast({
          title: "Diet plan updated!",
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

  const macroInfo = [
    { name: "Calories", icon: Flame, current: currentIntake.calories, goal: plan.dailyGoals.calories, unit: "kcal", color: "text-primary" },
    { name: "Protein", icon: Beef, current: currentIntake.protein, goal: plan.dailyGoals.protein, unit: "g", color: "text-blue-400" },
    { name: "Carbs", icon: Wheat, current: currentIntake.carbs, goal: plan.dailyGoals.carbs, unit: "g", color: "text-yellow-400" },
    { name: "Fat", icon: Droplet, current: currentIntake.fat, goal: plan.dailyGoals.fat, unit: "g", color: "text-purple-400" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">AI Nutritionist</h1>
            <p className="text-muted-foreground">
              {bmiInfo.bmi 
                ? `Personalized for BMI ${bmiInfo.bmi} (${bmiInfo.category})`
                : "Complete your profile for personalized plans"}
            </p>
          </div>
          <div className="flex gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Log Food
                </Button>
              </DialogTrigger>
              <DialogContent className="glass">
                <DialogHeader>
                  <DialogTitle className="font-display">Log Food</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="food">Search Food</Label>
                    <Input
                      id="food"
                      placeholder="e.g., Chicken breast, Apple..."
                      className="h-12 bg-secondary border-border"
                      value={searchFood}
                      onChange={(e) => setSearchFood(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Popular foods</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["Chicken breast", "Rice", "Eggs", "Banana", "Oatmeal", "Salmon"].map((food) => (
                        <button
                          key={food}
                          className="p-2 text-sm rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                          onClick={() => setSearchFood(food)}
                        >
                          {food}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button variant="hero" className="w-full">
                    Add to Log
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="hero" className="gap-2" onClick={() => generatePlan()} disabled={isGenerating || isLoading}>
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Generate Plan
            </Button>
          </div>
        </div>

        {/* Macro Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {macroInfo.map((macro) => (
            <div key={macro.name} className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{macro.name}</span>
                <div className={cn("w-8 h-8 rounded-lg bg-secondary flex items-center justify-center", macro.color)}>
                  <macro.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-display font-bold mb-1">
                {Math.round(macro.current)} <span className="text-sm text-muted-foreground font-normal">/ {macro.goal} {macro.unit}</span>
              </p>
              <Progress 
                value={Math.min((macro.current / macro.goal) * 100, 100)} 
                className="h-2 bg-secondary"
              />
            </div>
          ))}
        </div>

        {/* Meal Plan */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-xl font-semibold">Today's Meal Plan</h3>
              <p className="text-sm text-muted-foreground">AI-generated based on your BMI, age, and goals</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : plan.mealPlan.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No meal plan yet. Click "Generate Plan" to create your personalized diet plan.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {plan.mealPlan.map((meal) => (
                <div
                  key={meal.meal}
                  className={cn(
                    "p-5 rounded-xl border transition-all duration-200",
                    meal.logged
                      ? "bg-primary/5 border-primary/30"
                      : "bg-secondary/50 border-border hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        meal.logged ? "bg-primary/20" : "bg-secondary"
                      )}>
                        <Utensils className={cn("w-5 h-5", meal.logged ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      <div>
                        <p className="font-semibold">{meal.meal}</p>
                        <p className="text-sm text-muted-foreground">{meal.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-medium text-primary">
                        {meal.items.reduce((sum, item) => sum + item.calories, 0)} cal
                      </p>
                      {meal.logged ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                          Logged
                        </span>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-primary">
                          Log <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {meal.items.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between p-3 rounded-lg bg-background/50"
                      >
                        <div className="flex items-center gap-3">
                          <Apple className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{item.calories} cal</span>
                          <span>{item.protein}g P</span>
                          <span>{item.carbs}g C</span>
                          <span>{item.fat}g F</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">AI Nutritionist Insights</h3>
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
