import { CHAIN_ID } from './numbers'

export enum NETWORK {
  MAINNET = 1,
  ROPSTEN = 3,
}

const getAddress = (addr: { 1: string; 3: string }) => {
  return addr[CHAIN_ID as NETWORK]!
}

export const CONTROLLER = getAddress({
  1: '0x64187ae08781B09368e6253F9E94951243A493D5',
  3: '0x59F0c781a6eC387F09C40FAA22b7477a2950d209',
})

export const OSQUEETH = getAddress({
  1: '0xf1B99e3E573A1a9C5E6B2Ce818b617F0E664E86B',
  3: '0xa4222f78d23593e82Aa74742d25D06720DCa4ab7',
})

export const CRAB_STRATEGY = getAddress({
  1: '0xf205ad80bb86ac92247638914265887a8baa437d',
  3: '0xbffBD99cFD9d77c49595dFe8eB531715906ca4Cf',
})

export const ORACLE = getAddress({
  1: '0x65D66c76447ccB45dAf1e8044e918fA786A483A1',
  3: '0xBD9F4bE886653177D22fA9c79FD0DFc41407fC89',
})

export const SQUEETH_UNI_POOL = getAddress({
  1: '0x82c427AdFDf2d245Ec51D8046b41c4ee87F0d29C',
  3: '0x921c384F79de1BAe96d6f33E3E5b8d0B2B34cb68',
})

export const WETH = getAddress({
  1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  3: '0xc778417e063141139fce010982780140aa0cd5ab',
})
