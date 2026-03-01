export interface Settings {
  blockedCardBins: string[] // First 4 digits of blocked cards
  allowedCountries: string[] // ISO 3-letter country codes (e.g., SAU, ARE, KWT)
}

const defaultSettings: Settings = {
  blockedCardBins: [],
  allowedCountries: [],
}

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

const getSettingsFromApi = async () => {
  const response = await fetch("/api/settings", { cache: "no-store" })
  return parseResponse<Settings>(response)
}

const patchSettings = async (updates: Partial<Settings>) => {
  const response = await fetch("/api/settings", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  })

  return parseResponse<Settings>(response)
}

/**
 * Get current settings from API
 */
export async function getSettings(): Promise<Settings> {
  try {
    return await getSettingsFromApi()
  } catch (error) {
    console.error("Error getting settings:", error)
    return defaultSettings
  }
}

/**
 * Update blocked card BINs
 */
export async function updateBlockedCardBins(bins: string[]): Promise<void> {
  try {
    await patchSettings({
      blockedCardBins: bins
        .map((bin) => bin.trim())
        .filter((bin) => /^\d{4}$/.test(bin)),
    })
  } catch (error) {
    console.error("Error updating blocked card BINs:", error)
    throw error
  }
}

/**
 * Add a blocked card BIN
 */
export async function addBlockedCardBin(bin: string): Promise<void> {
  try {
    const normalizedBin = bin.trim()
    if (!/^\d{4}$/.test(normalizedBin)) return

    const settings = await getSettings()
    if (!settings.blockedCardBins.includes(normalizedBin)) {
      const updatedBins = [...settings.blockedCardBins, normalizedBin]
      await updateBlockedCardBins(updatedBins)
    }
  } catch (error) {
    console.error("Error adding blocked card BIN:", error)
    throw error
  }
}

/**
 * Remove a blocked card BIN
 */
export async function removeBlockedCardBin(bin: string): Promise<void> {
  try {
    const settings = await getSettings()
    const updatedBins = settings.blockedCardBins.filter(b => b !== bin.trim())
    await updateBlockedCardBins(updatedBins)
  } catch (error) {
    console.error("Error removing blocked card BIN:", error)
    throw error
  }
}

/**
 * Update allowed countries
 */
export async function updateAllowedCountries(countries: string[]): Promise<void> {
  try {
    await patchSettings({
      allowedCountries: countries
        .map((country) => country.trim().toUpperCase())
        .filter((country) => country.length > 0),
    })
  } catch (error) {
    console.error("Error updating allowed countries:", error)
    throw error
  }
}

/**
 * Add an allowed country
 */
export async function addAllowedCountry(country: string): Promise<void> {
  try {
    const settings = await getSettings()
    const upperCountry = country.toUpperCase()
    if (!settings.allowedCountries.includes(upperCountry)) {
      const updatedCountries = [...settings.allowedCountries, upperCountry]
      await updateAllowedCountries(updatedCountries)
    }
  } catch (error) {
    console.error("Error adding allowed country:", error)
    throw error
  }
}

/**
 * Remove an allowed country
 */
export async function removeAllowedCountry(country: string): Promise<void> {
  try {
    const settings = await getSettings()
    const updatedCountries = settings.allowedCountries.filter(c => c !== country.toUpperCase())
    await updateAllowedCountries(updatedCountries)
  } catch (error) {
    console.error("Error removing allowed country:", error)
    throw error
  }
}

/**
 * Check if a card BIN is blocked
 */
export async function isCardBlocked(cardNumber: string): Promise<boolean> {
  try {
    const settings = await getSettings()
    const bin = cardNumber.replace(/\s/g, "").substring(0, 4)
    return settings.blockedCardBins.includes(bin)
  } catch (error) {
    console.error("Error checking if card is blocked:", error)
    return false
  }
}

/**
 * Check if a country is allowed
 */
export async function isCountryAllowed(countryCode: string): Promise<boolean> {
  try {
    const settings = await getSettings()
    // If no countries are set, allow all
    if (settings.allowedCountries.length === 0) {
      return true
    }
    return settings.allowedCountries.includes(countryCode.toUpperCase())
  } catch (error) {
    console.error("Error checking if country is allowed:", error)
    return true // Default to allowing if error
  }
}
