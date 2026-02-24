"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2, CreditCard, Globe } from "lucide-react"
import { 
  getSettings, 
  addBlockedCardBin, 
  removeBlockedCardBin, 
  addAllowedCountry, 
  removeAllowedCountry,
  type Settings 
} from "@/lib/firebase/settings"
import { toast } from "sonner"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

// List of countries with flags
const COUNTRIES = [
  { code: "SAU", name: "السعودية", flag: "🇸🇦" },
  { code: "ARE", name: "الإمارات", flag: "🇦🇪" },
  { code: "KWT", name: "الكويت", flag: "🇰🇼" },
  { code: "BHR", name: "البحرين", flag: "🇧🇭" },
  { code: "OMN", name: "عمان", flag: "🇴🇲" },
  { code: "QAT", name: "قطر", flag: "🇶🇦" },
  { code: "JOR", name: "الأردن", flag: "🇯🇴" },
  { code: "EGY", name: "مصر", flag: "🇪🇬" },
  { code: "LBN", name: "لبنان", flag: "🇱🇧" },
  { code: "IRQ", name: "العراق", flag: "🇮🇶" },
  { code: "SYR", name: "سوريا", flag: "🇸🇾" },
  { code: "YEM", name: "اليمن", flag: "🇾🇪" },
  { code: "PSE", name: "فلسطين", flag: "🇵🇸" },
  { code: "MAR", name: "المغرب", flag: "🇲🇦" },
  { code: "DZA", name: "الجزائر", flag: "🇩🇿" },
  { code: "TUN", name: "تونس", flag: "🇹🇳" },
  { code: "LBY", name: "ليبيا", flag: "🇱🇾" },
  { code: "SDN", name: "السودان", flag: "🇸🇩" },
]

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings>({
    blockedCardBins: [],
    allowedCountries: []
  })
  const [newBinsInput, setNewBinsInput] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"cards" | "countries">("cards")

  // Load settings when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSettings()
    }
  }, [isOpen])

  const loadSettings = async () => {
    try {
      const data = await getSettings()
      setSettings(data)
    } catch (error) {
      console.error("Error loading settings:", error)
      toast.error("فشل تحميل الإعدادات")
    }
  }

  const handleAddBins = async () => {
    // Split by comma, space, or newline
    const bins = newBinsInput
      .split(/[\s,\n]+/)
      .map(bin => bin.trim())
      .filter(bin => bin.length === 4 && /^\d+$/.test(bin))

    if (bins.length === 0) {
      toast.error("يجب إدخال أرقام صحيحة (4 أرقام لكل بطاقة)")
      return
    }

    setLoading(true)
    try {
      for (const bin of bins) {
        await addBlockedCardBin(bin)
      }
      await loadSettings()
      setNewBinsInput("")
      toast.success(`تم إضافة ${bins.length} بطاقة محظورة`)
    } catch (error) {
      console.error("Error adding blocked BINs:", error)
      toast.error("فشل إضافة البطاقات")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveBin = async (bin: string) => {
    setLoading(true)
    try {
      await removeBlockedCardBin(bin)
      await loadSettings()
      toast.success("تم إزالة البطاقة المحظورة")
    } catch (error) {
      console.error("Error removing blocked BIN:", error)
      toast.error("فشل إزالة البطاقة")
    } finally {
      setLoading(false)
    }
  }

  const handleAddCountry = async () => {
    if (!selectedCountry) {
      toast.error("يرجى اختيار دولة")
      return
    }

    setLoading(true)
    try {
      await addAllowedCountry(selectedCountry)
      await loadSettings()
      setSelectedCountry("")
      toast.success("تم إضافة الدولة المسموحة")
    } catch (error) {
      console.error("Error adding allowed country:", error)
      toast.error("فشل إضافة الدولة")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveCountry = async (country: string) => {
    setLoading(true)
    try {
      await removeAllowedCountry(country)
      await loadSettings()
      toast.success("تم إزالة الدولة المسموحة")
    } catch (error) {
      console.error("Error removing allowed country:", error)
      toast.error("فشل إزالة الدولة")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm sm:p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold sm:text-2xl">⚙️ إعدادات النظام</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("cards")}
            className={`px-2 py-3 text-xs font-semibold transition-colors sm:px-6 sm:py-4 sm:text-base ${
              activeTab === "cards"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>حجب بطاقات الدفع</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("countries")}
            className={`px-2 py-3 text-xs font-semibold transition-colors sm:px-6 sm:py-4 sm:text-base ${
              activeTab === "countries"
                ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>تقييد الوصول حسب الدولة</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6">
          {activeTab === "cards" ? (
            <div className="space-y-6">
              {/* Title and Description */}
              <div className="text-center">
                <h3 className="mb-2 text-lg font-bold text-gray-800 sm:text-xl">قائمة حجب بطاقات الدفع</h3>
                <p className="text-sm text-gray-600">
                  أضف البيانات الخاصة بأرقام البطاقات التي لا تريده. يمكنك إضافة مجموعة من البيانات
                  <br className="hidden sm:block" />
                  مفصولة بفاصلة أو فاصلة أو سطر جديد. اضغط Enter لإضافة كل بلوك.
                </p>
              </div>

              {/* Multi-line Input */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <textarea
                  value={newBinsInput}
                  onChange={(e) => setNewBinsInput(e.target.value)}
                  placeholder="مثال: 4890, 4458, 4909&#10;أو كل رقم في سطر منفصل"
                  rows={4}
                  dir="ltr"
                  className="w-full resize-none rounded-lg border-2 border-gray-300 px-4 py-3 text-base font-mono focus:border-blue-500 focus:outline-none sm:text-lg"
                />
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    onClick={handleAddBins}
                    disabled={loading || !newBinsInput.trim()}
                    className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    <Plus className="w-5 h-5" />
                    حفظ
                  </button>
                  <button
                    onClick={() => setNewBinsInput("")}
                    className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>

              {/* Blocked BINs List as Badges */}
              <div>
                {settings.blockedCardBins.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>لا توجد بطاقات محظورة</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {settings.blockedCardBins.map((bin) => (
                      <div
                        key={bin}
                        className="bg-gray-100 border border-gray-300 rounded-full px-4 py-2 flex items-center gap-2"
                      >
                        <span className="font-mono text-sm font-semibold text-gray-700">
                          {bin}
                        </span>
                        <button
                          onClick={() => handleRemoveBin(bin)}
                          disabled={loading}
                          className="text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Title and Description */}
              <div className="text-center">
                <h3 className="mb-2 text-lg font-bold text-gray-800 sm:text-xl">تقييد الوصول حسب الدولة</h3>
                <p className="text-sm text-gray-600">
                  تحكم في الدول التي تسمح لها بالوصول إلى موقعك الإلكتروني للتعزيز الأمان.
                  <br className="hidden sm:block" />
                  يمكنك إضافة أكثر من دولة. وسيمنع الوصول من أي دولة غير موجودة في القائمة.
                </p>
              </div>

              {/* Country Dropdown */}
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  - الدول المسموح لها بالوصول -
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-3 text-base focus:border-purple-500 focus:outline-none"
                    dir="rtl"
                  >
                    <option value="">اختر دولة...</option>
                    {COUNTRIES.filter(c => !settings.allowedCountries.includes(c.code)).map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddCountry}
                    disabled={loading || !selectedCountry}
                    className="rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700 disabled:bg-gray-400"
                  >
                    حفظ
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  يمكنك إضافة أكثر من دولة غير موجودة في القائمة.
                </p>
              </div>

              {/* Allowed Countries List as Badges */}
              <div>
                {settings.allowedCountries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Globe className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>جميع الدول مسموحة (لم يتم تحديد قيود)</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {settings.allowedCountries.map((countryCode) => {
                      const country = COUNTRIES.find(c => c.code === countryCode)
                      return (
                        <div
                          key={countryCode}
                          className="bg-green-50 border border-green-300 rounded-full px-4 py-2 flex items-center gap-2"
                        >
                          <span className="text-lg">{country?.flag || "🌍"}</span>
                          <span className="text-sm font-semibold text-gray-700">
                            {country?.name || countryCode}
                          </span>
                          <button
                            onClick={() => handleRemoveCountry(countryCode)}
                            disabled={loading}
                            className="text-gray-500 hover:text-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-200 bg-gray-50 p-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  )
}
