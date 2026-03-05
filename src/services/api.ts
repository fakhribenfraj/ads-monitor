import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import type { LoginCredentials, LoginResponse, FindBriefRequest, FindBriefResponse } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://connectcontent.me/api'

const isBrowser = typeof window !== 'undefined'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
  },
})

let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
  if (token && isBrowser) {
    localStorage.setItem('accessToken', token)
  } else if (isBrowser) {
    localStorage.removeItem('accessToken')
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken
  if (!isBrowser) return null
  return localStorage.getItem('accessToken')
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/loginCreator', credentials)
  return response.data
}

export async function findBrief(token: string, request: FindBriefRequest): Promise<FindBriefResponse> {
  const config: AxiosRequestConfig = {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }
  const response = await api.post<FindBriefResponse>('/campaign/find-brief-in-creator', request, config)
  return response.data
}

export async function findBriefWithRetry(request: FindBriefRequest): Promise<FindBriefResponse> {
  let token = getAuthToken()
  
  if (!token) {
    throw new Error('No authentication token available')
  }

  try {
    return await findBrief(token, request)
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 401) {
      const credentials = getStoredCredentials()
      if (credentials) {
        const loginResponse = await login(credentials)
        setAuthToken(loginResponse.accessToken)
        token = loginResponse.accessToken
        return await findBrief(token, request)
      }
    }
    throw error
  }
}

function getStoredCredentials(): LoginCredentials | null {
  if (!isBrowser) return null
  const stored = localStorage.getItem('credentials')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  }
  return null
}

export function storeCredentials(credentials: LoginCredentials) {
  if (!isBrowser) return
  localStorage.setItem('credentials', JSON.stringify(credentials))
}

export function clearAuth() {
  setAuthToken(null)
  if (!isBrowser) return
  localStorage.removeItem('credentials')
  localStorage.removeItem('lastBriefId')
}
