"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Eye, EyeOff, XCircle, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// Password strength calculation
function calculatePasswordStrength(password: string): {
  strength: 'weak' | 'medium' | 'strong'
  score: number
} {
  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1

  if (score <= 2) return { strength: 'weak', score }
  if (score <= 4) return { strength: 'medium', score }
  return { strength: 'strong', score }
}

interface FormErrors {
  password?: string
  confirmPassword?: string
  general?: string
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  // Form state
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })

  // UI state
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  // Password strength
  const passwordStrength = formData.password ? calculatePasswordStrength(formData.password) : null

  // Check if token exists
  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      setErrors({ general: 'Invalid or missing reset token' })
    } else {
      setTokenValid(true)
    }
  }, [token])

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter'
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter'
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const apiErrors: FormErrors = {}
          data.errors.forEach((err: { field: string; message: string }) => {
            apiErrors[err.field as keyof FormErrors] = err.message
          })
          setErrors(apiErrors)
        } else {
          setErrors({ general: data.message || 'Password reset failed' })
        }
        return
      }

      // Success!
      setIsSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (error) {
      console.error('Reset password error:', error)
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  // If no token or invalid token
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">VIPContentAI</span>
          </Link>

          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-card-foreground mb-2">Invalid Reset Link</h2>
            <p className="text-muted-foreground mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link href="/forgot-password">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
                Request New Link
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">VIPContentAI</span>
          </Link>

          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-card-foreground mb-2">Password Reset Successful!</h2>
            <p className="text-muted-foreground mb-6">
              Your password has been reset successfully. Redirecting to login...
            </p>
            <Link href="/login">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
                Go to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Reset password form
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">VIPContentAI</span>
        </Link>

        <div className="bg-card border border-border rounded-lg p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-card-foreground mb-2">Set new password</h1>
            <p className="text-muted-foreground">
              Enter your new password below to reset your account password
            </p>
          </div>

          {/* General Error Message */}
          {errors.general && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              <p className="text-sm text-destructive">{errors.general}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-card-foreground">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  className={cn(
                    "bg-background border-input text-foreground pr-10",
                    errors.password && "border-destructive focus-visible:ring-destructive"
                  )}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && passwordStrength && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    <div className={cn("h-1 flex-1 rounded", passwordStrength.strength === 'weak' ? 'bg-red-500' : 'bg-muted')} />
                    <div className={cn("h-1 flex-1 rounded", passwordStrength.strength === 'medium' || passwordStrength.strength === 'strong' ? 'bg-yellow-500' : 'bg-muted')} />
                    <div className={cn("h-1 flex-1 rounded", passwordStrength.strength === 'strong' ? 'bg-green-500' : 'bg-muted')} />
                  </div>
                  <p className={cn("text-sm font-medium", {
                    'text-red-500': passwordStrength.strength === 'weak',
                    'text-yellow-500': passwordStrength.strength === 'medium',
                    'text-green-500': passwordStrength.strength === 'strong',
                  })}>
                    {passwordStrength.strength === 'weak' && 'Weak password'}
                    {passwordStrength.strength === 'medium' && 'Medium password'}
                    {passwordStrength.strength === 'strong' && 'Strong password'}
                  </p>
                </div>
              )}

              {errors.password && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-card-foreground">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  className={cn(
                    "bg-background border-input text-foreground pr-10",
                    errors.confirmPassword && "border-destructive focus-visible:ring-destructive"
                  )}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Passwords Match Indicator */}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="text-sm text-green-500 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Passwords match
                </p>
              )}

              {errors.confirmPassword && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
