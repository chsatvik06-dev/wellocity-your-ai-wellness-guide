import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Calendar, Droplet, Heart, Moon, Sun, Sparkles, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const cyclePhases = [
  { name: "Menstrual", days: "Days 1-5", color: "bg-red-500", description: "Focus on rest and iron-rich foods" },
  { name: "Follicular", days: "Days 6-14", color: "bg-pink-400", description: "Energy increases - great for intense workouts" },
  { name: "Ovulation", days: "Days 14-16", color: "bg-orange-400", description: "Peak energy - ideal for strength training" },
  { name: "Luteal", days: "Days 17-28", color: "bg-purple-400", description: "Gradual wind-down - focus on recovery" },
];

const symptoms = [
  { id: "cramps", label: "Cramps", icon: "😣" },
  { id: "bloating", label: "Bloating", icon: "🎈" },
  { id: "fatigue", label: "Fatigue", icon: "😴" },
  { id: "headache", label: "Headache", icon: "🤕" },
  { id: "mood", label: "Mood swings", icon: "😤" },
  { id: "cravings", label: "Cravings", icon: "🍫" },
];

const calendarDays = Array.from({ length: 35 }, (_, i) => {
  const day = i - 3; // Start from previous month
  const isCurrentMonth = day > 0 && day <= 31;
  const isCycleDay = day >= 1 && day <= 5;
  const isOvulation = day >= 14 && day <= 16;
  const isToday = day === 12;
  return { day: isCurrentMonth ? day : null, isCycleDay, isOvulation, isToday };
});

export default function PeriodTracker() {
  const { toast } = useToast();
  const [currentPhase] = useState(1); // Follicular phase
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleLogSymptoms = () => {
    toast({
      title: "Symptoms logged!",
      description: "Your symptoms have been recorded for today.",
    });
    setIsDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Period & Cycle Tracker</h1>
            <p className="text-muted-foreground">Track your cycle and get personalized recommendations</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" className="gap-2">
                <Plus className="w-4 h-4" />
                Log Symptoms
              </Button>
            </DialogTrigger>
            <DialogContent className="glass">
              <DialogHeader>
                <DialogTitle className="font-display">Log Today's Symptoms</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-3 gap-3">
                  {symptoms.map((symptom) => (
                    <button
                      key={symptom.id}
                      onClick={() => toggleSymptom(symptom.id)}
                      className={cn(
                        "p-4 rounded-xl border transition-all duration-200 flex flex-col items-center gap-2",
                        selectedSymptoms.includes(symptom.id)
                          ? "bg-primary/20 border-primary"
                          : "bg-secondary border-border hover:border-primary/50"
                      )}
                    >
                      <span className="text-2xl">{symptom.icon}</span>
                      <span className="text-xs font-medium">{symptom.label}</span>
                    </button>
                  ))}
                </div>
                <Button variant="hero" className="w-full" onClick={handleLogSymptoms}>
                  Save Symptoms
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Current Phase Card */}
        <div className="glass rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">Current Phase</p>
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("w-4 h-4 rounded-full", cyclePhases[currentPhase].color)} />
                <h2 className="font-display text-3xl font-bold">{cyclePhases[currentPhase].name}</h2>
              </div>
              <p className="text-muted-foreground mb-4">{cyclePhases[currentPhase].description}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Day 10 of cycle
                </span>
                <span className="flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-primary" />
                  Next period in 18 days
                </span>
              </div>
            </div>

            {/* Phase Progress */}
            <div className="flex gap-2">
              {cyclePhases.map((phase, index) => (
                <div
                  key={phase.name}
                  className={cn(
                    "w-16 h-24 rounded-xl flex flex-col items-center justify-center transition-all",
                    index === currentPhase
                      ? "bg-primary/20 border-2 border-primary"
                      : "bg-secondary/50 border border-border"
                  )}
                >
                  <div className={cn("w-3 h-3 rounded-full mb-2", phase.color)} />
                  <span className="text-xs text-center font-medium">{phase.name.slice(0, 4)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar & Insights */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl font-semibold">December 2024</h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                <div key={day} className="text-center text-xs text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={cn(
                    "aspect-square rounded-lg flex items-center justify-center text-sm transition-all",
                    day.day === null && "opacity-30",
                    day.isToday && "ring-2 ring-primary",
                    day.isCycleDay && "bg-red-500/30 text-red-300",
                    day.isOvulation && "bg-orange-500/30 text-orange-300",
                    !day.isCycleDay && !day.isOvulation && day.day && "hover:bg-secondary cursor-pointer"
                  )}
                >
                  {day.day}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <span className="text-xs text-muted-foreground">Period</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500/50" />
                <span className="text-xs text-muted-foreground">Ovulation</span>
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold">Phase-Based Recommendations</h3>
                <p className="text-sm text-muted-foreground">Tailored for your follicular phase</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="w-4 h-4 text-yellow-400" />
                  <span className="font-medium text-sm">Energy Boost</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your energy is rising! Great time for high-intensity workouts and trying new activities.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Nutrition Focus</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Increase protein intake to support muscle building. Add leafy greens for iron replenishment.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="w-4 h-4 text-purple-400" />
                  <span className="font-medium text-sm">Mood & Sleep</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Estrogen is rising - you may feel more social and creative. Optimize sleep with magnesium-rich foods.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Symptoms */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display text-xl font-semibold mb-4">Recent Symptom Log</h3>
          <div className="space-y-3">
            {[
              { date: "Dec 10", symptoms: ["Fatigue", "Mild cramps"] },
              { date: "Dec 9", symptoms: ["Headache", "Cravings"] },
              { date: "Dec 8", symptoms: ["Bloating"] },
            ].map((entry) => (
              <div key={entry.date} className="p-4 rounded-xl bg-secondary/50 flex items-center justify-between">
                <span className="text-sm font-medium">{entry.date}</span>
                <div className="flex gap-2">
                  {entry.symptoms.map((symptom) => (
                    <span
                      key={symptom}
                      className="px-3 py-1 rounded-full text-xs bg-primary/20 text-primary"
                    >
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
