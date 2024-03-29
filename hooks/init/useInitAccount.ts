import { BigNumber } from 'ethers'
import React from 'react'
import { useContractReads } from 'wagmi'
import { OSQUEETH_CONTRACT, WETH_CONTRACT, CRAB_V2_CONTRACT } from '../../constants/contracts'
import { BIG_ZERO } from '../../constants/numbers'
import useAccountStore from '../../store/accountStore'

const useInitAccount = () => {
  const address = useAccountStore(s => s.address)
  const setOsqthBalance = useAccountStore(s => s.setOsqthBalance)
  const setWethBalance = useAccountStore(s => s.setWethBalance)
  const setCrabBalance = useAccountStore(s => s.setCrabBalance)

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
      {
        ...CRAB_V2_CONTRACT,
        functionName: 'balanceOf',
        args: [address],
      },
    ],
  })

  React.useEffect(() => {
    if (isLoading || !data) return

    setOsqthBalance((data[0] as unknown as BigNumber) || BIG_ZERO)
    setWethBalance((data[1] as unknown as BigNumber) || BIG_ZERO)
    setCrabBalance((data[2] as unknown as BigNumber) || BIG_ZERO)
  }, [data, isLoading, setOsqthBalance, setWethBalance, setCrabBalance])
}

export default useInitAccount
