import { Box } from '@mui/system'
import { NextPage } from 'next'
import Head from 'next/head'
import React, { useState } from 'react'
import { useContractWrite } from 'wagmi'
import { Nav } from '../components/navbars/Nav'
import { NettingAdmin } from '../container/CrabV2/Netting/NettingAdmin'
import { useInitCrabNetting } from '../hooks/init/useInitCrabNetting'
import { useInitCrabV2 } from '../hooks/useCrabV2'
import eulerETokenAbi from '../abis/eulerEToken.json'
import eulerDTokenAbi from '../abis/eulerDToken.json'

const NettingAdminPage: NextPage = () => {
  const [usdc, setUsdc] = useState('0')
  const [weth, setWeth] = useState('0')

  const { writeAsync: deposit } = useContractWrite({
    addressOrName: '0x19EB4AC774bB84Fe725cffB9F71D79ab2fB4E12a',
    contractInterface: eulerETokenAbi,
    functionName: 'deposit',
    args: [],
  })

  const { writeAsync: borrow } = useContractWrite({
    addressOrName: '0x1e4c142Fd7CD21193039c53991d121e00FfaB4f2',
    contractInterface: eulerDTokenAbi,
    functionName: 'borrow',
    args: [],
  })

  const depositClick = () => {
    deposit({
      args: [0, usdc],
      overrides: {
        gasLimit: 5000000,
      },
    })
  }

  const borrowClick = () => {
    borrow({
      args: [0, weth],
      overrides: {
        gasLimit: 5000000,
      },
    })
  }

  return (
    <div>
      <Head>
        <title>Squeeth Portal - Netting admin</title>
      </Head>
      <Nav />
      <Box px={30} py={5}>
        <div>Euler things</div>
        <div> Supply USDC</div>
        <input value={usdc} onChange={e => setUsdc(e.target.value)} />

        <button onClick={depositClick}>Submit</button>

        <div> borrow WETH</div>
        <input value={weth} onChange={e => setWeth(e.target.value)} />

        <button onClick={borrowClick}>Submit</button>
      </Box>
    </div>
  )
}

export default NettingAdminPage
