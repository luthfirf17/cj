import api from '../api'

const adminClientService = {
  getAllClients: async (params = {}) => {
    const response = await api.get('/admin/clients', { params })
    return response.data
  },

  getClientById: async (id) => {
    const response = await api.get(`/admin/clients/${id}`)
    return response.data
  },

  createClient: async (clientData) => {
    const response = await api.post('/admin/clients', clientData)
    return response.data
  },

  updateClient: async (id, clientData) => {
    const response = await api.put(`/admin/clients/${id}`, clientData)
    return response.data
  },

  deleteClient: async (id) => {
    const response = await api.delete(`/admin/clients/${id}`)
    return response.data
  },

  searchClients: async (query) => {
    const response = await api.get('/admin/clients/search', { params: { q: query } })
    return response.data
  },

  getClientStats: async (id) => {
    const response = await api.get(`/admin/clients/${id}/stats`)
    return response.data
  }
}

export default adminClientService
