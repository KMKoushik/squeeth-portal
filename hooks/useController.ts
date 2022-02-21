import * as React from 'react'
import { useContract, useProvider } from 'wagmi'
import { CONTROLLER } from '../constants/address'
import { Controller } from '../types/contracts'
import controllerAbi from '../abis/controller.json'
import useControllerStore from '../store/controllerStore'
import { INDEX_SCALE } from '../constants/numbers'

const useController = () => {
  const provider = useProvider()
  const setNf = useControllerStore(s => s.setNormFactor)
  const setIndexPrice = useControllerStore(s => s.setIndexPrice)
  const setMarkPrice = useControllerStore(s => s.setMarkPrice)
  const setLoaded = useControllerStore(s => s.setLoaded)
  const loaded = useControllerStore(state => state.loaded)

  const controller = useContract<Controller>({
    addressOrName: CONTROLLER,
    contractInterface: controllerAbi,
    signerOrProvider: provider,
  })

  const updateControllerData = React.useCallback(async () => {
    const p1 = controller.getExpectedNormalizationFactor()
    const p2 = controller.getIndex(1)
    const p3 = controller.getDenormalizedMark(1)

    const [_nf, _index, _mark] = await Promise.all([p1, p2, p3])
    setNf(_nf)
    setIndexPrice(_index.mul(INDEX_SCALE).mul(INDEX_SCALE))
    setMarkPrice(_mark.mul(INDEX_SCALE).mul(INDEX_SCALE))
    setLoaded(true)
  }, [controller, setIndexPrice, setLoaded, setMarkPrice, setNf])

  React.useEffect(() => {
    if (!loaded) updateControllerData()
  }, [loaded, updateControllerData])

  return {
    controller,
  }
}

export default useController
