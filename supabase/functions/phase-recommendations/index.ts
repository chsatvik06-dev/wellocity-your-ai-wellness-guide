import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RecommendationRequest {
  type: "period" | "menopause";
  phase?: string; // For period: menstrual, follicular, ovulation, luteal
  stage?: string; // For menopause: perimenopause, menopause, postmenopause
  mood?: string;
  symptoms?: string[];
  age?: number;
  gender?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request = await req.json() as RecommendationRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (request.type === "period") {
      systemPrompt = `You are an expert nutritionist and fitness coach specializing in cycle-syncing.
Generate personalized diet and workout recommendations based on the user's menstrual cycle phase.
Return a JSON object with this exact structure:
{
  "diet": {
    "focus": "string describing the nutritional focus",
    "foods": ["array of recommended foods"],
    "avoid": ["array of foods to limit"],
    "nutrients": ["key nutrients to prioritize"]
  },
  "workout": {
    "intensity": "low" | "medium" | "high",
    "types": ["array of recommended exercise types"],
    "duration": "recommended workout duration",
    "tips": ["array of workout tips"]
  },
  "lifestyle": {
    "energy": "description of expected energy levels",
    "sleep": "sleep recommendations",
    "selfCare": ["self-care suggestions"]
  }
}`;

      userPrompt = `Generate recommendations for the ${request.phase || "menstrual"} phase.
${request.mood ? `Current mood: ${request.mood}` : ""}
${request.symptoms?.length ? `Symptoms: ${request.symptoms.join(", ")}` : ""}
Return ONLY the JSON object, no markdown or explanation.`;

    } else if (request.type === "menopause") {
      systemPrompt = `You are an expert in menopause health and wellness.
Generate personalized diet and workout recommendations based on the user's menopause stage and symptoms.
Return a JSON object with this exact structure:
{
  "diet": {
    "focus": "string describing the nutritional focus",
    "foods": ["array of recommended foods"],
    "avoid": ["array of foods to limit"],
    "supplements": ["suggested supplements to discuss with doctor"]
  },
  "workout": {
    "types": ["array of recommended exercise types"],
    "frequency": "recommended workout frequency",
    "boneHealth": ["exercises for bone density"],
    "tips": ["array of workout tips"]
  },
  "symptomRelief": {
    "hotFlashes": ["tips for managing hot flashes"],
    "sleep": ["sleep improvement tips"],
    "mood": ["mood management strategies"]
  },
  "lifestyle": {
    "stress": ["stress management techniques"],
    "social": ["social/community recommendations"]
  }
}`;

      userPrompt = `Generate recommendations for a ${request.gender || "woman"} in ${request.stage || "perimenopause"}.
${request.age ? `Age: ${request.age}` : ""}
${request.symptoms?.length ? `Symptoms: ${request.symptoms.join(", ")}` : ""}
Return ONLY the JSON object, no markdown or explanation.`;
    }

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
          { role: "user", content: userPrompt },
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
        return new Response(JSON.stringify({ error: "API credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate recommendations");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    const cleanedContent = content.replace(/```json\n?|\n?```/g, "").trim();
    const recommendations = JSON.parse(cleanedContent);

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
