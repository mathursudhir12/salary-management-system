/**
 * Axios instance shared across all API calls.
 *
 * baseURL is intentionally empty so that requests go to the same origin.
 * During development, Vite's server.proxy forwards /api/* to localhost:5000.
 * In production, configure the reverse proxy (Vercel rewrites / nginx) to do
 * the same.
 *
 * VITE_API_URL can override the base if you need to point to a remote backend.
 */
import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
})
