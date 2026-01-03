import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendResetLinkRequest {
  email: string;
  redirectUrl: string;
}

const generateToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const sendEmail = async (to: string, subject: string, html: string) => {
  console.log("Sending email to:", to);
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
  const result = await response.json();
  console.log("Email API response:", JSON.stringify(result));
  return result;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Send reset link function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectUrl }: SendResetLinkRequest = await req.json();
    console.log("Received email:", email, "redirectUrl:", redirectUrl);

    if (!email || !email.includes("@")) {
      console.log("Invalid email provided");
      return new Response(
        JSON.stringify({ error: "Valid email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!redirectUrl) {
      console.log("Redirect URL not provided");
      return new Response(
        JSON.stringify({ error: "Redirect URL is required" }),
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
        JSON.stringify({ message: "If the email exists, a reset link has been sent" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Delete any existing tokens for this email
    await supabase
      .from("password_reset_otps")
      .delete()
      .eq("email", email.toLowerCase());

    // Generate secure token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    console.log("Generated token for email:", email);

    // Store token in database (using the OTP field for the token)
    const { error: insertError } = await supabase
      .from("password_reset_otps")
      .insert({
        email: email.toLowerCase(),
        otp: token,
        expires_at: expiresAt.toISOString(),
        verified: false,
      });

    if (insertError) {
      console.error("Error storing token:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate reset link" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build the reset link
    const resetLink = `${redirectUrl}?token=${token}&email=${encodeURIComponent(email.toLowerCase())}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Password Reset Request</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">You have requested to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="display: inline-block; background-color: #8B5CF6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px; line-height: 1.6;">Or copy and paste this link into your browser:</p>
        <p style="color: #8B5CF6; font-size: 14px; word-break: break-all; background-color: #f5f5f5; padding: 12px; border-radius: 4px;">${resetLink}</p>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">This link will expire in <strong>1 hour</strong>.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
      </div>
    `;

    const emailResponse = await sendEmail(email, "Reset Your Password", emailHtml);

    if (emailResponse.error) {
      console.error("Email sending failed:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: "Failed to send reset email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Reset link email sent successfully");

    return new Response(
      JSON.stringify({ message: "Reset link sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-reset-link function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
