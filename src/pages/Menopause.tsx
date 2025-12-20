import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Heart, Flame, Moon, Brain, Sparkles, Apple, Dumbbell, Plus, Send, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const menopausePhases = [
  { name: "Perimenopause", description: "Transition begins, cycles may become irregular", value: "perimenopause" },
  { name: "Menopause", description: "12 months without a period", value: "menopause" },
  { name: "Postmenopause", description: "New chapter of wellness", value: "postmenopause" },
];

interface Symptom {
  name: string;
  severity: "none" | "mild" | "moderate" | "severe";
  icon: React.ComponentType<{ className?: string }>;
}

const defaultSymptoms: Symptom[] = [
  { name: "Hot Flashes", severity: "none", icon: Flame },
  { name: "Sleep Issues", severity: "none", icon: Moon },
  { name: "Mood Changes", severity: "none", icon: Brain },
  { name: "Weight Changes", severity: "none", icon: Heart },
];

interface MenopauseProfile {
  id?: string;
  stage: string;
  age: number | null;
  gender: string;
  symptoms: string[];
  hot_flash_severity: string;
  bone_density_concern: boolean;
  fatigue_level: string;
}

interface MenopauseRecommendations {
  diet: { focus: string; foods: string[]; avoid: string[]; supplements: string[] };
  workout: { types: string[]; frequency: string; boneHealth: string[]; tips: string[] };
  symptomRelief: { hotFlashes: string[]; sleep: string[]; mood: string[] };
  lifestyle: { stress: string[]; social: string[] };
}

