import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail, CheckCircle, KeyRound, Lock } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type Step = "email" | "otp" | "password" | "success";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>("email");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("request-otp", {
        body: { email },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to send OTP",
          variant: "destructive",
        });
      } else {
        setStep("otp");
        toast({
          title: "OTP Sent",
          description: "Check your email for the verification code.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { email, otp },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Invalid OTP",
          variant: "destructive",
        });
      } else if (data?.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      } else {
        setResetToken(data.resetToken);
        setStep("password");
        toast({
          title: "OTP Verified",
          description: "You can now set a new password.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("update-password", {
        body: { email, resetToken, newPassword },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to update password",
          variant: "destructive",
        });
      } else if (data?.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      } else {
        setStep("success");
        toast({
          title: "Password Updated",
          description: "Your password has been changed successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-otp", {
        body: { email },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to resend OTP",
          variant: "destructive",
        });
      } else {
        setOtp("");
        toast({
          title: "OTP Resent",
          description: "A new code has been sent to your email.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Success step
  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Password Changed!</h1>
            <p className="text-muted-foreground">
              Your password has been updated successfully.
            </p>
          </div>
          <Button
            onClick={() => navigate("/auth")}
            className="w-full"
          >
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Password step
  if (step === "password") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Set New Password</h1>
            <p className="text-muted-foreground">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // OTP step
  if (step === "otp") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Enter Verification Code</h1>
            <p className="text-muted-foreground">
              We've sent a 6-digit code to <strong>{email}</strong>
            </p>
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </Button>
          </form>

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?
            </p>
            <Button
              variant="outline"
              onClick={handleResendOTP}
              disabled={isLoading}
              className="w-full"
            >
              Resend Code
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setStep("email");
                setOtp("");
              }}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Try different email
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Email step (default)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Forgot your password?</h1>
          <p className="text-muted-foreground">
            Enter your email and we'll send you a verification code
          </p>
        </div>

        <form onSubmit={handleRequestOTP} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Verification Code"}
          </Button>
        </form>

        <div className="text-center">
          <Link to="/auth" className="text-sm text-primary hover:underline inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
