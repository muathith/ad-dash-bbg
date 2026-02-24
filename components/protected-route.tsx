"use client"

import { useAuth } from "@/lib/auth-context"
import { usePathname } from "next/navigation"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()

  // Allow login page without authentication
  if (pathname === "/login") {
    return <>{children}</>
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  // Redirect handled by AuthContext
  if (!user) {
    return null
  }

  return <>{children}</>
}
