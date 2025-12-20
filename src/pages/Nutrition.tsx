import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Utensils, Plus, Flame, Beef, Wheat, Droplet, Apple, ChevronRight, Sparkles, RefreshCw, Search, Edit2, Trash2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FoodItem {
  id?: string;
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  iron: number;
  calcium: number;
  magnesium: number;
  zinc: number;
  vitamin_a: number;
  vitamin_b12: number;
  vitamin_c: number;
  vitamin_d: number;
  meal_type: string;
  logged_at?: string;
}

interface NutritionPlan {
  dailyGoals: { calories: number; protein: number; carbs: number; fat: number };
  mealPlan: { meal: string; time: string; items: { name: string; calories: number; protein: number; carbs: number; fat: number }[]; logged?: boolean }[];
  insights: string[];
}

// Common food database with micronutrients
const foodDatabase: Omit<FoodItem, 'id' | 'meal_type' | 'logged_at'>[] = [
  { food_name: "Chicken Breast (100g)", quantity: 1, unit: "serving", calories: 165, protein: 31, carbs: 0, fats: 3.6, iron: 1, calcium: 15, magnesium: 29, zinc: 1, vitamin_a: 6, vitamin_b12: 0.3, vitamin_c: 0, vitamin_d: 0 },
  { food_name: "Brown Rice (1 cup)", quantity: 1, unit: "cup", calories: 216, protein: 5, carbs: 45, fats: 1.8, iron: 0.8, calcium: 20, magnesium: 84, zinc: 1.2, vitamin_a: 0, vitamin_b12: 0, vitamin_c: 0, vitamin_d: 0 },
  { food_name: "Eggs (2 large)", quantity: 2, unit: "eggs", calories: 144, protein: 12, carbs: 1, fats: 10, iron: 1.8, calcium: 56, magnesium: 12, zinc: 1.3, vitamin_a: 270, vitamin_b12: 1.1, vitamin_c: 0, vitamin_d: 2 },
  { food_name: "Banana", quantity: 1, unit: "medium", calories: 105, protein: 1.3, carbs: 27, fats: 0.4, iron: 0.3, calcium: 6, magnesium: 32, zinc: 0.2, vitamin_a: 64, vitamin_b12: 0, vitamin_c: 10, vitamin_d: 0 },
  { food_name: "Oatmeal (1 cup)", quantity: 1, unit: "cup", calories: 150, protein: 5, carbs: 27, fats: 3, iron: 1.7, calcium: 21, magnesium: 56, zinc: 1.5, vitamin_a: 0, vitamin_b12: 0, vitamin_c: 0, vitamin_d: 0 },
  { food_name: "Salmon (100g)", quantity: 1, unit: "serving", calories: 208, protein: 20, carbs: 0, fats: 13, iron: 0.8, calcium: 12, magnesium: 27, zinc: 0.6, vitamin_a: 40, vitamin_b12: 2.8, vitamin_c: 0, vitamin_d: 11 },
  { food_name: "Spinach (1 cup raw)", quantity: 1, unit: "cup", calories: 7, protein: 1, carbs: 1, fats: 0, iron: 0.8, calcium: 30, magnesium: 24, zinc: 0.2, vitamin_a: 2813, vitamin_b12: 0, vitamin_c: 8, vitamin_d: 0 },
  { food_name: "Greek Yogurt (1 cup)", quantity: 1, unit: "cup", calories: 130, protein: 17, carbs: 8, fats: 4, iron: 0.1, calcium: 200, magnesium: 19, zinc: 0.9, vitamin_a: 22, vitamin_b12: 1.3, vitamin_c: 0, vitamin_d: 0 },
  { food_name: "Almonds (1 oz)", quantity: 1, unit: "oz", calories: 164, protein: 6, carbs: 6, fats: 14, iron: 1, calcium: 76, magnesium: 76, zinc: 0.9, vitamin_a: 0, vitamin_b12: 0, vitamin_c: 0, vitamin_d: 0 },
  { food_name: "Broccoli (1 cup)", quantity: 1, unit: "cup", calories: 55, protein: 4, carbs: 11, fats: 0.5, iron: 1, calcium: 62, magnesium: 33, zinc: 0.6, vitamin_a: 567, vitamin_b12: 0, vitamin_c: 135, vitamin_d: 0 },
  { food_name: "Sweet Potato (medium)", quantity: 1, unit: "medium", calories: 103, protein: 2, carbs: 24, fats: 0, iron: 0.7, calcium: 38, magnesium: 27, zinc: 0.3, vitamin_a: 14187, vitamin_b12: 0, vitamin_c: 22, vitamin_d: 0 },
  { food_name: "Lentils (1 cup cooked)", quantity: 1, unit: "cup", calories: 230, protein: 18, carbs: 40, fats: 0.8, iron: 6.6, calcium: 38, magnesium: 71, zinc: 2.5, vitamin_a: 8, vitamin_b12: 0, vitamin_c: 3, vitamin_d: 0 },
];

