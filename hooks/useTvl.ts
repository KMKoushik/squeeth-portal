import * as React from 'react'
import { useProvider } from 'wagmi'
import useControllerStore from '../store/controllerStore'
import { convertBigNumber } from '../utils/math'
import useController from './useController'
import useIsMounted from './useIsMounted'

const useTvl = () => {
  const { controller } = useController()
  const isControllerLoaded = useControllerStore(s => s.loaded)
  const provider = useProvider()
  const isMounted = useIsMounted()

  const [tvl, setTvl] = React.useState(0)

  const updateTvl = React.useCallback(async () => {
    const ethBalance = await provider.getBalance(controller.address)

    if (isMounted()) {
      const bal = convertBigNumber(ethBalance)
      setTvl(bal)
    }
  }, [controller.address, isMounted, provider])

  React.useEffect(() => {
    if (isControllerLoaded) updateTvl()
  }, [controller, provider, updateTvl, isControllerLoaded])

  return tvl
}

export default useTvl
