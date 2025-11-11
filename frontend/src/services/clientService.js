import api from './api'

const clientService = {
  getAllClients: async (params = {}) => {
    const response = await api.get('/clients', { params })
    return response.data
  },

  getClientById: async (id) => {
    const response = await api.get(`/clients/${id}`)
    return response.data
  },

  createClient: async (clientData) => {
    const response = await api.post('/clients', clientData)
    return response.data
  },

  updateClient: async (id, clientData) => {
    const response = await api.put(`/clients/${id}`, clientData)
    return response.data
  },

  deleteClient: async (id) => {
    const response = await api.delete(`/clients/${id}`)
    return response.data
  },

  searchClients: async (query) => {
    const response = await api.get('/clients/search', { params: { q: query } })
    return response.data
  },
}

export default clientService