const micronutrientRDA = {
  iron: { value: 18, unit: "mg" },
  calcium: { value: 1000, unit: "mg" },
  magnesium: { value: 400, unit: "mg" },
  zinc: { value: 11, unit: "mg" },
  vitamin_a: { value: 900, unit: "mcg" },
  vitamin_b12: { value: 2.4, unit: "mcg" },
  vitamin_c: { value: 90, unit: "mg" },
  vitamin_d: { value: 20, unit: "mcg" },
};

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
  const [micronutrients, setMicronutrients] = useState({ iron: 0, calcium: 0, magnesium: 0, zinc: 0, vitamin_a: 0, vitamin_b12: 0, vitamin_c: 0, vitamin_d: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [todaysLogs, setTodaysLogs] = useState<FoodItem[]>([]);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState("breakfast");
  const [selectedFood, setSelectedFood] = useState<typeof foodDatabase[0] | null>(null);
  const [customFood, setCustomFood] = useState<Partial<FoodItem>>({});
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("search");

  useEffect(() => {
    if (user) {
      fetchProfileAndGeneratePlan();
      fetchTodaysIntake();
    }
  }, [user]);

  const fetchTodaysIntake = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from("nutrition_logs")
        .select("*")
        .eq("user_id", user?.id)
        .gte("logged_at", today.toISOString())
        .order("logged_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setTodaysLogs(data as FoodItem[]);
        
        const intake = data.reduce(
          (acc, log) => ({
            calories: acc.calories + (log.calories || 0),
            protein: acc.protein + (Number(log.protein) || 0),
            carbs: acc.carbs + (Number(log.carbs) || 0),
            fat: acc.fat + (Number(log.fats) || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
        setCurrentIntake(intake);

        const micros = data.reduce(
          (acc, log) => ({
            iron: acc.iron + (Number(log.iron) || 0),
            calcium: acc.calcium + (Number(log.calcium) || 0),
            magnesium: acc.magnesium + (Number(log.magnesium) || 0),
            zinc: acc.zinc + (Number(log.zinc) || 0),
            vitamin_a: acc.vitamin_a + (Number(log.vitamin_a) || 0),
            vitamin_b12: acc.vitamin_b12 + (Number(log.vitamin_b12) || 0),
            vitamin_c: acc.vitamin_c + (Number(log.vitamin_c) || 0),
            vitamin_d: acc.vitamin_d + (Number(log.vitamin_d) || 0),
          }),
          { iron: 0, calcium: 0, magnesium: 0, zinc: 0, vitamin_a: 0, vitamin_b12: 0, vitamin_c: 0, vitamin_d: 0 }
        );
        setMicronutrients(micros);
      }
    } catch (error) {
      console.error("Error fetching nutrition logs:", error);
    }
  };

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
        const { data } = await supabase.from("profiles").select("*").eq("user_id", user?.id).single();
        userProfile = data;
      }

      if (!userProfile) {
        toast({ title: "Profile incomplete", description: "Please complete your profile to get personalized plans.", variant: "destructive" });
        setIsLoading(false);
        setIsGenerating(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-plan", {
        body: { profile: userProfile, planType: "nutrition" },
      });

      if (error) throw error;

      if (data.plan) {
        setPlan({ ...data.plan, mealPlan: data.plan.mealPlan.map((meal: any) => ({ ...meal, logged: false })) });
        setBmiInfo({ bmi: data.bmi, category: data.bmiCategory });
        await fetchTodaysIntake();
        toast({ title: "Diet plan updated!", description: `Personalized for your BMI of ${data.bmi} (${data.bmiCategory}).` });
      }
    } catch (error: any) {
      console.error("Error generating plan:", error);
      toast({ title: "Error generating plan", description: error.message || "Please try again later.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  const logFood = async () => {
    if (!selectedFood && !customFood.food_name) {
      toast({ title: "Select a food", description: "Please select or enter a food item.", variant: "destructive" });
      return;
    }

    const food = selectedFood || customFood;
    const multiplier = quantity;

    try {
      const { error } = await supabase.from("nutrition_logs").insert({
        user_id: user?.id,
        food_name: food.food_name,
        quantity: multiplier,
        unit: food.unit || "serving",
        meal_type: selectedMealType,
        calories: Math.round((food.calories || 0) * multiplier),
        protein: Math.round((food.protein || 0) * multiplier * 10) / 10,
        carbs: Math.round((food.carbs || 0) * multiplier * 10) / 10,
        fats: Math.round((food.fats || 0) * multiplier * 10) / 10,
        iron: Math.round((food.iron || 0) * multiplier * 10) / 10,
        calcium: Math.round((food.calcium || 0) * multiplier * 10) / 10,
        magnesium: Math.round((food.magnesium || 0) * multiplier * 10) / 10,
        zinc: Math.round((food.zinc || 0) * multiplier * 10) / 10,
        vitamin_a: Math.round((food.vitamin_a || 0) * multiplier * 10) / 10,
        vitamin_b12: Math.round((food.vitamin_b12 || 0) * multiplier * 10) / 10,
        vitamin_c: Math.round((food.vitamin_c || 0) * multiplier * 10) / 10,
        vitamin_d: Math.round((food.vitamin_d || 0) * multiplier * 10) / 10,
      });

      if (error) throw error;

      toast({ title: "Food logged!", description: `${food.food_name} added to ${selectedMealType}.` });
      setIsLogDialogOpen(false);
      setSelectedFood(null);
      setCustomFood({});
      setQuantity(1);
      setSearchFood("");
      await fetchTodaysIntake();
    } catch (error: any) {
      console.error("Error logging food:", error);
      toast({ title: "Error logging food", description: error.message || "Please try again.", variant: "destructive" });
    }
  };

  const updateFood = async () => {
    if (!editingFood?.id) return;

    try {
      const { error } = await supabase
        .from("nutrition_logs")
        .update({
          food_name: editingFood.food_name,
          quantity: editingFood.quantity,
          calories: editingFood.calories,
          protein: editingFood.protein,
          carbs: editingFood.carbs,
          fats: editingFood.fats,
          meal_type: editingFood.meal_type,
        })
        .eq("id", editingFood.id);

      if (error) throw error;

      toast({ title: "Food updated!" });
      setIsEditDialogOpen(false);
      setEditingFood(null);
      await fetchTodaysIntake();
    } catch (error: any) {
      console.error("Error updating food:", error);
      toast({ title: "Error updating food", description: error.message, variant: "destructive" });
    }
  };

  const deleteFood = async (id: string) => {
    try {
      const { error } = await supabase.from("nutrition_logs").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Food unlogged", description: "Item removed from your log." });
      await fetchTodaysIntake();
    } catch (error: any) {
      console.error("Error deleting food:", error);
      toast({ title: "Error removing food", description: error.message, variant: "destructive" });
    }
  };

  const filteredFoods = foodDatabase.filter(f => 
    f.food_name.toLowerCase().includes(searchFood.toLowerCase())
  );

  const macroInfo = [
    { name: "Calories", icon: Flame, current: currentIntake.calories, goal: plan.dailyGoals.calories, unit: "kcal", color: "text-primary" },
    { name: "Protein", icon: Beef, current: currentIntake.protein, goal: plan.dailyGoals.protein, unit: "g", color: "text-blue-400" },
    { name: "Carbs", icon: Wheat, current: currentIntake.carbs, goal: plan.dailyGoals.carbs, unit: "g", color: "text-yellow-400" },
    { name: "Fat", icon: Droplet, current: currentIntake.fat, goal: plan.dailyGoals.fat, unit: "g", color: "text-purple-400" },
  ];

  const getMicroStatus = (current: number, rda: number) => {
    const percent = (current / rda) * 100;
    if (percent < 50) return { status: "deficient", color: "text-red-400", bg: "bg-red-500" };
    if (percent < 80) return { status: "low", color: "text-yellow-400", bg: "bg-yellow-500" };
    if (percent <= 150) return { status: "optimal", color: "text-green-400", bg: "bg-green-500" };
    return { status: "excess", color: "text-orange-400", bg: "bg-orange-500" };
  };

  const groupedLogs = todaysLogs.reduce((acc, log) => {
    const type = log.meal_type || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(log);
    return acc;
  }, {} as Record<string, FoodItem[]>);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">AI Nutritionist</h1>
            <p className="text-muted-foreground">
              {bmiInfo.bmi ? `Personalized for BMI ${bmiInfo.bmi} (${bmiInfo.category})` : "Complete your profile for personalized plans"}
            </p>
          </div>
          <div className="flex gap-3">
            <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Log Food
                </Button>
              </DialogTrigger>
              <DialogContent className="glass max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display">Log Food</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Meal Type</Label>
                    <Select value={selectedMealType} onValueChange={setSelectedMealType}>
                      <SelectTrigger className="h-12 bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">🌅 Breakfast</SelectItem>
                        <SelectItem value="lunch">☀️ Lunch</SelectItem>
                        <SelectItem value="dinner">🌙 Dinner</SelectItem>
                        <SelectItem value="snacks">🍎 Snacks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full">
                      <TabsTrigger value="search" className="flex-1">Search Food</TabsTrigger>
                      <TabsTrigger value="custom" className="flex-1">Custom Entry</TabsTrigger>
                    </TabsList>

                    <TabsContent value="search" className="space-y-4 mt-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search foods..."
                          className="h-12 pl-10 bg-secondary border-border"
                          value={searchFood}
                          onChange={(e) => setSearchFood(e.target.value)}
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {filteredFoods.map((food) => (
                          <button
                            key={food.food_name}
                            onClick={() => setSelectedFood(food)}
                            className={cn(
                              "w-full p-3 rounded-lg text-left transition-all flex justify-between items-center",
                              selectedFood?.food_name === food.food_name
                                ? "bg-primary/20 border border-primary"
                                : "bg-secondary hover:bg-secondary/80"
                            )}
                          >
                            <span className="text-sm font-medium">{food.food_name}</span>
                            <span className="text-xs text-muted-foreground">{food.calories} cal</span>
                          </button>
                        ))}
                      </div>

                      {selectedFood && (
                        <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
                          <p className="font-medium">{selectedFood.food_name}</p>
                          <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                            <span>{selectedFood.calories} cal</span>
                            <span>{selectedFood.protein}g P</span>
                            <span>{selectedFood.carbs}g C</span>
                            <span>{selectedFood.fats}g F</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Label className="whitespace-nowrap">Quantity:</Label>
                            <Input
                              type="number"
                              min={0.5}
                              step={0.5}
                              value={quantity}
                              onChange={(e) => setQuantity(Number(e.target.value))}
                              className="w-20 h-10 bg-secondary"
                            />
                            <span className="text-sm text-muted-foreground">{selectedFood.unit}</span>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="custom" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <Label>Food Name</Label>
                          <Input
                            placeholder="e.g., Homemade Salad"
                            className="h-10 bg-secondary"
                            value={customFood.food_name || ""}
                            onChange={(e) => setCustomFood({ ...customFood, food_name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Calories</Label>
                          <Input
                            type="number"
                            className="h-10 bg-secondary"
                            value={customFood.calories || ""}
                            onChange={(e) => setCustomFood({ ...customFood, calories: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label>Protein (g)</Label>
                          <Input
                            type="number"
                            className="h-10 bg-secondary"
                            value={customFood.protein || ""}
                            onChange={(e) => setCustomFood({ ...customFood, protein: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label>Carbs (g)</Label>
                          <Input
                            type="number"
                            className="h-10 bg-secondary"
                            value={customFood.carbs || ""}
                            onChange={(e) => setCustomFood({ ...customFood, carbs: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label>Fat (g)</Label>
                          <Input
                            type="number"
                            className="h-10 bg-secondary"
                            value={customFood.fats || ""}
                            onChange={(e) => setCustomFood({ ...customFood, fats: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Button variant="hero" className="w-full" onClick={logFood}>
                    Add to Log
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="hero" className="gap-2" onClick={() => generatePlan()} disabled={isGenerating || isLoading}>
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
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
              <Progress value={Math.min((macro.current / macro.goal) * 100, 100)} className="h-2 bg-secondary" />
            </div>
          ))}
        </div>

        {/* Micronutrient Tracker */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display text-xl font-semibold mb-4">Micronutrient Tracker</h3>
          <p className="text-sm text-muted-foreground mb-6">Daily intake based on Recommended Daily Allowance (RDA)</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(micronutrientRDA).map(([key, rda]) => {
              const current = micronutrients[key as keyof typeof micronutrients];
              const status = getMicroStatus(current, rda.value);
              const percent = Math.min((current / rda.value) * 100, 100);
              
              return (
                <div key={key} className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium capitalize">{key.replace("_", " ")}</span>
                    <span className={cn("text-xs font-medium capitalize", status.color)}>{status.status}</span>
                  </div>
                  <p className="text-lg font-bold mb-2">
                    {current.toFixed(1)} <span className="text-xs text-muted-foreground font-normal">/ {rda.value} {rda.unit}</span>
                  </p>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", status.bg)} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Food Log */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display text-xl font-semibold mb-6">Today's Food Log</h3>
          
          {todaysLogs.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No food logged today. Start by adding your meals!</p>
          ) : (
            <div className="space-y-6">
              {["breakfast", "lunch", "dinner", "snacks"].map((mealType) => {
                const logs = groupedLogs[mealType] || [];
                if (logs.length === 0) return null;
                
                const mealCalories = logs.reduce((sum, l) => sum + (l.calories || 0), 0);
                
                return (
                  <div key={mealType}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium capitalize flex items-center gap-2">
                        {mealType === "breakfast" && "🌅"}
                        {mealType === "lunch" && "☀️"}
                        {mealType === "dinner" && "🌙"}
                        {mealType === "snacks" && "🍎"}
                        {mealType}
                      </h4>
                      <span className="text-sm text-primary font-medium">{mealCalories} cal</span>
                    </div>
                    <div className="space-y-2">
                      {logs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 group">
                          <div className="flex items-center gap-3">
                            <Apple className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <span className="text-sm">{log.food_name}</span>
                              <span className="text-xs text-muted-foreground ml-2">x{log.quantity}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{log.calories} cal</span>
                              <span>{log.protein}g P</span>
                              <span>{log.carbs}g C</span>
                              <span>{log.fats}g F</span>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setEditingFood(log);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => log.id && deleteFood(log.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Edit Food Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle className="font-display">Edit Food</DialogTitle>
            </DialogHeader>
            {editingFood && (
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Food Name</Label>
                  <Input
                    value={editingFood.food_name}
                    onChange={(e) => setEditingFood({ ...editingFood, food_name: e.target.value })}
                    className="h-10 bg-secondary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={editingFood.quantity}
                      onChange={(e) => setEditingFood({ ...editingFood, quantity: Number(e.target.value) })}
                      className="h-10 bg-secondary"
                    />
                  </div>
                  <div>
                    <Label>Calories</Label>
                    <Input
                      type="number"
                      value={editingFood.calories}
                      onChange={(e) => setEditingFood({ ...editingFood, calories: Number(e.target.value) })}
                      className="h-10 bg-secondary"
                    />
                  </div>
                </div>
                <div>
                  <Label>Meal Type</Label>
                  <Select value={editingFood.meal_type} onValueChange={(v) => setEditingFood({ ...editingFood, meal_type: v })}>
                    <SelectTrigger className="h-10 bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snacks">Snacks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="hero" className="w-full" onClick={updateFood}>
                  Save Changes
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* AI Meal Plan */}
        {plan.mealPlan.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-xl font-semibold">AI Meal Suggestions</h3>
                <p className="text-sm text-muted-foreground">Based on your BMI, age, and goals</p>
              </div>
            </div>
            <div className="space-y-4">
              {plan.mealPlan.map((meal, mealIndex) => (
                <div key={meal.meal} className="p-5 rounded-xl border bg-secondary/50 border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Utensils className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">{meal.meal}</p>
                        <p className="text-sm text-muted-foreground">{meal.time}</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-primary">
                      {meal.items.reduce((sum, item) => sum + item.calories, 0)} cal
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {meal.items.map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
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
        )}

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
