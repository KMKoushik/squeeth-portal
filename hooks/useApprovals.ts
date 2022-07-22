import { useContractReads } from 'wagmi'
import erc20Abi from '../abis/ERC20.json'

/**
 * For a list of address gets the approval amount in single RPC
 *
 * @param addresses List of address to get approvals
 * @param erc20
 * @param spender
 */
export const useApprovals = (addresses: Array<string>, erc20: string, spender: string) => {
  const contract = {
    addressOrName: erc20,
    contractInterface: erc20Abi,
  }

  const {
    refetch: getApprovals,
    data,
    isLoading,
  } = useContractReads({
    contracts: addresses.map(addr => ({
      ...contract,
      functionName: 'allowance',
      args: [addr, spender],
    })),
    enabled: false,
  })

  return { getApprovals, data, isLoading }
}

export default useApprovals
