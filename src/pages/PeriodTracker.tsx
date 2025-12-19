import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Calendar, Droplet, Heart, Moon, Sun, Sparkles, Plus, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, differenceInDays, addDays, isSameDay } from "date-fns";

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

interface MenstrualCycle {
  id: string;
  start_date: string;
  end_date: string | null;
  cycle_length: number | null;
  symptoms: string[] | null;
  notes: string | null;
}

export default function PeriodTracker() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStartPeriodOpen, setIsStartPeriodOpen] = useState(false);
  const [cycles, setCycles] = useState<MenstrualCycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCycles();
    }
  }, [user]);

  const fetchCycles = async () => {
    try {
      const { data, error } = await supabase
        .from("menstrual_cycles")
        .select("*")
        .eq("user_id", user?.id)
        .order("start_date", { ascending: false });

      if (error) throw error;
      setCycles(data || []);
    } catch (error) {
      console.error("Error fetching cycles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentCycle = () => {
    const today = new Date();
    return cycles.find(cycle => {
      const startDate = new Date(cycle.start_date);
      const endDate = cycle.end_date ? new Date(cycle.end_date) : addDays(startDate, cycle.cycle_length || 28);
      return today >= startDate && today <= endDate;
    });
  };

  const getActivePeriod = () => {
    return cycles.find(cycle => !cycle.end_date);
  };

  const getCurrentPhase = () => {
    const currentCycle = getCurrentCycle();
    if (!currentCycle) return 0;
    
    const today = new Date();
    const startDate = new Date(currentCycle.start_date);
    const dayOfCycle = differenceInDays(today, startDate) + 1;
    
    if (dayOfCycle <= 5) return 0; // Menstrual
    if (dayOfCycle <= 13) return 1; // Follicular
    if (dayOfCycle <= 16) return 2; // Ovulation
    return 3; // Luteal
  };

  const getDayOfCycle = () => {
    const currentCycle = getCurrentCycle();
    if (!currentCycle) return null;
    
    const today = new Date();
    const startDate = new Date(currentCycle.start_date);
    return differenceInDays(today, startDate) + 1;
  };

  const getNextPeriodDays = () => {
    if (cycles.length === 0) return null;
    
    const lastCycle = cycles[0];
    const avgCycleLength = lastCycle.cycle_length || 28;
    const lastStartDate = new Date(lastCycle.start_date);
    const nextPeriodDate = addDays(lastStartDate, avgCycleLength);
    const daysUntil = differenceInDays(nextPeriodDate, new Date());
    
    return daysUntil > 0 ? daysUntil : null;
  };

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleLogSymptoms = async () => {
    const activePeriod = getActivePeriod();
    if (!activePeriod) {
      toast({
        title: "No active period",
        description: "Start a new period first to log symptoms.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("menstrual_cycles")
        .update({
          symptoms: selectedSymptoms,
          notes: notes || null,
        })
        .eq("id", activePeriod.id);

      if (error) throw error;

      toast({
        title: "Symptoms logged!",
        description: "Your symptoms have been recorded.",
      });
      setIsDialogOpen(false);
      setSelectedSymptoms([]);
      setNotes("");
      fetchCycles();
    } catch (error: any) {
      console.error("Error logging symptoms:", error);
      toast({
        title: "Error logging symptoms",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartPeriod = async () => {
    setIsSubmitting(true);
    try {
      // Calculate cycle length from previous cycles
      let cycleLength = 28;
      if (cycles.length > 0 && cycles[0].end_date) {
        const lastStart = new Date(cycles[0].start_date);
        cycleLength = differenceInDays(new Date(), lastStart);
      }

      const { error } = await supabase.from("menstrual_cycles").insert({
        user_id: user?.id,
        start_date: format(new Date(), "yyyy-MM-dd"),
        cycle_length: cycleLength,
      });

      if (error) throw error;

      toast({
        title: "Period started!",
        description: "Your new cycle has been recorded.",
      });
      setIsStartPeriodOpen(false);
      fetchCycles();
    } catch (error: any) {
      console.error("Error starting period:", error);
      toast({
        title: "Error starting period",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndPeriod = async () => {
    const activePeriod = getActivePeriod();
    if (!activePeriod) return;

    setIsSubmitting(true);
    try {
      const startDate = new Date(activePeriod.start_date);
      const periodLength = differenceInDays(new Date(), startDate) + 1;

      const { error } = await supabase
        .from("menstrual_cycles")
        .update({
          end_date: format(new Date(), "yyyy-MM-dd"),
        })
        .eq("id", activePeriod.id);

      if (error) throw error;

      toast({
        title: "Period ended!",
        description: `Your period lasted ${periodLength} days.`,
      });
      fetchCycles();
    } catch (error: any) {
      console.error("Error ending period:", error);
      toast({
        title: "Error ending period",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const currentPhase = getCurrentPhase();
  const dayOfCycle = getDayOfCycle();
  const nextPeriodDays = getNextPeriodDays();
  const activePeriod = getActivePeriod();

  const isDayInPeriod = (date: Date) => {
    return cycles.some(cycle => {
      const startDate = new Date(cycle.start_date);
      const endDate = cycle.end_date 
        ? new Date(cycle.end_date) 
        : (cycle === getActivePeriod() ? new Date() : addDays(startDate, 5));
      return date >= startDate && date <= endDate;
    });
  };

  const isDayOvulation = (date: Date) => {
    return cycles.some(cycle => {
      const startDate = new Date(cycle.start_date);
      const ovulationStart = addDays(startDate, 13);
      const ovulationEnd = addDays(startDate, 16);
      return date >= ovulationStart && date <= ovulationEnd;
    });
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
          <div className="flex gap-3">
            {activePeriod ? (
              <Button variant="outline" onClick={handleEndPeriod} disabled={isSubmitting}>
                End Period
              </Button>
            ) : (
              <Dialog open={isStartPeriodOpen} onOpenChange={setIsStartPeriodOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Droplet className="w-4 h-4" />
                    Start Period
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass">
                  <DialogHeader>
                    <DialogTitle className="font-display">Start New Period</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p className="text-muted-foreground">
                      This will start a new menstrual cycle from today.
                    </p>
                    <Button variant="hero" className="w-full" onClick={handleStartPeriod} disabled={isSubmitting}>
                      {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                      Confirm Start Period
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
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
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Notes (optional)</label>
                    <Textarea
                      placeholder="How are you feeling today?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <Button variant="hero" className="w-full" onClick={handleLogSymptoms} disabled={isSubmitting}>
                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Symptoms
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
                {dayOfCycle && (
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Day {dayOfCycle} of cycle
                  </span>
                )}
                {nextPeriodDays && (
                  <span className="flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-primary" />
                    Next period in {nextPeriodDays} days
                  </span>
                )}
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
              <h3 className="font-display text-xl font-semibold">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                <div key={`${day}-${i}`} className="text-center text-xs text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {daysInMonth.map((day) => {
                const isPeriod = isDayInPeriod(day);
                const isOvulation = isDayOvulation(day);
                const isTodayDate = isToday(day);
                
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "aspect-square rounded-lg flex items-center justify-center text-sm transition-all",
                      isTodayDate && "ring-2 ring-primary",
                      isPeriod && "bg-red-500/30 text-red-300",
                      isOvulation && !isPeriod && "bg-orange-500/30 text-orange-300",
                      !isPeriod && !isOvulation && "hover:bg-secondary cursor-pointer"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                );
              })}
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
                <p className="text-sm text-muted-foreground">Tailored for your {cyclePhases[currentPhase].name.toLowerCase()} phase</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="w-4 h-4 text-yellow-400" />
                  <span className="font-medium text-sm">Energy Level</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentPhase === 0 && "Rest is important now. Light stretching or yoga is ideal."}
                  {currentPhase === 1 && "Your energy is rising! Great time for high-intensity workouts."}
                  {currentPhase === 2 && "Peak energy - perfect for strength training and challenging workouts."}
                  {currentPhase === 3 && "Energy may fluctuate. Focus on moderate exercise and self-care."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Nutrition Focus</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentPhase === 0 && "Increase iron-rich foods like spinach, legumes, and lean red meat."}
                  {currentPhase === 1 && "Focus on protein for muscle building. Add leafy greens for iron."}
                  {currentPhase === 2 && "Balance all macros. Include omega-3 rich foods like salmon."}
                  {currentPhase === 3 && "Complex carbs can help with cravings. Magnesium-rich foods help with PMS."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="w-4 h-4 text-purple-400" />
                  <span className="font-medium text-sm">Mood & Sleep</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentPhase === 0 && "Prioritize rest. Gentle activities like reading can be soothing."}
                  {currentPhase === 1 && "You may feel more social and creative. Great time for new projects."}
                  {currentPhase === 2 && "Confidence peaks. Social activities and important meetings work well."}
                  {currentPhase === 3 && "Practice self-care. Journaling and relaxation techniques help."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Symptom Log */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display text-xl font-semibold mb-4">Recent Cycles</h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : cycles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No cycles recorded yet. Start tracking your period!
            </p>
          ) : (
            <div className="space-y-3">
              {cycles.slice(0, 5).map((cycle) => (
                <div key={cycle.id} className="p-4 rounded-xl bg-secondary/50 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">
                      {format(new Date(cycle.start_date), "MMM d, yyyy")}
                      {cycle.end_date && ` - ${format(new Date(cycle.end_date), "MMM d, yyyy")}`}
                      {!cycle.end_date && " (ongoing)"}
                    </span>
                    {cycle.cycle_length && (
                      <p className="text-xs text-muted-foreground">Cycle length: {cycle.cycle_length} days</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {(cycle.symptoms || []).map((symptom) => {
                      const symptomInfo = symptoms.find(s => s.id === symptom);
                      return symptomInfo ? (
                        <span
                          key={symptom}
                          className="px-3 py-1 rounded-full text-xs bg-primary/20 text-primary"
                          title={symptomInfo.label}
                        >
                          {symptomInfo.icon}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
