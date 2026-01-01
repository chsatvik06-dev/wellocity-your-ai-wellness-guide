import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  email: string;
  otp: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Verify OTP function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp }: VerifyOTPRequest = await req.json();
    console.log("Verifying OTP for email:", email);

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "Email and OTP are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the OTP record
    const { data: otpRecord, error: fetchError } = await supabase
      .from("password_reset_otps")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("otp", otp)
      .eq("verified", false)
      .single();

    if (fetchError || !otpRecord) {
      console.log("OTP not found or already used");
      return new Response(
        JSON.stringify({ error: "Invalid OTP" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if OTP is expired
    const expiresAt = new Date(otpRecord.expires_at);
    if (expiresAt < new Date()) {
      console.log("OTP expired");
      // Delete expired OTP
      await supabase
        .from("password_reset_otps")
        .delete()
        .eq("id", otpRecord.id);

      return new Response(
        JSON.stringify({ error: "OTP has expired. Please request a new one." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark OTP as verified
    const { error: updateError } = await supabase
      .from("password_reset_otps")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    if (updateError) {
      console.error("Error updating OTP:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to verify OTP" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("OTP verified successfully");

    return new Response(
      JSON.stringify({ 
        message: "OTP verified successfully",
        resetToken: otpRecord.id // Use the OTP record ID as a reset token
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
