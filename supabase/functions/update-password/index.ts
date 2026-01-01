import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdatePasswordRequest {
  email: string;
  resetToken: string;
  newPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Update password function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetToken, newPassword }: UpdatePasswordRequest = await req.json();
    console.log("Updating password for email:", email);

    if (!email || !resetToken || !newPassword) {
      return new Response(
        JSON.stringify({ error: "Email, reset token, and new password are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the reset token is valid and verified
    const { data: otpRecord, error: fetchError } = await supabase
      .from("password_reset_otps")
      .select("*")
      .eq("id", resetToken)
      .eq("email", email.toLowerCase())
      .eq("verified", true)
      .single();

    if (fetchError || !otpRecord) {
      console.log("Invalid or unverified reset token");
      return new Response(
        JSON.stringify({ error: "Invalid or expired reset token. Please start over." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if the token hasn't expired (give 10 more minutes after verification)
    const expiresAt = new Date(otpRecord.expires_at);
    const extendedExpiry = new Date(expiresAt.getTime() + 10 * 60 * 1000);
    if (extendedExpiry < new Date()) {
      console.log("Reset token expired");
      await supabase.from("password_reset_otps").delete().eq("id", resetToken);
      return new Response(
        JSON.stringify({ error: "Reset token has expired. Please start over." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Find the user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error("Error listing users:", listError);
      return new Response(
        JSON.stringify({ error: "Failed to find user" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const user = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      console.log("User not found");
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update the user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateError) {
      console.error("Error updating password:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update password" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Delete the OTP record
    await supabase.from("password_reset_otps").delete().eq("id", resetToken);

    console.log("Password updated successfully");

    return new Response(
      JSON.stringify({ message: "Password updated successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in update-password function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
