import { Box, Link } from '@mui/material'
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import shallow from 'zustand/shallow'

import { Modal } from '../components/Modal'
import useAccountStore from '../store/accountStore'

interface StrikeWarningModalProps {
  setIsStrikeModalShownOnce: (value: boolean) => void
}

const StrikeWarningModal: React.FC<StrikeWarningModalProps> = ({ setIsStrikeModalShownOnce }) => {
  const [isOpen, setIsOpen] = useState(true)

  const onClose = () => {
    setIsOpen(false)
    setIsStrikeModalShownOnce(true)
  }

  return (
    <Modal title="You are accessing from a restricted territory" open={isOpen} handleClose={onClose}>
      <Box px="4px">
        Any attempt to connect your wallet, including page refreshes, will be considered a strike. After three strikes,
        your wallet address will be blocked.
        <br />
        <br />
        Please be aware that refreshing the page will not resolve the issue, but will instead count towards your
        strikes. Review our{' '}
        <Link href="https://opyn.co/terms-of-service" target="_blank">
          Terms of Service
        </Link>{' '}
        for more details.
      </Box>
    </Modal>
  )
}

interface StrikeCountModalProps {
  setIsStrikeModalShownOnce: (value: boolean) => void
}

const StrikeCountModal: React.FC<StrikeCountModalProps> = ({ setIsStrikeModalShownOnce }) => {
  const { strikeCount, isStrikeCountModalOpen, setIsStrikeCountModalOpen } = useAccountStore(
    s => ({
      strikeCount: s.strikeCount,
      isStrikeCountModalOpen: s.isStrikeCountModalOpen,
      setIsStrikeCountModalOpen: s.setIsStrikeCountModalOpen,
    }),
    shallow,
  )

  const onClose = () => {
    setIsStrikeCountModalOpen(false)
    setIsStrikeModalShownOnce(true)
  }

  if (strikeCount < 3) {
    return (
      <Modal title="Strike Count Warning" open={isStrikeCountModalOpen} handleClose={onClose}>
        <Box px="4px">
          You have attempted to access opyn.co from a restricted territory. You currently have {strikeCount} strike(s).
          After three strikes your wallet address will be blocked.
          <br />
          <br />
          Please review our{' '}
          <Link href="https://opyn.co/terms-of-service" target="_blank">
            Terms of Service
          </Link>{' '}
          for more details.
        </Box>
      </Modal>
    )
  } else {
    return (
      <Modal title="Account blocked" open={isStrikeCountModalOpen} handleClose={onClose}>
        <Box px="4px">
          You have attempted to access opyn.co from a restricted territory 3 times. Your wallet address is blocked for
          violating our terms of service. You cannot open any new positions. You can still close positions and remove
          collateral from vaults.
          <br />
          <br />
          Please review our{' '}
          <Link href="https://opyn.co/terms-of-service" target="_blank">
            Terms of Service
          </Link>{' '}
          for more details.
        </Box>
      </Modal>
    )
  }
}

export default function StrikeModalManager() {
  const [showModal, setShowModal] = useState(false)

  const [isStrikeModalShownOnce, setIsStrikeModalShownOnce] = useState(false)
  const isRestricted = useAccountStore(s => s.isRestricted)
  const { isConnected } = useAccount()

  // delayed state change - show modal after 2 seconds
  // this is because it takes some time to automatically connect the wallet (incase previously connected)
  useEffect(() => {
    if (isRestricted) {
      const timerId = setTimeout(() => setShowModal(true), 2_000)
      // cleanup function to clear the timeout if the component is unmounted before the delay is over.
      return () => clearTimeout(timerId)
    }
  }, [isRestricted])

  if (showModal) {
    if (isConnected) {
      return <StrikeCountModal setIsStrikeModalShownOnce={setIsStrikeModalShownOnce} />
    }
    if (!isStrikeModalShownOnce) {
      return <StrikeWarningModal setIsStrikeModalShownOnce={setIsStrikeModalShownOnce} />
    }
  }
  return null
}
