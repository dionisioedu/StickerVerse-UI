// src/api/stickers.ts
import axios from 'axios'
import { Sticker } from '../types/Sticker'

const apiBase = import.meta.env.VITE_API_BASE_URL

export async function getUserStickers(): Promise<Sticker[]> {
    const token = localStorage.getItem('jwt')
    if (!token) throw new Error('No tone')

    const res = await axios.get(`${apiBase}/stickers`, {
        headers: { Authorization: `Bearer ${token}` }
    })

    return res.data
}

