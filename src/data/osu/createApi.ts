import 'server-only'

import * as osu from 'osu-api-v2-js'

const CLIENT_ID = Number(process.env.OSU_CLIENT_ID)
// biome-ignore lint/style/noNonNullAssertion: <explanation>
const CLIENT_SECRET = process.env.OSU_CLIENT_SECRET!

// Check if credentials are available
if (!CLIENT_ID || !CLIENT_SECRET) {
    console.warn(
        'osu! API credentials are missing. Please set OSU_CLIENT_ID and OSU_CLIENT_SECRET environment variables.',
    )
}

export const createApi = async () => {
    const api = await osu.API.createAsync(CLIENT_ID, CLIENT_SECRET)
    return api
}

export type ApiInstance = Awaited<ReturnType<typeof createApi>>