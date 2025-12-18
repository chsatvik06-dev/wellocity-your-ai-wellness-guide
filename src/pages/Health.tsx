import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Activity, TrendingDown, TrendingUp, Scale, Ruler, Target, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from "recharts";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const weightHistory = [
  { date: "Jan 1", weight: 75 },
  { date: "Jan 8", weight: 74.5 },
  { date: "Jan 15", weight: 74.2 },
  { date: "Jan 22", weight: 73.8 },
  { date: "Jan 29", weight: 73.5 },
  { date: "Feb 5", weight: 73 },
  { date: "Feb 12", weight: 72.5 },
  { date: "Feb 19", weight: 72 },
  { date: "Feb 26", weight: 71.5 },
  { date: "Mar 5", weight: 71 },
  { date: "Mar 12", weight: 70.8 },
];

const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { label: "Underweight", color: "text-yellow-400", advice: "Consider increasing calorie intake with nutrient-dense foods." };
  if (bmi < 25) return { label: "Normal", color: "text-green-400", advice: "Great job! Maintain your healthy lifestyle." };
  if (bmi < 30) return { label: "Overweight", color: "text-orange-400", advice: "Focus on balanced nutrition and regular exercise." };
  return { label: "Obese", color: "text-red-400", advice: "Consult with a healthcare provider for personalized guidance." };
};

export default function Health() {
  const { toast } = useToast();
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70.8);
  const [targetWeight, setTargetWeight] = useState(68);
  const [newWeight, setNewWeight] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const bmi = weight / Math.pow(height / 100, 2);
  const bmiCategory = getBMICategory(bmi);
  const weightToLose = weight - targetWeight;
  const progress = ((75 - weight) / (75 - targetWeight)) * 100;

  const handleLogWeight = () => {
    if (newWeight) {
      setWeight(parseFloat(newWeight));
      toast({
        title: "Weight logged!",
        description: `Your new weight of ${newWeight} kg has been recorded.`,
      });
      setNewWeight("");
      setIsDialogOpen(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">BMI & Health Metrics</h1>
            <p className="text-muted-foreground">Track your weight and body composition</p>
          </div>
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
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
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
                    strokeDasharray={`${(bmi / 40) * 553} 553`}
                    strokeLinecap="round"
                    className="glow-sm"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-display font-bold">{bmi.toFixed(1)}</span>
                  <span className={cn("text-lg font-medium", bmiCategory.color)}>{bmiCategory.label}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">{bmiCategory.advice}</p>
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
                  <span className="text-sm font-medium">{Math.min(progress, 100).toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500 glow-sm"
                    style={{ width: `${Math.min(progress, 100)}%` }}
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
                  <p className="text-2xl font-display font-bold">4.2 kg</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weight History Chart */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-xl font-semibold">Weight History</h3>
              <p className="text-sm text-muted-foreground">Your progress over the past 3 months</p>
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
