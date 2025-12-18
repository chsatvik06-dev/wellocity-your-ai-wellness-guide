import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, ChevronRight, ChevronLeft, User, Scale, Target, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const steps = [
  { id: 1, title: "Basic Info", icon: User },
  { id: 2, title: "Body Metrics", icon: Scale },
  { id: 3, title: "Goals", icon: Target },
  { id: 4, title: "Preferences", icon: Utensils },
];

const fitnessGoals = [
  "Lose Weight",
  "Build Muscle",
  "Improve Endurance",
  "Maintain Health",
  "Gain Weight",
  "Increase Flexibility",
];

const healthConditions = [
  "None",
  "Diabetes",
  "Hypertension",
  "Heart Disease",
  "Thyroid Issues",
  "PCOS/PCOD",
  "Other",
];

const dietaryPreferences = [
  "No Restrictions",
  "Vegetarian",
  "Vegan",
  "Keto",
  "Gluten-Free",
  "Dairy-Free",
  "Halal",
  "Kosher",
];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    fitnessGoals: [] as string[],
    healthConditions: [] as string[],
    dietaryPreferences: [] as string[],
  });

  // Fetch existing profile data on mount
  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data && !error) {
        setFormData({
          name: data.name || "",
          age: data.age?.toString() || "",
          gender: data.gender || "",
          height: data.height?.toString() || "",
          weight: data.weight?.toString() || "",
          fitnessGoals: data.fitness_goals || [],
          healthConditions: data.health_conditions || [],
          dietaryPreferences: data.dietary_preferences || [],
        });
      }
    }
    fetchProfile();
  }, [user]);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save your profile.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        name: formData.name,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        fitness_goals: formData.fitnessGoals,
        health_conditions: formData.healthConditions,
        dietary_preferences: formData.dietaryPreferences,
      })
      .eq("user_id", user.id);

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Profile Complete!",
      description: "Your wellness journey begins now.",
    });
    navigate("/dashboard");
  };

  const toggleSelection = (field: "fitnessGoals" | "healthConditions" | "dietaryPreferences", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center glow-sm">
              <Activity className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-muted-foreground">Help us personalize your wellness journey</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  currentStep >= step.id
                    ? "bg-primary text-primary-foreground glow-sm"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                <step.icon className="w-5 h-5" />
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-12 h-1 mx-2 rounded-full transition-all duration-300",
                    currentStep > step.id ? "bg-primary" : "bg-secondary"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="glass rounded-2xl p-8">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-xl font-semibold mb-4">Basic Information</h2>
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  className="h-12 bg-secondary border-border"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    className="h-12 bg-secondary border-border"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <div className="flex gap-2">
                    {["Male", "Female", "Other"].map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => setFormData({ ...formData, gender })}
                        className={cn(
                          "flex-1 h-12 rounded-lg border transition-all duration-200",
                          formData.gender === gender
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary border-border hover:border-primary/50"
                        )}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Body Metrics */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-xl font-semibold mb-4">Body Metrics</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="170"
                    className="h-12 bg-secondary border-border"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    className="h-12 bg-secondary border-border"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  />
                </div>
              </div>

              {formData.height && formData.weight && (
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Your BMI</p>
                  <p className="text-3xl font-display font-bold text-primary">
                    {(Number(formData.weight) / Math.pow(Number(formData.height) / 100, 2)).toFixed(1)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Goals */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="font-display text-xl font-semibold mb-2">Fitness Goals</h2>
                <p className="text-sm text-muted-foreground mb-4">Select all that apply</p>
                <div className="grid grid-cols-2 gap-3">
                  {fitnessGoals.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleSelection("fitnessGoals", goal)}
                      className={cn(
                        "p-3 rounded-lg border text-sm font-medium transition-all duration-200",
                        formData.fitnessGoals.includes(goal)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary border-border hover:border-primary/50"
                      )}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-display text-xl font-semibold mb-2">Health Conditions</h2>
                <p className="text-sm text-muted-foreground mb-4">Select any that apply</p>
                <div className="grid grid-cols-2 gap-3">
                  {healthConditions.map((condition) => (
                    <button
                      key={condition}
                      type="button"
                      onClick={() => toggleSelection("healthConditions", condition)}
                      className={cn(
                        "p-3 rounded-lg border text-sm font-medium transition-all duration-200",
                        formData.healthConditions.includes(condition)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary border-border hover:border-primary/50"
                      )}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Preferences */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-xl font-semibold mb-2">Dietary Preferences</h2>
              <p className="text-sm text-muted-foreground mb-4">Select all that apply</p>
              <div className="grid grid-cols-2 gap-3">
                {dietaryPreferences.map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => toggleSelection("dietaryPreferences", pref)}
                    className={cn(
                      "p-3 rounded-lg border text-sm font-medium transition-all duration-200",
                      formData.dietaryPreferences.includes(pref)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary border-border hover:border-primary/50"
                    )}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <Button variant="hero" onClick={handleNext} className="gap-2 group" disabled={isLoading}>
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {currentStep === 4 ? "Complete Setup" : "Continue"}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
