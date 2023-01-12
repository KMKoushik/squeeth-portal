const SAFE_API = 'https://safe-transaction-mainnet.safe.global/api/v1/'

export const getTxFromSafeTxHash = async (safeTxHash: string) => {
  const resp = await fetch(`${SAFE_API}multisig-transactions/${safeTxHash}`)
  if (resp.ok) {
    const data = await resp.json()
    return data.transactionHash
  }

  return null
}
