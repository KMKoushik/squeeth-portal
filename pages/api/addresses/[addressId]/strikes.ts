import { NextApiRequest, NextApiResponse } from 'next'
import { getAddressVisitCount, incrementAddressVisitCount } from '../../../../server/utils/firebase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const addressId = req.query.addressId as string

  if (req.method === 'GET') {
    try {
      const visitCount = await getAddressVisitCount(addressId)
      return res.status(200).json({ visitCount })
    } catch (e) {
      console.error(e)
      return res.status(400).json({ message: 'Invalid address' })
    }
  }

  if (req.method === 'PUT') {
    // expecting requests to come from the same origin, forbidding other requests
    const isSameOrigin = req.headers.referer && req.headers.origin && req.headers.referer.startsWith(req.headers.origin)
    if (!isSameOrigin) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    try {
      const visitCount = await incrementAddressVisitCount(addressId)
      return res.status(200).json({ visitCount })
    } catch (e) {
      console.error(e)
      return res.status(400).json({ message: 'Invalid address' })
    }
  }

  return res.status(400).json({ message: 'Invalid method' })
}
