"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Settings,
  LogOut,
  Target,
  Moon,
  Sun,
  ImageIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

interface User {
  id: string
  email: string
  user_metadata?: { full_name?: string }
}

interface DashboardSidebarProps {
  user: User
}

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Generate Content", href: "/dashboard/generate", icon: FileText },
  { name: "Media Library", href: "/dashboard/media", icon: ImageIcon },
  { name: "Content", href: "/dashboard/content", icon: CheckSquare },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const isSuperAdmin = true // Mock superadmin status - in real app, this would come from user data

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    try {
      // Get token for logout API call (optional - for logging/consistency)
      const token = localStorage.getItem('auth_token')
      
      if (token) {
        // Call logout API (optional - for logging/consistency)
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).catch(() => {
          // Ignore errors - logout should work even if API fails
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear client-side storage (Next.js way - simple)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('remember_me')
      
      // Redirect to login
      router.push("/login")
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-card-foreground">VIPContentAI</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            if (item.superadminOnly && !isSuperAdmin) return null

            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 ${
                    isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary">{user.email.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-card-foreground truncate">{user.email}</p>
          </div>
        </div>

        {mounted && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground mb-1"
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-5 h-5" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="w-5 h-5" />
                Dark Mode
              </>
            )}
          </Button>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
