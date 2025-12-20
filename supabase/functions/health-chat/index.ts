import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  message: string;
  chatType: "teen" | "puberty" | "menopause" | "period";
  userId?: string;
  context?: {
    phase?: string;
    mood?: string;
    stage?: string;
    symptoms?: string[];
  };
}

const systemPrompts: Record<string, string> = {
  teen: `You are a supportive, age-appropriate AI health assistant for teenagers. 
You help with questions about nutrition, mental health, sleep, fitness, hygiene, and emotional changes.
Always be:
- Non-judgmental and supportive
- Age-appropriate in your language
- Encouraging seeking adult help for serious issues
- Privacy-conscious
- Positive and empowering
Keep responses concise (2-3 paragraphs max). Use friendly, approachable language.
If asked about serious topics like self-harm, eating disorders, or abuse, always recommend speaking to a trusted adult or professional.`,

  puberty: `You are a friendly, informative AI assistant helping young people understand puberty.
Cover topics like physical changes, emotional changes, growth, nutrition, and self-care.
Always be:
- Educational and factual
- Non-judgmental and normalizing
- Reassuring that changes are normal
- Privacy-focused
- Encouraging open communication with parents/guardians
Keep explanations simple and age-appropriate. Avoid being clinical or scary.`,

  menopause: `You are a knowledgeable AI health assistant specializing in menopause and hormonal health.
Help users understand perimenopause, menopause, and postmenopause stages.
Provide advice on:
- Symptom management (hot flashes, sleep issues, mood changes)
- Nutrition for hormonal health
- Exercise recommendations
- Lifestyle adjustments
Always recommend consulting healthcare providers for medical decisions.
Be empathetic and supportive, acknowledging this life transition.`,

  period: `You are a supportive AI assistant for menstrual health and cycle tracking.
Help users understand their menstrual cycle phases and provide personalized recommendations.
Based on the current phase, provide tailored advice for:
- Menstrual phase: Rest, iron-rich foods, gentle exercise
- Follicular phase: Increasing energy, strength building
- Ovulatory phase: Peak performance, social activities
- Luteal phase: Self-care, mood management, PMS relief
Be supportive and educational. Always recommend seeing a doctor for concerning symptoms.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, chatType, userId, context } = await req.json() as ChatRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = systemPrompts[chatType] || systemPrompts.teen;
    
    // Add context to system prompt if provided
    if (context) {
      if (context.phase) {
        systemPrompt += `\n\nThe user is currently in their ${context.phase} phase of their menstrual cycle.`;
      }
      if (context.mood) {
        systemPrompt += `\n\nThe user reported their mood as: ${context.mood}.`;
      }
      if (context.stage) {
        systemPrompt += `\n\nThe user is in the ${context.stage} stage of menopause.`;
      }
      if (context.symptoms && context.symptoms.length > 0) {
        systemPrompt += `\n\nThe user is experiencing these symptoms: ${context.symptoms.join(", ")}.`;
      }
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
          { role: "user", content: message },
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
        return new Response(JSON.stringify({ error: "API credits exhausted. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No content in AI response");
    }

    // Log the chat interaction (anonymously if no userId)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from("chat_logs").insert({
        user_id: userId || null,
        chat_type: chatType,
        user_message: message,
        ai_response: aiResponse,
      });
    } catch (logError) {
      console.error("Error logging chat:", logError);
      // Don't fail the request if logging fails
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in health-chat:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
