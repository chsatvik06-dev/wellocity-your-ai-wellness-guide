import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Activity, TrendingDown, TrendingUp, Scale, Ruler, Target, Plus, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { label: "Underweight", color: "text-yellow-400", advice: "Consider increasing calorie intake with nutrient-dense foods." };
  if (bmi < 25) return { label: "Normal", color: "text-green-400", advice: "Great job! Maintain your healthy lifestyle." };
  if (bmi < 30) return { label: "Overweight", color: "text-orange-400", advice: "Focus on balanced nutrition and regular exercise." };
  return { label: "Obese", color: "text-red-400", advice: "Consult with a healthcare provider for personalized guidance." };
};

interface WeightEntry {
  date: string;
  weight: number;
}

export default function Health() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Editable height/weight inputs
  const [heightInput, setHeightInput] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [targetWeightInput, setTargetWeightInput] = useState("");
  
  // Calculated values
  const [height, setHeight] = useState<number | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [targetWeight, setTargetWeight] = useState<number>(68);
  
  const [newWeight, setNewWeight] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startWeight, setStartWeight] = useState<number | null>(null);

  // Fetch profile and weight history
  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setIsLoading(true);

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("height, weight")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        if (profile.height) {
          setHeight(Number(profile.height));
          setHeightInput(String(profile.height));
        }
        if (profile.weight) {
          setWeight(Number(profile.weight));
          setWeightInput(String(profile.weight));
        }
      }

      // Fetch weight history
      const { data: history } = await supabase
        .from("weight_history")
        .select("weight, recorded_at")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: true })
        .limit(20);

      if (history && history.length > 0) {
        const formattedHistory = history.map((entry) => ({
          date: new Date(entry.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          weight: Number(entry.weight),
        }));
        setWeightHistory(formattedHistory);
        setStartWeight(formattedHistory[0].weight);
        // Set current weight to latest
        const latestWeight = formattedHistory[formattedHistory.length - 1].weight;
        setWeight(latestWeight);
        setWeightInput(String(latestWeight));
      }

      setIsLoading(false);
    }
    fetchData();
  }, [user]);

  const bmi = height && weight ? weight / Math.pow(height / 100, 2) : null;
  const bmiCategory = bmi ? getBMICategory(bmi) : null;
  const weightToLose = weight && targetWeight ? weight - targetWeight : 0;
  const progress = startWeight && weight && targetWeight 
    ? ((startWeight - weight) / (startWeight - targetWeight)) * 100 
    : 0;
  const weightLostSoFar = startWeight && weight ? startWeight - weight : 0;

  const handleLogWeight = async () => {
    if (!newWeight || !user) return;
    
    const weightValue = parseFloat(newWeight);
    
    // Save to weight_history
    const { error } = await supabase
      .from("weight_history")
      .insert({
        user_id: user.id,
        weight: weightValue,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to log weight. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Update profile weight
    await supabase
      .from("profiles")
      .update({ weight: weightValue })
      .eq("user_id", user.id);

    setWeight(weightValue);
    setWeightInput(String(weightValue));
    
    // Add to history
    const newEntry = {
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      weight: weightValue,
    };
    setWeightHistory((prev) => [...prev, newEntry]);
    
    toast({
      title: "Weight logged!",
      description: `Your new weight of ${newWeight} kg has been recorded.`,
    });
    setNewWeight("");
    setIsDialogOpen(false);
  };

  const handleUpdateSettings = async () => {
    if (!user) return;

    const newHeight = parseFloat(heightInput);
    const newWeightVal = parseFloat(weightInput);
    const newTarget = parseFloat(targetWeightInput) || targetWeight;

    if (isNaN(newHeight) || isNaN(newWeightVal)) {
      toast({
        title: "Invalid input",
        description: "Please enter valid numbers for height and weight.",
        variant: "destructive",
      });
      return;
    }

    // Update profile
    const { error } = await supabase
      .from("profiles")
      .update({ height: newHeight, weight: newWeightVal })
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update settings.",
        variant: "destructive",
      });
      return;
    }

    setHeight(newHeight);
    setWeight(newWeightVal);
    setTargetWeight(newTarget);

    toast({
      title: "Settings updated!",
      description: "Your height, weight, and target have been updated.",
    });
    setIsSettingsOpen(false);
  };

  const handleReset = () => {
    setHeightInput("");
    setWeightInput("");
    setTargetWeightInput("");
    setHeight(null);
    setWeight(null);
    setIsSettingsOpen(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // If no height/weight set, show setup form
  if (!height || !weight) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">BMI & Health Metrics</h1>
            <p className="text-muted-foreground">Set up your health profile to get started</p>
          </div>

          <div className="glass rounded-2xl p-8 max-w-md mx-auto">
            <h3 className="font-display text-xl font-semibold mb-6">Enter Your Measurements</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="setup-height">Height (cm)</Label>
                <Input
                  id="setup-height"
                  type="number"
                  placeholder="170"
                  className="h-12 bg-secondary border-border"
                  value={heightInput}
                  onChange={(e) => setHeightInput(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-weight">Current Weight (kg)</Label>
                <Input
                  id="setup-weight"
                  type="number"
                  step="0.1"
                  placeholder="70"
                  className="h-12 bg-secondary border-border"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-target">Target Weight (kg)</Label>
                <Input
                  id="setup-target"
                  type="number"
                  step="0.1"
                  placeholder="65"
                  className="h-12 bg-secondary border-border"
                  value={targetWeightInput}
                  onChange={(e) => setTargetWeightInput(e.target.value)}
                />
              </div>
              <Button variant="hero" className="w-full" onClick={handleUpdateSettings}>
                Calculate BMI
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">BMI & Health Metrics</h1>
            <p className="text-muted-foreground">Track your weight and body composition</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Update Metrics
                </Button>
              </DialogTrigger>
              <DialogContent className="glass">
                <DialogHeader>
                  <DialogTitle className="font-display">Update Your Measurements</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-height">Height (cm)</Label>
                    <Input
                      id="edit-height"
                      type="number"
                      placeholder="170"
                      className="h-12 bg-secondary border-border"
                      value={heightInput}
                      onChange={(e) => setHeightInput(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-weight">Current Weight (kg)</Label>
                    <Input
                      id="edit-weight"
                      type="number"
                      step="0.1"
                      placeholder="70"
                      className="h-12 bg-secondary border-border"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-target">Target Weight (kg)</Label>
                    <Input
                      id="edit-target"
                      type="number"
                      step="0.1"
                      placeholder="65"
                      className="h-12 bg-secondary border-border"
                      value={targetWeightInput || String(targetWeight)}
                      onChange={(e) => setTargetWeightInput(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={handleReset}>
                      Reset All
                    </Button>
                    <Button variant="hero" className="flex-1" onClick={handleUpdateSettings}>
                      Recalculate BMI
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Log Weight
                </Button>
              </DialogTrigger>
              <DialogContent className="glass">
                <DialogHeader>
                  <DialogTitle className="font-display">Log Your Weight</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="log-weight">Weight (kg)</Label>
                    <Input
                      id="log-weight"
                      type="number"
                      step="0.1"
                      placeholder="70.5"
                      className="h-12 bg-secondary border-border"
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                    />
                  </div>
                  <Button variant="hero" className="w-full" onClick={handleLogWeight}>
                    Save Weight
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* BMI Card */}
        <div className="glass rounded-2xl p-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* BMI Display */}
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-muted-foreground mb-2">Your BMI</p>
              <div className="relative w-48 h-48 mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="none"
                    stroke="hsl(0, 0%, 15%)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="none"
                    stroke="hsl(0, 85%, 50%)"
                    strokeWidth="12"
                    strokeDasharray={`${((bmi || 0) / 40) * 553} 553`}
                    strokeLinecap="round"
                    className="glow-sm"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-display font-bold">{bmi?.toFixed(1) || "—"}</span>
                  <span className={cn("text-lg font-medium", bmiCategory?.color)}>{bmiCategory?.label || "—"}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">{bmiCategory?.advice}</p>
            </div>

            {/* Metrics */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Ruler className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Height</span>
                  </div>
                  <p className="text-2xl font-display font-bold">{height} cm</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Weight</span>
                  </div>
                  <p className="text-2xl font-display font-bold">{weight} kg</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Goal Progress</span>
                  </div>
                  <span className="text-sm font-medium">{Math.max(0, Math.min(progress, 100)).toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500 glow-sm"
                    style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Current: {weight} kg</span>
                  <span>Target: {targetWeight} kg</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-muted-foreground">To Lose</span>
                  </div>
                  <p className="text-2xl font-display font-bold">{weightToLose.toFixed(1)} kg</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Lost So Far</span>
                  </div>
                  <p className="text-2xl font-display font-bold">{Math.max(0, weightLostSoFar).toFixed(1)} kg</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weight History Chart */}
        {weightHistory.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-xl font-semibold">Weight History</h3>
                <p className="text-sm text-muted-foreground">Your progress over time</p>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightHistory}>
                  <defs>
                    <linearGradient id="weightHistoryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 85%, 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(0, 85%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(0, 0%, 60%)', fontSize: 12 }}
                  />
                  <YAxis
                    domain={['dataMin - 2', 'dataMax + 2']}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(0, 0%, 60%)', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 7%)',
                      border: '1px solid hsl(0, 0%, 18%)',
                      borderRadius: '8px',
                      color: 'hsl(0, 0%, 95%)',
                    }}
                  />
                  <ReferenceLine
                    y={targetWeight}
                    stroke="hsl(120, 60%, 50%)"
                    strokeDasharray="5 5"
                    label={{ value: 'Goal', fill: 'hsl(120, 60%, 50%)', fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(0, 85%, 50%)"
                    strokeWidth={2}
                    fill="url(#weightHistoryGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* BMI Categories Reference */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display text-xl font-semibold mb-4">BMI Categories</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { range: "< 18.5", label: "Underweight", color: "bg-yellow-500/20 border-yellow-500/50 text-yellow-400" },
              { range: "18.5 - 24.9", label: "Normal", color: "bg-green-500/20 border-green-500/50 text-green-400" },
              { range: "25 - 29.9", label: "Overweight", color: "bg-orange-500/20 border-orange-500/50 text-orange-400" },
              { range: "≥ 30", label: "Obese", color: "bg-red-500/20 border-red-500/50 text-red-400" },
            ].map((cat) => (
              <div key={cat.label} className={cn("p-4 rounded-xl border", cat.color)}>
                <p className="font-display font-bold text-lg">{cat.range}</p>
                <p className="text-sm opacity-80">{cat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
