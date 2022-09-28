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

export const WETH_USDC_POOL = getAddress({
  1: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8',
  3: '0x8356AbC730a218c24446C2c85708F373f354F0D8',
})

export const USDC = getAddress({
  1: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  3: '0x27415c30d8c87437becbd4f98474f26e712047f4',
})

export const CRAB_MIGRATION = getAddress({
  1: '0xa1cab67a4383312718a5799eaa127906e9d4b19e',
  3: '0xD0fb9d47B5F65d76C6bDf1b9E43a4A2345080B2f',
})

export const CRAB_STRATEGY_V2 = getAddress({
  1: '0x3b960e47784150f5a63777201ee2b15253d713e8',
  3: '0xdd1e9c25115e0d6e531d9f9e6ab7dbbed15158ce',
})

export const CRAB_OTC = getAddress({
  1: '0x3b960e47784150f5a63777201ee2b15253d713e8',
  3: '0xed6d543F6DfaEBAf6b8291CEb57d5273173c03AC',
})
