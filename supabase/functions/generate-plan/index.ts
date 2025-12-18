import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserProfile {
  age: number | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  fitness_goals: string[] | null;
  health_conditions: string[] | null;
  dietary_preferences: string[] | null;
}

function calculateBMI(weight: number | null, height: number | null): number | null {
  if (!weight || !height) return null;
  const heightInMeters = height / 100;
  return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
}

function getBMICategory(bmi: number | null): string {
  if (!bmi) return "unknown";
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile, planType } = await req.json() as { profile: UserProfile; planType: "nutrition" | "fitness" };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const bmi = calculateBMI(profile.weight, profile.height);
    const bmiCategory = getBMICategory(bmi);

    const systemPrompt = planType === "nutrition" 
      ? `You are an expert nutritionist AI. Generate a personalized daily meal plan based on the user's profile. 
         Consider their BMI, age, gender, dietary preferences, health conditions, and fitness goals.
         Return a JSON object with this exact structure:
         {
           "dailyGoals": { "calories": number, "protein": number, "carbs": number, "fat": number },
           "mealPlan": [
             {
               "meal": "Breakfast" | "Lunch" | "Snack" | "Dinner",
               "time": "HH:MM AM/PM",
               "items": [{ "name": string, "calories": number, "protein": number, "carbs": number, "fat": number }]
             }
           ],
           "insights": [string, string, string]
         }
         Make the plan realistic and achievable. Adjust calories based on BMI category and fitness goals.`
      : `You are an expert fitness trainer AI. Generate a personalized workout plan based on the user's profile.
         Consider their BMI, age, gender, health conditions, and fitness goals.
         Return a JSON object with this exact structure:
         {
           "workout": {
             "name": string,
             "duration": string,
             "calories": number,
             "exercises": [
               { "name": string, "duration": string, "sets": number, "reps": string, "rest": string }
             ]
           },
           "weeklyPlan": [
             { "day": "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun", "type": string }
           ],
           "insights": [string, string, string]
         }
         Adjust intensity based on BMI category, age, and fitness level. Include rest days appropriately.`;

    const userMessage = `Generate a personalized ${planType} plan for a user with the following profile:
- Age: ${profile.age || "Not specified"}
- Gender: ${profile.gender || "Not specified"}
- Height: ${profile.height ? `${profile.height} cm` : "Not specified"}
- Weight: ${profile.weight ? `${profile.weight} kg` : "Not specified"}
- BMI: ${bmi || "Unknown"} (${bmiCategory})
- Fitness Goals: ${profile.fitness_goals?.join(", ") || "General health"}
- Health Conditions: ${profile.health_conditions?.join(", ") || "None"}
- Dietary Preferences: ${profile.dietary_preferences?.join(", ") || "None"}

Return ONLY the JSON object, no markdown or explanation.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "API credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate plan");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON from the response
    const cleanedContent = content.replace(/```json\n?|\n?```/g, "").trim();
    const plan = JSON.parse(cleanedContent);

    return new Response(JSON.stringify({ plan, bmi, bmiCategory }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating plan:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
