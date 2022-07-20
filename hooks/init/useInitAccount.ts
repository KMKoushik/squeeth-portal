import { BigNumber } from 'ethers'
import React from 'react'
import { useContractReads } from 'wagmi'
import { OSQUEETH_CONTRACT, WETH_CONTRACT } from '../../constants/contracts'
import useAccountStore from '../../store/accountStore'

const useInitAccount = () => {
  const address = useAccountStore(s => s.address)
  const setOsqthBalance = useAccountStore(s => s.setOsqthBalance)
  const setWethBalance = useAccountStore(s => s.setWethBalance)

  const { data, isLoading } = useContractReads({
    contracts: [
      {
        ...OSQUEETH_CONTRACT,
        functionName: 'balanceOf',
        args: [address],
      },
      {
        ...WETH_CONTRACT,
        functionName: 'balanceOf',
        args: [address],
      },
    ],
  })

  React.useEffect(() => {
    if (!isLoading || !data) return

    setOsqthBalance(data[0] as unknown as BigNumber)
    setWethBalance(data[1] as unknown as BigNumber)
  }, [data, isLoading, setOsqthBalance, setWethBalance])
}

export default useInitAccount