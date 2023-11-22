import axios from 'axios'

export const getStrikeCount = async (address: string) => {
  const { data } = await axios.get<{ visitCount: number }>(`/api/addresses/${address}/strikes`)
  return data.visitCount
}

export const updateStrikeCount = async (address: string) => {
  if (process.env.NODE_ENV === 'development') {
    return 0
  }

  const response = await axios.put<{ visitCount: number }>(`/api/addresses/${address}/strikes`, { address })
  return response.data.visitCount
}
