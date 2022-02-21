import * as React from 'react'
import { useContract, useProvider } from 'wagmi'
import { ORACLE } from '../constants/address'
import { Oracle } from '../types/contracts'
import oracleAbi from '../abis/oracle.json'

const useOracle = () => {
  const provider = useProvider()

  const oracleContract = useContract<Oracle>({
    addressOrName: ORACLE,
    contractInterface: oracleAbi,
    signerOrProvider: provider,
  })

  return oracleContract
}

export default useOracle
