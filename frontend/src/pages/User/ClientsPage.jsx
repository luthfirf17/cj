import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiEye,
  FiX,
  FiSave
} from 'react-icons/fi';
import api from '../../services/api';
import Button from '../../components/Common/Button';

const ClientsPage = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [clientBookings, setClientBookings] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    notes: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [searchTerm, clients]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/clients');
      if (response.data.success) {
        setClients(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }

    const filtered = clients.filter(client =>
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  };

  const handleAddClient = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      company: '',
      notes: ''
    });
    setSelectedClient(null);
    setShowModal(true);
  };

  const handleEditClient = (client) => {
    setFormData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      company: client.company || '',
      notes: client.notes || ''
    });
    setSelectedClient(client);
    setShowModal(true);
  };

  const handleDeleteClick = (client) => {
    setSelectedClient(client);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await api.delete(`/user/clients/${selectedClient.id}`);
      if (response.data.success) {
        fetchClients();
        setShowDeleteConfirm(false);
        setSelectedClient(null);
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Gagal menghapus client. Client mungkin memiliki booking aktif.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      if (selectedClient) {
        // Update existing client
        response = await api.put(`/user/clients/${selectedClient.id}`, formData);
      } else {
        // Create new client
        response = await api.post('/user/clients', formData);
      }

      if (response.data.success) {
        fetchClients();
        setShowModal(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          company: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error saving client:', error);
      alert(error.response?.data?.message || 'Gagal menyimpan data client');
    }
  };

  const handleViewBookings = async (client) => {
    try {
      setSelectedClient(client);
      const response = await api.get(`/user/clients/${client.id}/bookings`);
      if (response.data.success) {
        setClientBookings(response.data.data);
        setShowBookingsModal(true);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'dijadwalkan': 'bg-blue-100 text-blue-800 border-blue-300',
      'selesai': 'bg-green-100 text-green-800 border-green-300',
      'dibatalkan': 'bg-red-100 text-red-800 border-red-300'
    };
    return badges[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      'unpaid': 'bg-red-100 text-red-800',
      'DP': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800'
    };
    const labels = {
      'unpaid': 'Belum Bayar',
      'DP': 'DP',
      'paid': 'Lunas'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <FiUsers className="text-white" size={24} />
                </div>
                Informasi Client
              </h1>
              <p className="text-gray-600 mt-1">Kelola data client dan lihat riwayat booking</p>
            </div>
            <Button
              onClick={handleAddClient}
              variant="primary"
              className="flex items-center gap-2"
            >
              <FiPlus size={18} />
              <span className="hidden sm:inline">Tambah Client</span>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari client berdasarkan nama, email, telepon, atau perusahaan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Client</p>
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FiUsers className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Client Aktif</p>
                <p className="text-2xl font-bold text-green-600">
                  {clients.filter(c => c.total_bookings > 0).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <FiCalendar className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Booking</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {clients.reduce((sum, c) => sum + (c.total_bookings || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <FiDollarSign className="text-indigo-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Kontak
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Perusahaan
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Total Booking
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      {searchTerm ? 'Tidak ada client yang ditemukan' : 'Belum ada data client'}
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {client.name?.charAt(0)?.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{client.name}</p>
                            {client.address && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <FiMapPin size={12} />
                                {client.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {client.phone && (
                            <p className="text-sm text-gray-700 flex items-center gap-2">
                              <FiPhone size={14} className="text-gray-400" />
                              {client.phone}
                            </p>
                          )}
                          {client.email && (
                            <p className="text-sm text-gray-700 flex items-center gap-2">
                              <FiMail size={14} className="text-gray-400" />
                              {client.email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">
                          {client.company || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">
                          {client.total_bookings || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewBookings(client)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Lihat Booking"
                          >
                            <FiEye size={18} />
                          </button>
                          <button
                            onClick={() => handleEditClient(client)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(client)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedClient ? 'Edit Client' : 'Tambah Client Baru'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Client <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      No. Telepon
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Perusahaan
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Alamat
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Catatan
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Catatan tambahan tentang client..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <FiSave size={18} />
                  {selectedClient ? 'Update' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Konfirmasi Hapus Client
            </h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus client <strong>{selectedClient?.name}</strong>? 
              Aksi ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                className="flex-1"
              >
                Hapus
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Modal */}
      {showBookingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Riwayat Booking - {selectedClient?.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Total {clientBookings.length} booking
                </p>
              </div>
              <button
                onClick={() => setShowBookingsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6">
              {clientBookings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Belum ada riwayat booking
                </div>
              ) : (
                <div className="space-y-4">
                  {clientBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {booking.event_name || 'Booking #' + booking.id}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                            <FiCalendar size={14} />
                            {new Date(booking.event_date).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(booking.status)}`}>
                            {booking.status}
                          </span>
                          {getPaymentStatusBadge(booking.payment_status)}
                        </div>
                      </div>
                      
                      {booking.location && (
                        <p className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                          <FiMapPin size={14} />
                          {booking.location}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">
                          Total: Rp {(booking.total_amount || 0).toLocaleString('id-ID')}
                        </p>
                        {booking.amount_paid > 0 && (
                          <p className="text-xs text-green-600">
                            Dibayar: Rp {(booking.amount_paid || 0).toLocaleString('id-ID')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
