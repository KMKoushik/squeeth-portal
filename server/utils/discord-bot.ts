import { Client, GatewayIntentBits } from 'discord.js'
import { CrabOTC, CrabOTCData } from '../../types'

// Create a new client instance
export const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_BOT_TOKEN);

export const sendDiscordMessage = () => {
    client.channels.fetch(String(process.env.DISCORD_CHANNEL_ID))
}