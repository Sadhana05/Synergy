export type CurveType = "linear" | "exponential" | "sigmoid"

export function calculatePrice(supply: number, curveType: CurveType, basePrice = 0.0001, k = 0.00001): number {
  switch (curveType) {
    case "linear":
      return basePrice + k * supply
    case "exponential":
      return basePrice * Math.pow(1 + k, supply / 1000000)
    case "sigmoid":
      const midpoint = 50000000
      const steepness = 0.0000001
      return basePrice * (1 + 1 / (1 + Math.exp(-steepness * (supply - midpoint))))
    default:
      return basePrice
  }
}

export function calculateBuyPrice(
  currentSupply: number,
  amount: number,
  curveType: CurveType,
  reserveAda: number,
): { totalCost: number; avgPrice: number; priceImpact: number } {
  const currentPrice = calculatePrice(currentSupply, curveType)
  const newPrice = calculatePrice(currentSupply + amount, curveType)
  const avgPrice = (currentPrice + newPrice) / 2
  const totalCost = avgPrice * amount
  const priceImpact = ((newPrice - currentPrice) / currentPrice) * 100

  return { totalCost, avgPrice, priceImpact }
}

export function calculateSellPrice(
  currentSupply: number,
  amount: number,
  curveType: CurveType,
  reserveAda: number,
): { totalReturn: number; avgPrice: number; priceImpact: number } {
  const currentPrice = calculatePrice(currentSupply, curveType)
  const newPrice = calculatePrice(currentSupply - amount, curveType)
  const avgPrice = (currentPrice + newPrice) / 2
  const totalReturn = avgPrice * amount * 0.97 // 3% slippage
  const priceImpact = ((currentPrice - newPrice) / currentPrice) * 100

  return { totalReturn, avgPrice, priceImpact }
}
