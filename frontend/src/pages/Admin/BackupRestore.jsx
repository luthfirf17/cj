import React, { useState, useEffect } from 'react';
import {
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const BackupRestore = () => {
  const [loading, setLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'warning'

  useEffect(() => {
    fetchBackupStatus();
  }, []);

  const fetchBackupStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/backup/status');
      setBackupStatus(response.data);
    } catch (error) {
      console.error('Error fetching backup status:', error);
      setMessage('Gagal memuat status backup');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      setMessage('');

      // Create download link
      const response = await api.get('/admin/backup/export', {
        responseType: 'blob'
      });

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `full_system_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage('Backup berhasil diunduh!');
      setMessageType('success');
      fetchBackupStatus(); // Refresh status
    } catch (error) {
      console.error('Error exporting backup:', error);
      setMessage('Gagal mengunduh backup');
      setMessageType('error');
    } finally {
      setExportLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setMessage('Pilih file backup terlebih dahulu');
      setMessageType('warning');
      return;
    }

    // Confirm import
    if (!window.confirm('⚠️ PERINGATAN: Import akan MENGGANTIKAN semua data yang ada. Pastikan Anda memiliki backup terlebih dahulu. Lanjutkan?')) {
      return;
    }

    try {
      setImportLoading(true);
      setMessage('');

      const formData = new FormData();
      formData.append('backupFile', importFile);

      const response = await api.post('/admin/backup/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage(`Import berhasil! ${JSON.stringify(response.data.imported, null, 2)}`);
      setMessageType('success');
      setImportFile(null);
      fetchBackupStatus(); // Refresh status
    } catch (error) {
      console.error('Error importing backup:', error);
      const errorMessage = error.response?.data?.message || 'Gagal mengimpor backup';
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setImportLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.json') && file.type !== 'application/json') {
        setMessage('File harus berformat JSON');
        setMessageType('error');
        setImportFile(null);
        return;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setMessage('File terlalu besar (maksimal 50MB)');
        setMessageType('error');
        setImportFile(null);
        return;
      }

      setImportFile(file);
      setMessage(`File dipilih: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      setMessageType('success');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Belum pernah';
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Backup & Restore</h1>
        <p className="mt-1 text-sm text-gray-500">
          Kelola backup dan restore data sistem secara aman
        </p>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`rounded-lg p-4 ${
          messageType === 'success' ? 'bg-green-50 border border-green-200' :
          messageType === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex">
            {messageType === 'success' && <CheckCircleIcon className="h-5 w-5 text-green-400" />}
            {messageType === 'error' && <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />}
            {messageType === 'warning' && <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />}
            <p className={`ml-3 text-sm ${
              messageType === 'success' ? 'text-green-800' :
              messageType === 'error' ? 'text-red-800' :
              'text-yellow-800'
            }`}>
              {message}
            </p>
          </div>
        </div>
      )}

      {/* Database Status */}
      <div className="rounded-lg bg-white shadow-sm border border-gray-200">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Status Database
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Informasi terkini tentang data di sistem
          </p>
        </div>
        <div className="px-4 py-5 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="ml-2 text-gray-600">Memuat status...</span>
            </div>
          ) : backupStatus ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{formatNumber(backupStatus.tables.users)}</div>
                <div className="text-sm text-gray-500">Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formatNumber(backupStatus.tables.clients)}</div>
                <div className="text-sm text-gray-500">Clients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatNumber(backupStatus.tables.services)}</div>
                <div className="text-sm text-gray-500">Services</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{formatNumber(backupStatus.tables.bookings)}</div>
                <div className="text-sm text-gray-500">Bookings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{formatNumber(backupStatus.tables.payments)}</div>
                <div className="text-sm text-gray-500">Payments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{formatNumber(backupStatus.tables.expenses)}</div>
                <div className="text-sm text-gray-500">Expenses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">{formatNumber(backupStatus.tables.company_settings)}</div>
                <div className="text-sm text-gray-500">Company Settings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-600">{formatNumber(backupStatus.tables.responsible_parties)}</div>
                <div className="text-sm text-gray-500">Responsible Parties</div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Gagal memuat status database</p>
          )}
          {backupStatus?.lastModified && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <ClockIcon className="h-4 w-4 inline mr-1" />
                Data terakhir dimodifikasi: {formatDate(backupStatus.lastModified)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Export Section */}
      <div className="rounded-lg bg-white shadow-sm border border-gray-200">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
            <DocumentArrowDownIcon className="h-6 w-6 mr-2 text-indigo-600" />
            Export Backup
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Unduh backup lengkap seluruh data sistem
          </p>
        </div>
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Backup akan berisi semua data: users, clients, services, bookings, payments, expenses, dan settings.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                File akan diunduh dalam format JSON
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportLoading ? (
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CloudArrowDownIcon className="h-4 w-4 mr-2" />
              )}
              {exportLoading ? 'Mengunduh...' : 'Export Backup'}
            </button>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="rounded-lg bg-white shadow-sm border border-gray-200">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
            <DocumentArrowUpIcon className="h-6 w-6 mr-2 text-green-600" />
            Import Backup
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload dan restore backup data sistem
          </p>
        </div>
        <div className="px-4 py-5 sm:px-6">
          <div className="space-y-4">
            {/* File Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih File Backup
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Maksimal 50MB, format JSON dari export backup
              </p>
            </div>

            {/* Import Button */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex-1">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>Peringatan:</strong> Import akan menggantikan semua data yang ada dengan data dari backup.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Pastikan Anda memiliki backup data saat ini sebelum melanjutkan.
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleImport}
                disabled={importLoading || !importFile}
                className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importLoading ? (
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                )}
                {importLoading ? 'Mengimpor...' : 'Import Backup'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backup Tips */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <div className="flex">
          <CheckCircleIcon className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Tips Backup Aman
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Lakukan backup secara berkala, minimal seminggu sekali</li>
                <li>Simpan file backup di lokasi yang aman dan terpisah dari server</li>
                <li>Test restore backup secara berkala untuk memastikan validitas</li>
                <li>Buat backup sebelum melakukan perubahan besar pada sistem</li>
                <li>Verifikasi ukuran dan isi file backup setelah export</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupRestore;