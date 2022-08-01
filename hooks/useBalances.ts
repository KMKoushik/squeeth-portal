import { useContractReads } from 'wagmi'
import erc20Abi from '../abis/ERC20.json'

/**
 * For a list of address gets the ERC20 balance amount in single RPC
 *
 * @param addresses List of address to get approvals
 * @param erc20
 */
export const useBalances = (addresses: Array<string>, erc20: string) => {
  const contract = {
    addressOrName: erc20,
    contractInterface: erc20Abi,
  }

  const {
    refetch: getBalances,
    data,
    isLoading,
  } = useContractReads({
    contracts: addresses.map(addr => ({
      ...contract,
      functionName: 'balanceOf',
      args: [addr],
    })),
    enabled: false,
  })

  return { getBalances, data, isLoading }
}
