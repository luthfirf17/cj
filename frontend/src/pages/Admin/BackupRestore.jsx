import React, { useState, useEffect } from 'react';
import {
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ServerIcon,
  CpuChipIcon,
  ShieldCheckIcon
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
    if (!window.confirm('⚠️ SYSTEM ALERT: Import akan MENGGANTIKAN semua data yang ada. Pastikan Anda memiliki backup terlebih dahulu. Lanjutkan?')) {
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
    <div className="space-y-8 relative">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:25px_25px] animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="relative">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-2 h-8 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full shadow-lg shadow-cyan-500/50"></div>
          <h1 className="text-3xl font-mono font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
            DATA BACKUP & RESTORE
          </h1>
        </div>
        <p className="text-slate-400 font-mono text-sm ml-6">
          &gt; SECURE DATA MANAGEMENT | STATUS: {backupStatus ? 'CONNECTED' : 'CONNECTING...'}
        </p>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`rounded-xl border backdrop-blur-xl shadow-2xl p-6 transition-all duration-500 ${
          messageType === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' :
          messageType === 'error' ? 'bg-red-500/10 border-red-500/30' :
          'bg-amber-500/10 border-amber-500/30'
        }`}>
          <div className="flex items-center gap-3">
            {messageType === 'success' && <CheckCircleIcon className="h-8 w-8 text-emerald-400 animate-pulse" />}
            {messageType === 'error' && <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />}
            {messageType === 'warning' && <ExclamationTriangleIcon className="h-8 w-8 text-amber-400" />}
            <div>
              <h3 className={`text-lg font-mono font-bold ${
                messageType === 'success' ? 'text-emerald-300' :
                messageType === 'error' ? 'text-red-300' :
                'text-amber-300'
              }`}>
                {messageType === 'success' ? 'OPERATION SUCCESSFUL' :
                 messageType === 'error' ? 'SYSTEM ERROR' :
                 'WARNING ALERT'}
              </h3>
              <p className={`text-sm font-mono mt-1 ${
                messageType === 'success' ? 'text-emerald-200' :
                messageType === 'error' ? 'text-red-200' :
                'text-amber-200'
              }`}>
                {message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Database Status */}
      <div className="rounded-xl bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 border border-slate-700/50 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></div>
            <div>
              <h3 className="text-xl font-mono font-bold text-blue-300">DATABASE STATUS</h3>
              <p className="text-slate-400 font-mono text-sm">Real-time system data metrics</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-mono text-emerald-300">LIVE</span>
            </div>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="relative">
                <ArrowPathIcon className="h-12 w-12 animate-spin text-cyan-400" />
                <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-pulse"></div>
              </div>
              <div className="ml-4">
                <div className="text-cyan-300 font-mono text-lg">SCANNING DATABASE...</div>
                <div className="text-slate-400 font-mono text-sm">Retrieving system metrics</div>
              </div>
            </div>
          ) : backupStatus ? (
            <div className="space-y-6">
              {/* Database Size Card */}
              {backupStatus.databaseSize && (
                <div className="rounded-lg bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/30 backdrop-blur-sm p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative p-3 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
                        <ServerIcon className="h-8 w-8 text-white" />
                        <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div>
                        <div className="text-sm font-mono text-slate-400">DATABASE SIZE</div>
                        <div className="text-2xl font-mono font-bold text-white">
                          {backupStatus.databaseSize.formatted}
                        </div>
                        <div className="text-xs font-mono text-slate-500">
                          {formatNumber(backupStatus.databaseSize.bytes)} bytes
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-slate-500">STORAGE USAGE (MAX: 40GB)</div>
                      <div className="w-32 bg-slate-700/50 rounded-full h-2 mt-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            (backupStatus.databaseSize.usagePercentage || 0) >= 90 ? 'bg-gradient-to-r from-red-500 to-red-700' :
                            (backupStatus.databaseSize.usagePercentage || 0) >= 70 ? 'bg-gradient-to-r from-amber-500 to-orange-600' :
                            'bg-gradient-to-r from-orange-500 to-red-500'
                          }`}
                          style={{ width: `${Math.min(backupStatus.databaseSize.usagePercentage || 0, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-1">
                        {backupStatus.databaseSize.usagePercentage ? backupStatus.databaseSize.usagePercentage.toFixed(1) : '0.0'}% used
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Table Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'USERS', value: backupStatus.tables.users, icon: ShieldCheckIcon, color: 'from-cyan-500 to-blue-600', code: 'USR_DB' },
                  { label: 'CLIENTS', value: backupStatus.tables.clients, icon: ServerIcon, color: 'from-blue-500 to-indigo-600', code: 'CLI_DB' },
                  { label: 'SERVICES', value: backupStatus.tables.services, icon: CpuChipIcon, color: 'from-emerald-500 to-green-600', code: 'SVC_DB' },
                  { label: 'BOOKINGS', value: backupStatus.tables.bookings, icon: ServerIcon, color: 'from-purple-500 to-violet-600', code: 'BK_DB' },
                  { label: 'PAYMENTS', value: backupStatus.tables.payments, icon: CheckCircleIcon, color: 'from-amber-500 to-yellow-600', code: 'PAY_DB' },
                  { label: 'EXPENSES', value: backupStatus.tables.expenses, icon: ExclamationTriangleIcon, color: 'from-red-500 to-pink-600', code: 'EXP_DB' },
                  { label: 'SETTINGS', value: backupStatus.tables.company_settings, icon: ShieldCheckIcon, color: 'from-slate-500 to-gray-600', code: 'CFG_DB' },
                  { label: 'PARTIES', value: backupStatus.tables.responsible_parties, icon: ServerIcon, color: 'from-teal-500 to-cyan-600', code: 'RP_DB' }
                ].map((item, index) => (
                  <div
                    key={item.code}
                    className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/30 hover:border-cyan-500/50 backdrop-blur-sm p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="absolute top-2 right-2 text-xs font-mono text-slate-500 group-hover:text-cyan-400 transition-colors duration-300">
                      {item.code}
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`relative p-2 rounded-lg bg-gradient-to-br ${item.color} shadow-lg group-hover:scale-110 transition-all duration-300`}>
                        <item.icon className="h-5 w-5 text-white" />
                        <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div>
                        <div className="text-xs font-mono text-slate-400 group-hover:text-cyan-300 transition-colors duration-300">
                          {item.label}
                        </div>
                        <div className="text-lg font-mono font-bold text-white group-hover:text-cyan-200 transition-colors duration-300">
                          {formatNumber(item.value)}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-1">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min((item.value / 1000) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <ServerIcon className="h-16 w-16 text-slate-600 mb-4" />
              <div className="text-slate-400 font-mono text-lg">DATABASE CONNECTION FAILED</div>
              <div className="text-slate-500 font-mono text-sm">Unable to retrieve system metrics</div>
            </div>
          )}
          {backupStatus?.lastModified && (
            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <div className="flex items-center gap-3">
                <ClockIcon className="h-5 w-5 text-slate-400" />
                <div>
                  <div className="text-sm font-mono text-slate-300">
                    Last Data Modification: {formatDate(backupStatus.lastModified)}
                  </div>
                  <div className="text-xs font-mono text-slate-500">
                    System timestamp synchronized
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export Section */}
      <div className="rounded-xl bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 border border-slate-700/50 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full"></div>
            <div>
              <h3 className="text-xl font-mono font-bold text-emerald-300 flex items-center gap-2">
                <DocumentArrowDownIcon className="h-6 w-6" />
                EXPORT BACKUP
              </h3>
              <p className="text-slate-400 font-mono text-sm">Download complete system data archive</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-mono text-slate-300 mb-2">
                Backup contains: Users, Clients, Services, Bookings, Payments, Expenses & Settings
              </div>
              <div className="text-xs font-mono text-slate-500">
                Format: JSON | Compression: None | Encryption: System Default
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-3 text-white font-mono font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-2">
                {exportLoading ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                  <CloudArrowDownIcon className="h-5 w-5" />
                )}
                <span>{exportLoading ? 'EXPORTING...' : 'INITIATE EXPORT'}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="rounded-xl bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 border border-slate-700/50 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full"></div>
            <div>
              <h3 className="text-xl font-mono font-bold text-amber-300 flex items-center gap-2">
                <DocumentArrowUpIcon className="h-6 w-6" />
                IMPORT BACKUP
              </h3>
              <p className="text-slate-400 font-mono text-sm">Upload and restore system data from backup</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {/* File Input */}
            <div className="relative">
              <label className="block text-sm font-mono font-bold text-slate-300 mb-3">
                SELECT BACKUP FILE
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="relative border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-cyan-500/50 transition-all duration-300 bg-gradient-to-br from-slate-800/30 to-slate-900/30 hover:from-slate-800/50 hover:to-slate-900/50">
                  <CloudArrowUpIcon className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <div className="text-slate-300 font-mono">
                    {importFile ? (
                      <div>
                        <div className="text-cyan-300 font-bold">{importFile.name}</div>
                        <div className="text-sm text-slate-400">
                          {(importFile.size / 1024 / 1024).toFixed(2)} MB | JSON Format
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-bold">DROP BACKUP FILE HERE</div>
                        <div className="text-sm text-slate-400 mt-1">or click to browse files</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs font-mono text-slate-500">
                Maximum: 50MB | Format: JSON | Source: System Export
              </p>
            </div>

            {/* Import Button */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-700/50">
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <ExclamationTriangleIcon className="h-6 w-6 text-amber-400" />
                    <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <p className="text-sm font-mono text-slate-300">
                      <strong className="text-amber-300">CRITICAL WARNING:</strong> Import will REPLACE all existing data with backup contents.
                    </p>
                    <p className="text-xs font-mono text-slate-500 mt-1">
                      Ensure current data backup before proceeding with import operation.
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleImport}
                disabled={importLoading || !importFile}
                className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3 text-white font-mono font-bold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ml-4"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-2">
                  {importLoading ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  ) : (
                    <CloudArrowUpIcon className="h-5 w-5" />
                  )}
                  <span>{importLoading ? 'IMPORTING...' : 'INITIATE IMPORT'}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Tips */}
      <div className="rounded-xl bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 border border-slate-700/50 backdrop-blur-xl shadow-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="relative">
            <ShieldCheckIcon className="h-8 w-8 text-cyan-400" />
            <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-pulse"></div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-mono font-bold text-cyan-300 mb-3">
              DATA SECURITY PROTOCOLS
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm font-mono text-slate-300">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  <span>Automated weekly backups recommended</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  <span>Store backups in secure, separate locations</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  <span>Test restore procedures regularly</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <span>Create backups before major system changes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <span>Verify backup file integrity after export</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <span>Maintain multiple backup generations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupRestore;