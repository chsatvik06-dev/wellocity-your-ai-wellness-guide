import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Utensils, Plus, Flame, Beef, Wheat, Droplet, Apple, ChevronRight, Sparkles, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const dailyGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
};

const currentIntake = {
  calories: 1450,
  protein: 95,
  carbs: 140,
  fat: 45,
};

const mealPlan = [
  {
    meal: "Breakfast",
    time: "7:00 AM",
    items: [
      { name: "Oatmeal with berries", calories: 280, protein: 8, carbs: 45, fat: 6 },
      { name: "Greek yogurt", calories: 120, protein: 15, carbs: 8, fat: 3 },
      { name: "Green tea", calories: 0, protein: 0, carbs: 0, fat: 0 },
    ],
    logged: true,
  },
  {
    meal: "Lunch",
    time: "12:30 PM",
    items: [
      { name: "Grilled chicken breast", calories: 250, protein: 40, carbs: 0, fat: 8 },
      { name: "Quinoa salad", calories: 220, protein: 8, carbs: 35, fat: 6 },
      { name: "Mixed vegetables", calories: 80, protein: 4, carbs: 15, fat: 1 },
    ],
    logged: true,
  },
  {
    meal: "Snack",
    time: "3:30 PM",
    items: [
      { name: "Almonds (1 oz)", calories: 160, protein: 6, carbs: 6, fat: 14 },
      { name: "Apple", calories: 95, protein: 0, carbs: 25, fat: 0 },
    ],
    logged: false,
  },
  {
    meal: "Dinner",
    time: "7:00 PM",
    items: [
      { name: "Grilled salmon", calories: 350, protein: 35, carbs: 0, fat: 20 },
      { name: "Roasted sweet potato", calories: 150, protein: 3, carbs: 35, fat: 0 },
      { name: "Steamed broccoli", calories: 55, protein: 4, carbs: 10, fat: 1 },
    ],
    logged: false,
  },
];

const macroInfo = [
  { name: "Calories", icon: Flame, current: currentIntake.calories, goal: dailyGoals.calories, unit: "kcal", color: "text-primary" },
  { name: "Protein", icon: Beef, current: currentIntake.protein, goal: dailyGoals.protein, unit: "g", color: "text-blue-400" },
  { name: "Carbs", icon: Wheat, current: currentIntake.carbs, goal: dailyGoals.carbs, unit: "g", color: "text-yellow-400" },
  { name: "Fat", icon: Droplet, current: currentIntake.fat, goal: dailyGoals.fat, unit: "g", color: "text-purple-400" },
];

export default function Nutrition() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchFood, setSearchFood] = useState("");

  const handleGeneratePlan = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "Diet plan updated!",
        description: "Your AI nutritionist has created a new personalized plan.",
      });
    }, 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">AI Nutritionist</h1>
            <p className="text-muted-foreground">Personalized nutrition based on your health profile</p>
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
            <Button variant="hero" className="gap-2" onClick={handleGeneratePlan} disabled={isGenerating}>
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
                {macro.current} <span className="text-sm text-muted-foreground font-normal">/ {macro.goal} {macro.unit}</span>
              </p>
              <Progress 
                value={(macro.current / macro.goal) * 100} 
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
              <p className="text-sm text-muted-foreground">AI-generated based on your goals and preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            {mealPlan.map((meal) => (
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
        </div>

        {/* AI Insights */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">AI Nutritionist Insights</h3>
              <p className="text-sm text-muted-foreground">Based on your profile and recent data</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              "Your protein intake is on track! Keep prioritizing lean meats and legumes.",
              "Consider adding more iron-rich foods like spinach and red meat to support your energy levels.",
              "Your hydration is slightly below target. Try to drink 2 more glasses of water today.",
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
