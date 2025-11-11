import api from '../api'

const userProfileService = {
  getProfile: async () => {
    const response = await api.get('/user/profile')
    return response.data
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/user/profile', profileData)
    return response.data
  },

  changePassword: async (passwordData) => {
    const response = await api.put('/user/password', passwordData)
    return response.data
  }
}

export default userProfileService
