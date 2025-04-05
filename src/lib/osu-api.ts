"use server"

import * as osu from "osu-api-v2-js"

const CLIENT_ID = Number(process.env.OSU_CLIENT_ID)
const CLIENT_SECRET = process.env.OSU_CLIENT_SECRET!
// const REDIRECT_URI = process.env.OSU_REDIRECT_URI || "http://localhost:3000/callback"

// Check if credentials are available
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn(
    "osu! API credentials are missing. Please set OSU_CLIENT_ID and OSU_CLIENT_SECRET environment variables.",
  )
}


/**
 * Get user data from osu! API
 */
export async function getOsuMe(): Promise<osu.User.Extended> {
  try {
    const api = await osu.API.createAsync(CLIENT_ID, CLIENT_SECRET)
    const user = await api.getUser("tenzyu")
    return user
  } catch (error) {
    console.error("Error fetching osu! user data:", error)
    throw new Error("Failed to fetch osu! user data")
  }
}

/**
 * Get user's best scores from osu! API
 */
export async function getOsuMyBestScores(): Promise<osu.Score.WithUserBeatmapBeatmapset[]> {
  try {
    const api = await osu.API.createAsync(CLIENT_ID, CLIENT_SECRET)
    const user = await api.getUser("tenzyu")
    const bestScores = (await api.getUserScores(user, "best", osu.Ruleset.osu, {lazer: true}, {limit: 5}))
    return bestScores
  } catch (error) {
    console.error("Error fetching osu! best scores:", error)
    throw new Error("Failed to fetch osu! best scores")
  }
}


