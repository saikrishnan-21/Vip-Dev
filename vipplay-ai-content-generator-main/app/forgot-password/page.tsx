"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, ArrowLeft, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [emailTouched, setEmailTouched] = useState(false)
  const [resetUrl, setResetUrl] = useState<string>("")

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return 'Email is required'
    if (!emailRegex.test(email)) return 'Invalid email format'
    return null
  }

  const handleEmailBlur = () => {
    setEmailTouched(true)
    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
    } else {
      setError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      setEmailTouched(true)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          setError(data.errors[0]?.message || 'Failed to send reset link')
        } else {
          setError(data.message || 'Failed to send reset link')
        }
        return
      }

      // Success! Show confirmation
      setIsSubmitted(true)

      // In development, store the reset URL for easy access
      if (data.resetUrl) {
        setResetUrl(data.resetUrl)
      }

    } catch (error) {
      console.error('Forgot password error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">VIPContentAI</span>
        </Link>

        {/* Forgot Password Card */}
        <div className="bg-card border border-border rounded-lg p-8">
          {!isSubmitted ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-card-foreground mb-2">Reset your password</h1>
                <p className="text-muted-foreground">
                  Enter your email address and we'll send you a link to reset your password
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-card-foreground">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={handleEmailBlur}
                    required
                    className={cn(
                      "bg-background border-input text-foreground",
                      emailTouched && error && "border-destructive focus-visible:ring-destructive"
                    )}
                    disabled={isLoading}
                  />
                  {emailTouched && error && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {error}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send reset link"}
                </Button>
              </form>

              <div className="mt-6">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-card-foreground mb-2">Check your email</h2>
              <p className="text-muted-foreground mb-6">
                If an account exists for <span className="font-medium text-foreground">{email}</span>, you will receive a password reset link shortly.
              </p>

              {/* Development only - show reset URL */}
              {resetUrl && (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2 font-semibold">
                    Development Mode - Reset Link:
                  </p>
                  <Link
                    href={resetUrl.replace(window.location.origin, '')}
                    className="text-xs text-primary hover:underline break-all"
                  >
                    {resetUrl}
                  </Link>
                </div>
              )}

              <p className="text-sm text-muted-foreground mb-6">
                Didn't receive the email? Check your spam folder or{" "}
                <button onClick={() => setIsSubmitted(false)} className="text-primary hover:underline font-medium">
                  try again
                </button>
              </p>
              <Link href="/login">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
                  Return to login
                </Button>
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Need help?{" "}
          <a href="mailto:support@vipcontentai.com" className="text-primary hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}
