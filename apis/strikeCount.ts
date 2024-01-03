import axios from 'axios'

export const getStrikeCount = async (address: string) => {
  const addressLowercase = address.toLowerCase()
  const { data } = await axios.get<{ visitCount: number }>(`/api/addresses/${addressLowercase}/strikes`)
  return data.visitCount
}

export const updateStrikeCount = async (address: string) => {
  const addressLowercase = address.toLowerCase()
  const response = await axios.put<{ visitCount: number }>(`/api/addresses/${addressLowercase}/strikes`, { address })
  return response.data.visitCount
}
