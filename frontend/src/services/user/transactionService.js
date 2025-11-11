import api from '../api'

const userTransactionService = {
  getMyTransactions: async (params = {}) => {
    const response = await api.get('/user/transactions', { params })
    return response.data
  },

  getTransactionById: async (id) => {
    const response = await api.get(`/user/transactions/${id}`)
    return response.data
  }
}

export default userTransactionService
