import axios from 'axios'
import { appConfig } from '@/config/app'

export const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})
