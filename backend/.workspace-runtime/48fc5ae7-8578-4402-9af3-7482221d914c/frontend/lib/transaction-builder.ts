import type { Token } from "@/lib/types"

export interface SwapTransaction {
  from: string
  to: string
  fromAmount: number
  toAmount: number
  fee: number
  minReceive: number
  deadline: number
}

export class TransactionBuilder {
  static buildBuyTransaction(
    walletAddress: string,
    token: Token,
    adaAmount: number,
    slippage: number,
  ): SwapTransaction {
    const tokenAmount = adaAmount / token.price
    const fee = (adaAmount * token.creatorFee) / 100
    const minReceive = tokenAmount * (1 - slippage / 100)

    return {
      from: walletAddress,
      to: token.id,
      fromAmount: adaAmount,
      toAmount: tokenAmount,
      fee: fee,
      minReceive: minReceive,
      deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    }
  }

  static buildSellTransaction(
    walletAddress: string,
    token: Token,
    tokenAmount: number,
    slippage: number,
  ): SwapTransaction {
    const adaAmount = tokenAmount * token.price * 0.97 // Apply 3% slippage
    const minReceive = adaAmount * (1 - slippage / 100)
    const fee = 0 // Fees applied on buy side

    return {
      from: walletAddress,
      to: walletAddress,
      fromAmount: tokenAmount,
      toAmount: adaAmount,
      fee: fee,
      minReceive: minReceive,
      deadline: Math.floor(Date.now() / 1000) + 3600,
    }
  }

  static calculateSlippage(amount: number, percentage: number): number {
    return amount * (percentage / 100)
  }

  static calculatePriceImpact(initialPrice: number, finalPrice: number): number {
    return ((finalPrice - initialPrice) / initialPrice) * 100
  }
}
