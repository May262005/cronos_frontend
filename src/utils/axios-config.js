import axios from 'axios'

const instance = axios.create({
  baseURL: 'http://localhost:3000',
})

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

instance.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || ''
    if (err.response?.status === 401 && !url.includes('/auth/login')) {
      localStorage.clear()
      window.location.href = '/inicio-sesion'
    }
    return Promise.reject(err)
  },
)

export default instance