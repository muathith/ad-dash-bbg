"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { ShieldCheck, Sparkles } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("settings@des.ccs")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/")
    } catch (err: any) {
      console.error("Login error:", err)
      if (err.code === "auth/invalid-credential") {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة")
      } else if (err.code === "auth/user-not-found") {
        setError("المستخدم غير موجود")
      } else if (err.code === "auth/wrong-password") {
        setError("كلمة المرور غير صحيحة")
      } else if (err.code === "auth/too-many-requests") {
        setError("تم تجاوز عدد المحاولات. يرجى المحاولة لاحقاً")
      } else {
        setError("حدث خطأ أثناء تسجيل الدخول")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-4"
      dir="rtl"
    >
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-blue-300/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-indigo-300/25 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white bg-white/95 p-5 shadow-2xl backdrop-blur-sm sm:rounded-3xl sm:p-8">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl">لوحة التحكم</h1>
          <p className="text-sm text-gray-600 sm:text-base">تسجيل الدخول للإدارة والمتابعة الفورية</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              placeholder="admin@example.com"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>واجهة محسّنة لعرض أسرع وتجربة أوضح</span>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-gray-600 sm:text-sm">
          <p>© 2026 لوحة التحكم - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  )
}
