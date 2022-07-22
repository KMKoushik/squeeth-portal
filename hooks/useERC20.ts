import * as React from 'react'
import { useContract, useSigner } from 'wagmi'
import { ERC20 } from '../types/contracts'
import erc20Abi from '../abis/ERC20.json'

const useERC20 = (address: string) => {
  const { data, isLoading } = useSigner()

  const erc20 = useContract<ERC20>({
    addressOrName: address,
    contractInterface: erc20Abi,
    signerOrProvider: data,
  })

  return { erc20, erc20Loading: isLoading }
}

export default useERC20
