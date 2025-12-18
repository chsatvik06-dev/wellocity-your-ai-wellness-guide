import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Heart, Flame, Moon, Droplet, Sparkles, Apple, Dumbbell, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const menopausePhases = [
  { name: "Perimenopause", description: "Transition begins, cycles may become irregular", active: true },
  { name: "Menopause", description: "12 months without a period", active: false },
  { name: "Postmenopause", description: "New chapter of wellness", active: false },
];

const symptoms = [
  { name: "Hot Flashes", severity: "moderate", icon: Flame },
  { name: "Sleep Issues", severity: "mild", icon: Moon },
  { name: "Mood Changes", severity: "moderate", icon: Brain },
  { name: "Weight Changes", severity: "mild", icon: Heart },
];

const recommendations = [
  {
    category: "Nutrition",
    icon: Apple,
    tips: [
      "Increase calcium and vitamin D intake",
      "Add phytoestrogen-rich foods (soy, flaxseed)",
      "Reduce caffeine and alcohol",
      "Focus on lean proteins and whole grains",
    ],
  },
  {
    category: "Fitness",
    icon: Dumbbell,
    tips: [
      "Weight-bearing exercises for bone health",
      "Yoga and stretching for flexibility",
      "Swimming and low-impact cardio",
      "Strength training 2-3 times per week",
    ],
  },
  {
    category: "Lifestyle",
    icon: Heart,
    tips: [
      "Practice stress management techniques",
      "Maintain consistent sleep schedule",
      "Stay hydrated (8+ glasses daily)",
      "Connect with support communities",
    ],
  },
];

export default function Menopause() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Menopause & Hormonal Health</h1>
          <p className="text-muted-foreground">Personalized support for your hormonal wellness journey</p>
        </div>

        {/* Phase Tracker */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display text-xl font-semibold mb-6">Your Journey Phase</h3>
          <div className="flex flex-col lg:flex-row gap-4">
            {menopausePhases.map((phase, index) => (
              <div
                key={phase.name}
                className={cn(
                  "flex-1 p-5 rounded-xl border transition-all",
                  phase.active
                    ? "bg-primary/10 border-primary glow-sm"
                    : "bg-secondary/50 border-border"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      phase.active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </div>
                  <h4 className="font-semibold">{phase.name}</h4>
                </div>
                <p className="text-sm text-muted-foreground">{phase.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Symptom Tracker */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-xl font-semibold">Symptom Tracking</h3>
              <p className="text-sm text-muted-foreground">Monitor and manage your symptoms</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {symptoms.map((symptom) => (
              <div
                key={symptom.name}
                className="p-4 rounded-xl bg-secondary/50 border border-border"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <symptom.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{symptom.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        symptom.severity === "mild" && "w-1/3 bg-green-400",
                        symptom.severity === "moderate" && "w-2/3 bg-yellow-400",
                        symptom.severity === "severe" && "w-full bg-red-400"
                      )}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">{symptom.severity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="grid lg:grid-cols-3 gap-6">
          {recommendations.map((rec) => (
            <div key={rec.category} className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <rec.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold">{rec.category}</h3>
              </div>
              <div className="space-y-3">
                {rec.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <p className="text-sm text-muted-foreground">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* AI Insights */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold">Personalized Insights</h3>
              <p className="text-sm text-muted-foreground">AI-powered recommendations for your phase</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: "Hot Flash Management",
                content: "Your hot flash patterns suggest evening triggers. Try keeping your bedroom cool (65-68°F) and wearing breathable fabrics.",
              },
              {
                title: "Sleep Optimization",
                content: "Consider magnesium supplements before bed. Avoid screens 1 hour before sleep and try relaxation techniques.",
              },
              {
                title: "Exercise Timing",
                content: "Based on your energy patterns, morning workouts between 7-9 AM may be most effective for you.",
              },
              {
                title: "Nutrition Focus",
                content: "Increase omega-3 rich foods like salmon and walnuts. Consider reducing sugar intake to help stabilize mood.",
              },
            ].map((insight) => (
              <div key={insight.title} className="p-4 rounded-xl bg-secondary/50">
                <h4 className="font-medium mb-2">{insight.title}</h4>
                <p className="text-sm text-muted-foreground">{insight.content}</p>
              </div>
            ))}
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
            {[
              "Testosterone-supporting nutrition",
              "Strength training protocols",
              "Sleep and recovery optimization",
            ].map((item) => (
              <div key={item} className="p-3 rounded-lg bg-secondary/50 text-center">
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
