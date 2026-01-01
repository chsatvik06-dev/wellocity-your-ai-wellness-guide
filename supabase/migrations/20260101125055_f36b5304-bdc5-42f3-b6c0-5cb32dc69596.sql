-- Create password_reset_otps table for storing OTPs
CREATE TABLE public.password_reset_otps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert (for requesting OTP)
CREATE POLICY "Allow anonymous insert for OTP requests"
ON public.password_reset_otps
FOR INSERT
WITH CHECK (true);

-- Allow anonymous select for OTP verification
CREATE POLICY "Allow anonymous select for OTP verification"
ON public.password_reset_otps
FOR SELECT
USING (true);

-- Allow anonymous update for marking OTP as verified
CREATE POLICY "Allow anonymous update for OTP verification"
ON public.password_reset_otps
FOR UPDATE
USING (true);

-- Allow anonymous delete for cleanup
CREATE POLICY "Allow anonymous delete for OTP cleanup"
ON public.password_reset_otps
FOR DELETE
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_password_reset_otps_email ON public.password_reset_otps(email);
CREATE INDEX idx_password_reset_otps_expires_at ON public.password_reset_otps(expires_at);