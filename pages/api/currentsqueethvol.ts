import axios from 'axios'
import type { NextApiRequest, NextApiResponse } from 'next'

import { handler } from '../../server/utils/middleware'
import { restrictAccessMiddleware } from '../../server/middlewares/restrict-access'

const SQUEETH_VOL_API = process.env.SQUEETH_VOL_API_BASE_URL

async function requestHandler(req: NextApiRequest, res: NextApiResponse) {
  if (!SQUEETH_VOL_API) {
    res.status(400).json({ status: 'error', message: 'Error fetching information' })
    return
  }

  const jsonResponse = await axios.get(`${SQUEETH_VOL_API}/get_squeeth_iv`)
  res.status(200).json(jsonResponse.data['squeethVol'])
}

export default handler(restrictAccessMiddleware, requestHandler)
