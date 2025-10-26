/**
 * Utility functions for detecting asset types from ticker symbols
 */

const CRYPTO_SYMBOLS = new Set([
  'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE', 'DOT', 'MATIC', 'AVAX',
  'LINK', 'UNI', 'ATOM', 'LTC', 'BCH', 'XLM', 'ALGO', 'VET', 'ICP', 'FIL',
  'TRX', 'ETC', 'XMR', 'NEAR', 'APT', 'ARB', 'OP', 'SHIB', 'PEPE', 'WIF',
])

const COMMODITY_SYMBOLS = new Set([
  'BRENT', 'WTI', 'GOLD', 'SILVER', 'COPPER', 'PLATINUM', 'PALLADIUM',
  'NATURAL_GAS', 'WHEAT', 'CORN', 'SOYBEANS', 'COFFEE', 'SUGAR', 'COTTON',
])

/**
 * Detect if a ticker is a cryptocurrency
 */
export function isCrypto(ticker: string): boolean {
  const normalized = ticker.toUpperCase().replace(/-USD$/, '')
  return CRYPTO_SYMBOLS.has(normalized)
}

/**
 * Detect if a ticker is a commodity
 */
export function isCommodity(ticker: string): boolean {
  const normalized = ticker.toUpperCase()
  return COMMODITY_SYMBOLS.has(normalized)
}

/**
 * Get the asset class for a ticker
 */
export function getAssetClass(ticker: string): 'crypto' | 'commodity' | 'equity' {
  if (isCrypto(ticker)) return 'crypto'
  if (isCommodity(ticker)) return 'commodity'
  return 'equity'
}

/**
 * Format volume based on asset class
 * - Crypto: Show token units with USD equivalent
 * - Equity: Show share count
 * - Commodity: Hide (not applicable)
 */
export function formatVolume(
  volume: number | null,
  assetClass: 'crypto' | 'commodity' | 'equity',
  ticker: string,
  price?: number
): string | null {
  if (volume === null || volume <= 0) return null

  const formatCompactNumber = (value: number): string => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
    return `${Math.floor(value)}`
  }

  switch (assetClass) {
    case 'crypto': {
      // For crypto, volume is in token units from a single exchange
      // Show both token count and USD value if price is available
      const tokenSymbol = ticker.toUpperCase().replace(/-USD$/, '')
      const tokenVolume = formatCompactNumber(volume)

      if (price && price > 0) {
        const usdVolume = volume * price
        const usdFormatted = formatCompactNumber(usdVolume)
        return `${tokenVolume} ${tokenSymbol} (~$${usdFormatted})`
      }

      return `${tokenVolume} ${tokenSymbol}`
    }

    case 'equity': {
      // For stocks, volume is share count
      return formatCompactNumber(volume)
    }

    case 'commodity': {
      // Commodities don't have meaningful volume data
      return null
    }

    default:
      return formatCompactNumber(volume)
  }
}

