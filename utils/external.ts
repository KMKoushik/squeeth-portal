export const getDvolIndexDeribit = async (deribitBaseUrl: string | undefined) => {
  if (!deribitBaseUrl) return 0

  const endPeriodTimestamp = Date.now()
  const startPeriodTimestamp = endPeriodTimestamp - 1000 * 60 // 1 min ago
  const response = await fetch(
    `${deribitBaseUrl}/api/v2/public/get_volatility_index_data?currency=ETH&end_timestamp=${endPeriodTimestamp}&resolution=1D&start_timestamp=${startPeriodTimestamp}`,
  )
  const jsonData = await response.json()

  return jsonData.result.data[0][4]
}

export const getoSqthRefVolIndex = async (): Promise<number> => {
  const response = await fetch(`/api/currentsqueethvol`).then(res => res.json())

  if (response.status === 'error') {
    console.log('Error in fetching squeeth vol', response.status)
  }

  return response * 100
}

export const squeethRefVolDocLink = 'https://colab.research.google.com/drive/1HTM_2j0jmda9tzN_uskBPz9Rpma8Lp3C'
