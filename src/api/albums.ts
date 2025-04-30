import axios from 'axios'
import { Album } from '../types/Album'

const apiBase = import.meta.env.VITE_API_BASE_URL

export async function getUserAlbums(): Promise<Album[]> {
    const token = localStorage.getItem('jwt')
    if (!token) throw new Error('No token found')

    const res = await axios.get(`${apiBase}/albums`, {
        headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
}

export async function createAlbum(data: {
    name: string
    description?: string
    isPrivate?: boolean
}): Promise<Album> {
    const token = localStorage.getItem('jwt')
    if (!token) throw new Error('No token found')

    const res = await axios.post(`${apiBase}/albums`, data, {
        headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
}