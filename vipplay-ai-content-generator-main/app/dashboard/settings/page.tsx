"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { User, Palette, Save, Monitor, Moon, Sun } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  // Profile state - start with empty fields
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    company: "",
    bio: "",
  })

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get token from localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
        
        if (!token) {
          // No token, keep fields empty
          return
        }

        setLoading(true)
        const response = await fetch("/api/protected/me", {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${token}`
          },
        })

        if (!response.ok) {
          // Silently fail - keep fields empty, don't show error
          console.warn("Failed to fetch user data:", response.status)
          return
        }

        const data = await response.json()
        if (data.success && data.user) {
          setProfile({
            name: data.user.fullName || "",
            email: data.user.email || "",
            company: data.user.company || "",
            bio: data.user.bio || "",
          })
        }
      } catch (error) {
        // Silently fail - keep fields empty, don't show error toast
        console.warn("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Get token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      
      if (!token) {
        throw new Error("Authentication required. Please log in again.")
      }
      
      const response = await fetch("/api/protected/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: profile.name,
          email: profile.email,
          company: profile.company || null,
          bio: profile.bio || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile")
      }

      toast({
        title: "Settings saved",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="bg-background border-border"
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="bg-background border-border"
                        disabled={saving}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={profile.company}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      className="bg-background border-border"
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      className="bg-background border-border min-h-[100px]"
                      disabled={saving}
                    />
                  </div>
                  <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
                    {saving ? (
                      <>
                        <Save className="h-4 w-4 mr-2 animate-pulse" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Choose how VIPContentAI looks to you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={theme} onValueChange={setTheme} className="space-y-4">
                <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
                      <Sun className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Light</p>
                      <p className="text-sm text-muted-foreground">Bright and clean interface</p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
                      <Moon className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Dark</p>
                      <p className="text-sm text-muted-foreground">Easy on the eyes in low light</p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system" className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
                      <Monitor className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">System</p>
                      <p className="text-sm text-muted-foreground">Adapts to your device settings</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
