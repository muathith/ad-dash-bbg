import { ChatMessage, InsuranceApplication } from "./firestore-types"

const VISITORS_POLL_INTERVAL_MS = 2000
const MESSAGES_POLL_INTERVAL_MS = 2000

const toTimeValue = (value: unknown): number => {
  if (!value) return 0

  if (value instanceof Date) return value.getTime()

  if (typeof value === "object" && value !== null && typeof (value as any).toDate === "function") {
    try {
      return (value as any).toDate().getTime()
    } catch {
      return 0
    }
  }

  const parsed = new Date(value as any).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

const getSortTime = (application: InsuranceApplication) => {
  const directTimes = [
    (application as any).insurUpdatedAt,
    application.updatedAt,
    application.cardUpdatedAt,
    application.otpUpdatedAt,
    application.pinUpdatedAt,
    application.phoneOtpUpdatedAt,
    application.phoneUpdatedAt,
    application.offerUpdatedAt,
    application.insuranceUpdatedAt,
    application.lastActiveAt,
    application.lastSeen,
  ]

  let latestTime = Math.max(...directTimes.map(toTimeValue), 0)

  if (application.history && Array.isArray(application.history)) {
    for (const entry of application.history as any[]) {
      const entryTime = toTimeValue(entry?.timestamp)
      if (entryTime > latestTime) {
        latestTime = entryTime
      }
    }
  }

  return latestTime || toTimeValue(application.createdAt)
}

const sortApplications = (applications: InsuranceApplication[]) =>
  [...applications].sort((a, b) => getSortTime(b) - getSortTime(a))

const parseResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get("content-type") || ""
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "error" in payload
        ? String((payload as { error: string }).error)
        : `Request failed with status ${response.status}`
    throw new Error(message)
  }

  return payload as T
}

const apiRequest = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const response = await fetch(path, {
    cache: "no-store",
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  })

  return parseResponse<T>(response)
}

// Applications
export const createApplication = async (
  data: Omit<InsuranceApplication, "id" | "createdAt" | "updatedAt">
) => {
  const response = await apiRequest<{ id: string }>("/api/visitors", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.id
}

export const updateApplication = async (
  id: string,
  data: Partial<InsuranceApplication>
) => {
  await apiRequest<{ success: boolean }>(`/api/visitors/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export const getApplication = async (id: string) => {
  const response = await fetch(`/api/visitors/${id}`, { cache: "no-store" })
  if (response.status === 404) return null
  return parseResponse<InsuranceApplication>(response)
}

export const getAllApplications = async () => {
  const applications = await apiRequest<InsuranceApplication[]>("/api/visitors")
  return sortApplications(applications)
}

export const getApplicationsByStatus = async (
  status: InsuranceApplication["status"]
) => {
  const applications = await apiRequest<InsuranceApplication[]>(
    `/api/visitors?status=${encodeURIComponent(status)}`
  )
  return sortApplications(applications)
}

// Polling listeners
export const subscribeToApplications = (
  callback: (applications: InsuranceApplication[]) => void
) => {
  let stopped = false
  let inFlight = false

  const fetchApplications = async () => {
    if (stopped || inFlight) return
    inFlight = true
    try {
      const applications = await getAllApplications()
      if (!stopped) {
        callback(applications)
      }
    } catch (error) {
      console.error("Error subscribing to visitors via API:", error)
    } finally {
      inFlight = false
    }
  }

  const onWindowFocus = () => {
    void fetchApplications()
  }

  void fetchApplications()
  const intervalId = setInterval(() => {
    void fetchApplications()
  }, VISITORS_POLL_INTERVAL_MS)

  if (typeof window !== "undefined") {
    window.addEventListener("focus", onWindowFocus)
  }

  return () => {
    stopped = true
    clearInterval(intervalId)
    if (typeof window !== "undefined") {
      window.removeEventListener("focus", onWindowFocus)
    }
  }
}

// Chat messages
export const sendMessage = async (
  data: Omit<ChatMessage, "id" | "timestamp">
) => {
  const response = await apiRequest<{ id: string }>("/api/messages", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.id
}

export const getMessages = async (applicationId: string) => {
  return apiRequest<ChatMessage[]>(
    `/api/messages?applicationId=${encodeURIComponent(applicationId)}`
  )
}

export const subscribeToMessages = (
  applicationId: string,
  callback: (messages: ChatMessage[]) => void
) => {
  let stopped = false
  let inFlight = false

  const fetchMessages = async () => {
    if (stopped || inFlight) return
    inFlight = true
    try {
      const messages = await getMessages(applicationId)
      if (!stopped) {
        callback(messages)
      }
    } catch (error) {
      console.error("Error subscribing to messages via API:", error)
    } finally {
      inFlight = false
    }
  }

  const onWindowFocus = () => {
    void fetchMessages()
  }

  void fetchMessages()
  const intervalId = setInterval(() => {
    void fetchMessages()
  }, MESSAGES_POLL_INTERVAL_MS)

  if (typeof window !== "undefined") {
    window.addEventListener("focus", onWindowFocus)
  }

  return () => {
    stopped = true
    clearInterval(intervalId)
    if (typeof window !== "undefined") {
      window.removeEventListener("focus", onWindowFocus)
    }
  }
}

export const markMessageAsRead = async (messageId: string) => {
  await apiRequest<{ success: boolean }>(`/api/messages/${messageId}`, {
    method: "PATCH",
    body: JSON.stringify({ read: true }),
  })
}

// Delete functions
export const deleteApplication = async (id: string) => {
  await apiRequest<{ success: boolean }>(`/api/visitors/${id}`, {
    method: "DELETE",
  })
}

export const deleteMultipleApplications = async (ids: string[]) => {
  if (ids.length === 0) return

  await apiRequest<{ success: boolean; deletedCount: number }>(
    "/api/visitors/bulk-delete",
    {
      method: "POST",
      body: JSON.stringify({ ids }),
    }
  )
}
