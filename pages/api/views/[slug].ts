import { NextApiRequest, NextApiResponse } from 'next'
import { TablePages } from '../../../constants/analytics'
import { SupabaseAdmin } from '../../../lib/supabase-admin'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    await SupabaseAdmin.rpc(TablePages.procedure, { page_slug: req.query.slug })
    return res.status(201).json({
      message: `Successfully incremented page: ${req.query.slug}`,
    })
  }

  if (req.method === 'GET') {
    const { data } = await SupabaseAdmin.from(TablePages.dbName).select()

    if (data) {
      return res.status(200).send(data)
    }
  }

  return res.status(400).json({
    message: 'Unsupported Request',
  })
}
