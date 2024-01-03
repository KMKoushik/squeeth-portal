import { NextApiRequest, NextApiResponse } from 'next'

export type NextFunction = () => void

export type Middleware = (req: NextApiRequest, res: NextApiResponse, next: NextFunction) => Promise<void>

const execMiddlewares = async (req: NextApiRequest, res: NextApiResponse, middlewares: Middleware[], index = 0) => {
  if (res.headersSent || !middlewares[index]) {
    return
  }

  if (typeof middlewares[index] !== 'function') {
    res.status(500).end('Middleware must be a function!')
    throw new Error('Middleware must be a function!')
  }

  await middlewares[index](req, res, async () => {
    await execMiddlewares(req, res, middlewares, index + 1)
  })
}

export const handler =
  (...middlewares: Middleware[]) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    await execMiddlewares(req, res, middlewares)
  }
