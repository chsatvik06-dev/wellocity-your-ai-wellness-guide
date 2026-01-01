import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const sendEmail = async (to: string, subject: string, html: string) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Password Reset <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });
  return response.json();
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestOTPRequest {
  email: string;
}

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Request OTP function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: RequestOTPRequest = await req.json();
    console.log("Received email:", email);

    if (!email || !email.includes("@")) {
      console.log("Invalid email provided");
      return new Response(
        JSON.stringify({ error: "Valid email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      console.error("Error listing users:", userError);
      return new Response(
        JSON.stringify({ error: "Failed to verify user" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userExists = users.users.some((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!userExists) {
      console.log("User not found, but returning success for security");
      // Return success even if user doesn't exist (security best practice)
      return new Response(
        JSON.stringify({ message: "If the email exists, an OTP has been sent" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Delete any existing OTPs for this email
    await supabase
      .from("password_reset_otps")
      .delete()
      .eq("email", email.toLowerCase());

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    console.log("Generated OTP for email:", email);

    // Store OTP in database
    const { error: insertError } = await supabase
      .from("password_reset_otps")
      .insert({
        email: email.toLowerCase(),
        otp: otp,
        expires_at: expiresAt.toISOString(),
        verified: false,
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
        <p style="color: #666; font-size: 16px;">You have requested to reset your password. Use the code below to verify your identity:</p>
        <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${otp}</span>
        </div>
        <p style="color: #666; font-size: 14px;">This code will expire in <strong>5 minutes</strong>.</p>
        <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `;

    const emailResponse = await sendEmail(email, "Your Password Reset Code", emailHtml);

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ message: "OTP sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in request-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
