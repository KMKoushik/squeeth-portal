import { IS_ANALYTICS_ENABLED } from '../../constants/analytics'

export const trackEvent = async (event: string, userId: string, eventProps: any) => {
  if (!process.env.AMPLITUDE_KEY || !IS_ANALYTICS_ENABLED) return

  const body = {
    api_key: process.env.AMPLITUDE_KEY,
    events: [
      {
        user_id: userId,
        event_type: event,
        event_properties: eventProps,
      },
    ],
  }

  try {
    const data = await fetch('https://api.amplitude.com/2/httpapi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    return data.json()
  } catch (e) {
    console.log(e)
  }
}
