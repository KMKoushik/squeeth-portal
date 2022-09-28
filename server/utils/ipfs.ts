import { create } from 'ipfs-http-client'

const projectId = '2FHljBP4uOS1xM4h2cnNsQ3HR2r'
const projectSecret = '03df89840f96e6f06aba0b36941e2ef7'
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64')

export const ipfsClient = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
})
