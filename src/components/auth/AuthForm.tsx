import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, Loader2, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';

const AuthForm = () => {
  const { signIn, signUp, resetPassword, error: authError, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const { email, password, confirmPassword } = formData;

    // Validate email
    if (!validateEmail(email)) {
      setFormError("Please enter a valid email address");
      return;
    }

    if (isForgotPassword) {
      try {
        const { success, error } = await resetPassword(email);
        if (success) {
          setResetSent(true);
        } else {
          setFormError(error || "Failed to send reset email");
        }
      } catch (error) {
        setFormError(error.message || "An unexpected error occurred");
      }
      return;
    }

    // Validate password
    if (!validatePassword(password)) {
      setFormError("Password must be at least 8 characters long");
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setFormError("Passwords don't match");
      return;
    }

    try {
      if (isSignUp) {
        const { success, error } = await signUp(email, password);
        if (!success) {
          if (error && error.includes("user_already_exists")) {
            setFormError("This email is already registered. Please sign in instead.");
          } else {
            setFormError(error || "Failed to create account");
          }
        }
      } else {
        const { success, error } = await signIn(email, password);
        if (!success) {
          setFormError(error || "Failed to sign in");
        }
      }
    } catch (error) {
      setFormError(error.message || "An unexpected error occurred");
    }
  };

  const toggleView = () => {
    setIsSignUp(!isSignUp);
    setIsForgotPassword(false);
    setFormError(null);
    setResetSent(false);
  };

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setFormError(null);
    setResetSent(false);
  };

  const LogoWithCheckmark = () => (
    <div className="relative">
      <Shield className="h-12 w-12 text-blue-500" />
      <Check 
        className="h-6 w-6 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" 
        strokeWidth={3}
      />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <LogoWithCheckmark />
          </div>
          <CardTitle className="text-2xl font-bold">
            <span className="text-blue-600">Xafe</span>
            <span className="text-black">Wallet</span>
          </CardTitle>
          <p className="mt-2 text-gray-600">
            {isForgotPassword 
              ? "Reset your password" 
              : isSignUp 
                ? "Create your account" 
                : "Sign in to your account"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
                className="w-full"
                autoComplete="email"
              />
            </div>

            {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gray-500" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter your password"
                    className="w-full pr-10"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  {isSignUp && "Password must be at least 8 characters long"}
                </p>
              </div>
            )}

            {isSignUp && !isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gray-500" />
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm your password"
                    className="w-full pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {(authError || formError) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {authError || formError}
                </AlertDescription>
              </Alert>
            )}

            {resetSent && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-700">
                  Password reset email sent. Please check your inbox.
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isForgotPassword 
                    ? "Sending reset link..." 
                    : isSignUp 
                      ? "Creating account..." 
                      : "Signing in..."}
                </>
              ) : (
                isForgotPassword 
                  ? "Send reset link" 
                  : isSignUp 
                    ? "Create Account" 
                    : "Sign In"
              )}
            </Button>

            <div className="text-center space-y-2">
              {!isForgotPassword && (
                <button
                  type="button"
                  onClick={toggleView}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  {isSignUp
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Sign up"}
                </button>
              )}
              
              <button
                type="button"
                onClick={toggleForgotPassword}
                className="text-sm text-blue-600 hover:text-blue-500 block w-full"
              >
                {isForgotPassword
                  ? "Back to sign in"
                  : "Forgot your password?"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthForm;