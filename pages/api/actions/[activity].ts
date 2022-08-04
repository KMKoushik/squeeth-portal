import { NextApiRequest, NextApiResponse } from 'next'
import { TableActivity } from '../../../constants/analytics'
import { SupabaseAdmin } from '../../../lib/supabase-admin'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST' || req.method === 'DELETE') {
    await SupabaseAdmin.rpc(TableActivity.procedure, { activity_name: req.query.activity })
    return res.status(201).json({
      message: `Successfully incremented action: ${req.query.activity}`,
    })
  }

  if (req.method === 'GET') {
    const { data } = await SupabaseAdmin.from(TableActivity.dbName).select()

    if (data) {
      return res.status(200).send(data)
    }
  }

  return res.status(400).json({
    message: 'Unsupported Request',
  })
}
