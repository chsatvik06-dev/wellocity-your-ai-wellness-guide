import { useState, useEffect } from "react";
import { Activity, Mail, User, Save, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";

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

interface ProfileData {
  name: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  fitnessGoals: string[];
  healthConditions: string[];
  dietaryPreferences: string[];
}

export default function Profile() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formData, setFormData] = useState<ProfileData>({
    name: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    fitnessGoals: [],
    healthConditions: [],
    dietaryPreferences: [],
  });

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

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
      setIsFetching(false);
    }
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

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
      title: "Profile updated!",
      description: "Your changes have been saved.",
    });
    setIsEditing(false);
  };

  const toggleSelection = (
    field: "fitnessGoals" | "healthConditions" | "dietaryPreferences",
    value: string
  ) => {
    if (!isEditing) return;
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const bmi =
    formData.height && formData.weight
      ? (
          Number(formData.weight) / Math.pow(Number(formData.height) / 100, 2)
        ).toFixed(1)
      : null;

  if (isFetching) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your personal information
            </p>
          </div>
          <Button
            variant={isEditing ? "hero" : "outline"}
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : isEditing ? (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </>
            )}
          </Button>
        </div>

        {/* Profile Card */}
        <div className="glass rounded-2xl p-8 space-y-8">
          {/* Avatar & Basic Info */}
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center glow-sm">
              <User className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">
                {formData.name || "User"}
              </h2>
              <p className="text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user?.email}
              </p>
            </div>
          </div>

          {/* Personal Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Full Name</Label>
              {isEditing ? (
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="h-12 bg-secondary border-border"
                />
              ) : (
                <p className="h-12 flex items-center px-3 rounded-lg bg-secondary/50">
                  {formData.name || "Not set"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Age</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                  className="h-12 bg-secondary border-border"
                />
              ) : (
                <p className="h-12 flex items-center px-3 rounded-lg bg-secondary/50">
                  {formData.age || "Not set"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              {isEditing ? (
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
              ) : (
                <p className="h-12 flex items-center px-3 rounded-lg bg-secondary/50">
                  {formData.gender || "Not set"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Height (cm)</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={formData.height}
                  onChange={(e) =>
                    setFormData({ ...formData, height: e.target.value })
                  }
                  className="h-12 bg-secondary border-border"
                />
              ) : (
                <p className="h-12 flex items-center px-3 rounded-lg bg-secondary/50">
                  {formData.height ? `${formData.height} cm` : "Not set"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Weight (kg)</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: e.target.value })
                  }
                  className="h-12 bg-secondary border-border"
                />
              ) : (
                <p className="h-12 flex items-center px-3 rounded-lg bg-secondary/50">
                  {formData.weight ? `${formData.weight} kg` : "Not set"}
                </p>
              )}
            </div>

            {bmi && (
              <div className="space-y-2">
                <Label>BMI</Label>
                <p className="h-12 flex items-center px-3 rounded-lg bg-primary/10 text-primary font-semibold">
                  {bmi}
                </p>
              </div>
            )}
          </div>

          {/* Fitness Goals */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Fitness Goals</Label>
            <div className="flex flex-wrap gap-2">
              {fitnessGoals.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleSelection("fitnessGoals", goal)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200",
                    formData.fitnessGoals.includes(goal)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary border-border",
                    isEditing && "hover:border-primary/50 cursor-pointer",
                    !isEditing && "cursor-default"
                  )}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>

          {/* Health Conditions */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Health Conditions</Label>
            <div className="flex flex-wrap gap-2">
              {healthConditions.map((condition) => (
                <button
                  key={condition}
                  type="button"
                  onClick={() => toggleSelection("healthConditions", condition)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200",
                    formData.healthConditions.includes(condition)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary border-border",
                    isEditing && "hover:border-primary/50 cursor-pointer",
                    !isEditing && "cursor-default"
                  )}
                >
                  {condition}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Preferences */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Dietary Preferences</Label>
            <div className="flex flex-wrap gap-2">
              {dietaryPreferences.map((pref) => (
                <button
                  key={pref}
                  type="button"
                  onClick={() => toggleSelection("dietaryPreferences", pref)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200",
                    formData.dietaryPreferences.includes(pref)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary border-border",
                    isEditing && "hover:border-primary/50 cursor-pointer",
                    !isEditing && "cursor-default"
                  )}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
