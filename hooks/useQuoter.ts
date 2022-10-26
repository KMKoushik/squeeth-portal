import * as React from 'react'
import { useContract, useProvider } from 'wagmi'
import { ORACLE, QUOTER } from '../constants/address'
import { Oracle, Quoter } from '../types/contracts'
import oracleAbi from '../abis/oracle.json'
import { QUOTER_CONTRACT } from '../constants/contracts'

const useQuoter = () => {
  const provider = useProvider()

  const quoterContract = useContract<Quoter>({
    ...QUOTER_CONTRACT,
    signerOrProvider: provider,
  })

  return quoterContract
}

export default useQuoter
