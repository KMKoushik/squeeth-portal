import * as React from 'react'
import { useContract, useProvider, useSigner } from 'wagmi'
import { ERC20 } from '../types/contracts'
import erc20Abi from '../abis/erc20.json'

const useERC20 = (address: string) => {
  const [{ data, error, loading }] = useSigner()

  const erc20 = useContract<ERC20>({
    addressOrName: address,
    contractInterface: erc20Abi,
    signerOrProvider: data,
  })

  return { erc20, erc20Loading: loading }
}

export default useERC20