export default function Menopause() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [profile, setProfile] = useState<MenopauseProfile>({
    stage: "perimenopause",
    age: null,
    gender: "female",
    symptoms: [],
    hot_flash_severity: "none",
    bone_density_concern: false,
    fatigue_level: "none",
  });
  const [symptoms, setSymptoms] = useState<Symptom[]>(defaultSymptoms);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSymptom, setEditingSymptom] = useState<string | null>(null);
  const [newSeverity, setNewSeverity] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [recommendations, setRecommendations] = useState<MenopauseRecommendations | null>(null);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    { role: "ai", content: "Hello! I'm here to help you navigate menopause and hormonal health. Ask me anything about symptoms, nutrition, fitness, or lifestyle adjustments." },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("menopause_profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setProfile({
          id: data.id,
          stage: data.stage,
          age: data.age,
          gender: data.gender || "female",
          symptoms: data.symptoms || [],
          hot_flash_severity: data.hot_flash_severity || "none",
          bone_density_concern: data.bone_density_concern || false,
          fatigue_level: data.fatigue_level || "none",
        });

        // Update symptoms UI based on saved data
        if (data.symptoms && data.symptoms.length > 0) {
          setSymptoms(prev => prev.map(s => ({
            ...s,
            severity: data.symptoms.includes(s.name.toLowerCase().replace(" ", "_")) 
              ? "moderate" as const 
              : "none" as const
          })));
        }
      }
    } catch (error) {
      console.error("Error fetching menopause profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const symptomsArray = symptoms
        .filter(s => s.severity !== "none")
        .map(s => s.name.toLowerCase().replace(" ", "_"));

      if (profile.id) {
        const { error } = await supabase
          .from("menopause_profiles")
          .update({
            stage: profile.stage,
            age: profile.age,
            gender: profile.gender,
            symptoms: symptomsArray,
            hot_flash_severity: profile.hot_flash_severity,
            bone_density_concern: profile.bone_density_concern,
            fatigue_level: profile.fatigue_level,
          })
          .eq("id", profile.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("menopause_profiles")
          .insert({
            user_id: user?.id,
            stage: profile.stage,
            age: profile.age,
            gender: profile.gender,
            symptoms: symptomsArray,
            hot_flash_severity: profile.hot_flash_severity,
            bone_density_concern: profile.bone_density_concern,
            fatigue_level: profile.fatigue_level,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setProfile(prev => ({ ...prev, id: data.id }));
      }

      toast({ title: "Profile saved!", description: "Your menopause profile has been updated." });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({ title: "Error saving profile", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhaseSelect = (phaseValue: string) => {
    setProfile(prev => ({ ...prev, stage: phaseValue }));
    const phaseName = menopausePhases.find((p) => p.value === phaseValue)?.name;
    toast({ title: "Phase updated", description: `You're now tracking ${phaseName}` });
  };

  const handleSymptomUpdate = () => {
    if (!editingSymptom || !newSeverity) return;

    setSymptoms((prev) =>
      prev.map((s) => s.name === editingSymptom ? { ...s, severity: newSeverity as Symptom["severity"] } : s)
    );

    toast({ title: "Symptom updated", description: `${editingSymptom} severity set to ${newSeverity}` });
    setEditingSymptom(null);
    setNewSeverity("");
    setIsDialogOpen(false);
  };

  const openSymptomDialog = (symptomName: string) => {
    setEditingSymptom(symptomName);
    const currentSeverity = symptoms.find((s) => s.name === symptomName)?.severity || "none";
    setNewSeverity(currentSeverity);
    setIsDialogOpen(true);
  };

  const fetchRecommendations = async () => {
    setIsLoadingRecs(true);
    try {
      const symptomsArray = symptoms
        .filter(s => s.severity !== "none")
        .map(s => s.name);

      const { data, error } = await supabase.functions.invoke("phase-recommendations", {
        body: {
          type: "menopause",
          stage: profile.stage,
          age: profile.age,
          gender: profile.gender,
          symptoms: symptomsArray,
        },
      });

      if (error) throw error;
      if (data.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      toast({ title: "Error", description: "Failed to get recommendations. Please try again.", variant: "destructive" });
    } finally {
      setIsLoadingRecs(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsChatLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("health-chat", {
        body: {
          message: userMessage,
          chatType: "menopause",
          userId: user?.id,
          context: {
            stage: profile.stage,
            symptoms: symptoms.filter(s => s.severity !== "none").map(s => s.name),
          },
        },
      });

      if (error) throw error;
      setChatMessages((prev) => [...prev, { role: "ai", content: data.response }]);
    } catch (error: any) {
      console.error("Error sending chat:", error);
      setChatMessages((prev) => [...prev, { role: "ai", content: "Sorry, I couldn't process your request. Please try again." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
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
            <h1 className="font-display text-3xl font-bold mb-2">Menopause & Hormonal Health</h1>
            <p className="text-muted-foreground">Personalized support for your hormonal wellness journey</p>
          </div>
          <Button variant="hero" onClick={saveProfile} disabled={isSaving}>
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Profile
          </Button>
        </div>

        {/* Phase Tracker */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display text-xl font-semibold mb-4">Your Journey Phase</h3>
          <p className="text-sm text-muted-foreground mb-4">Select your current phase:</p>
          <div className="flex flex-col lg:flex-row gap-4">
            {menopausePhases.map((phase, index) => (
              <button
                key={phase.name}
                onClick={() => handlePhaseSelect(phase.value)}
                className={cn(
                  "flex-1 p-5 rounded-xl border transition-all text-left",
                  profile.stage === phase.value ? "bg-primary/10 border-primary glow-sm" : "bg-secondary/50 border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    profile.stage === phase.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  )}>
                    {index + 1}
                  </div>
                  <h4 className="font-semibold">{phase.name}</h4>
                </div>
                <p className="text-sm text-muted-foreground">{phase.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Profile Details */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display text-xl font-semibold mb-4">Your Details</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Age</Label>
              <input
                type="number"
                className="w-full h-10 px-4 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none"
                value={profile.age || ""}
                onChange={(e) => setProfile(prev => ({ ...prev, age: Number(e.target.value) || null }))}
                placeholder="Enter your age"
              />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={profile.gender} onValueChange={(v) => setProfile(prev => ({ ...prev, gender: v }))}>
                <SelectTrigger className="h-10 bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fatigue Level</Label>
              <Select value={profile.fatigue_level} onValueChange={(v) => setProfile(prev => ({ ...prev, fatigue_level: v }))}>
                <SelectTrigger className="h-10 bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Symptom Tracker */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-xl font-semibold">Symptom Tracking</h3>
              <p className="text-sm text-muted-foreground">Click on a symptom to update its severity</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {symptoms.map((symptom) => (
              <button
                key={symptom.name}
                onClick={() => openSymptomDialog(symptom.name)}
                className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-all text-left"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <symptom.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{symptom.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className={cn(
                      "h-full rounded-full transition-all",
                      symptom.severity === "none" && "w-0",
                      symptom.severity === "mild" && "w-1/3 bg-green-400",
                      symptom.severity === "moderate" && "w-2/3 bg-yellow-400",
                      symptom.severity === "severe" && "w-full bg-red-400"
                    )} />
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">
                    {symptom.severity === "none" ? "Not set" : symptom.severity}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="glass">
              <DialogHeader>
                <DialogTitle className="font-display">Update {editingSymptom}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Severity Level</Label>
                  <Select value={newSeverity} onValueChange={setNewSeverity}>
                    <SelectTrigger className="h-12 bg-secondary border-border">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="hero" className="w-full" onClick={handleSymptomUpdate}>
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* AI Recommendations */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold">AI-Powered Recommendations</h3>
                <p className="text-sm text-muted-foreground">Personalized for your stage and symptoms</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchRecommendations} disabled={isLoadingRecs}>
              {isLoadingRecs ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span className="ml-2">Get Recommendations</span>
            </Button>
          </div>

          {recommendations ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2 mb-3">
                  <Apple className="w-4 h-4 text-green-400" />
                  <span className="font-medium">Nutrition</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{recommendations.diet.focus}</p>
                <div className="space-y-1">
                  {recommendations.diet.foods.slice(0, 4).map((food, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      {food}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2 mb-3">
                  <Dumbbell className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">Fitness</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{recommendations.workout.frequency}</p>
                <div className="space-y-1">
                  {recommendations.workout.types.slice(0, 4).map((type, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      {type}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="font-medium">Symptom Relief</span>
                </div>
                <div className="space-y-1">
                  {recommendations.symptomRelief.hotFlashes.slice(0, 3).map((tip, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span className="font-medium">Lifestyle</span>
                </div>
                <div className="space-y-1">
                  {recommendations.lifestyle.stress.slice(0, 3).map((tip, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "Hot Flash Management", content: "Track your hot flash patterns and get personalized cooling strategies.", icon: Flame },
                { title: "Sleep Optimization", content: "Improve sleep quality with phase-appropriate bedtime routines.", icon: Moon },
                { title: "Exercise Timing", content: "Get workout recommendations based on your energy patterns.", icon: Dumbbell },
                { title: "Nutrition Focus", content: "Discover foods that support hormonal balance.", icon: Apple },
              ].map((item) => (
                <div key={item.title} className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className="w-4 h-4 text-primary" />
                    <h4 className="font-medium">{item.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Chat */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold">Menopause Health Assistant</h3>
              <p className="text-sm text-muted-foreground">Ask me anything about menopause</p>
            </div>
          </div>

          <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}>
                {msg.role === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className={cn(
                  "p-4 rounded-2xl max-w-[80%]",
                  msg.role === "ai" ? "rounded-tl-none bg-secondary/50" : "rounded-tr-none bg-primary text-primary-foreground"
                )}>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="p-4 rounded-2xl rounded-tl-none bg-secondary/50">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
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
              placeholder="Ask about menopause, symptoms, or wellness..."
              className="flex-1 h-12 px-4 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
            />
            <Button onClick={handleSendChat} disabled={isChatLoading} className="h-12 px-6">
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </div>

        {/* Men's Section Note */}
        <div className="glass rounded-2xl p-6 border-2 border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold">Men's Hormonal Health</h3>
              <p className="text-sm text-muted-foreground">Age-related metabolic wellness support</p>
            </div>
          </div>
          <p className="text-muted-foreground mb-4">
            This section also provides AI-driven diet and workout adjustments for men experiencing age-related hormonal changes, including testosterone optimization and metabolic health support.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {["Testosterone-supporting nutrition", "Strength training protocols", "Sleep and recovery optimization"].map((item) => (
              <div key={item} className="p-3 rounded-lg bg-secondary/50 text-center hover:bg-secondary/70 transition-colors cursor-pointer">
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
