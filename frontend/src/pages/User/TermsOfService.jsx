import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiFileText } from 'react-icons/fi';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate('/user/dashboard')}
              className="p-1.5 sm:p-2 text-gray-600 hover:bg-white rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-700 via-slate-600 to-zinc-700 bg-clip-text text-transparent">
                Syarat & Ketentuan
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                Terakhir diperbarui: 10 Februari 2026
              </p>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3 text-white">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <FiFileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">Syarat & Ketentuan CatatJasamu</h2>
                <p className="text-xs sm:text-sm text-green-100">Aturan penggunaan dan ketentuan layanan</p>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4 md:p-6 space-y-6">
            <div className="prose prose-sm sm:prose-base max-w-none">
              <p className="text-gray-700 leading-relaxed">
                Selamat datang di CatatJasamu ("aplikasi"). Dengan mengakses atau menggunakan aplikasi ini, Anda setuju untuk terikat oleh syarat dan ketentuan ini ("Syarat"). Jika Anda tidak setuju, jangan gunakan aplikasi ini.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">1. Penerimaan Syarat</h3>
              <p className="text-gray-700 leading-relaxed">
                Dengan menggunakan CatatJasamu, Anda menyetujui untuk mematuhi semua syarat yang tercantum di sini. Syarat ini berlaku untuk semua pengguna aplikasi.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">2. Deskripsi Layanan</h3>
              <p className="text-gray-700 leading-relaxed">
                CatatJasamu adalah aplikasi manajemen booking dan jadwal yang terintegrasi dengan Google Calendar. Layanan termasuk:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Pembuatan dan pengelolaan booking</li>
                <li>Sinkronisasi dengan Google Calendar</li>
                <li>Penyimpanan data booking dan jadwal</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">3. Persyaratan Penggunaan</h3>

              <h4 className="text-md font-medium text-gray-800 mt-4 mb-2">3.1 Kelayakan</h4>
              <p className="text-gray-700 leading-relaxed">
                Anda harus berusia minimal 13 tahun untuk menggunakan aplikasi ini.
              </p>

              <h4 className="text-md font-medium text-gray-800 mt-4 mb-2">3.2 Akun Pengguna</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Anda bertanggung jawab untuk menjaga kerahasiaan kredensial akun Anda.</li>
                <li>Anda setuju untuk memberikan informasi yang akurat dan terkini.</li>
                <li>Anda tidak boleh membagikan akun Anda dengan orang lain.</li>
              </ul>

              <h4 className="text-md font-medium text-gray-800 mt-4 mb-2">3.3 Penggunaan yang Dilarang</h4>
              <p className="text-gray-700 leading-relaxed">
                Anda dilarang menggunakan aplikasi untuk:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Aktivitas ilegal atau melanggar hukum</li>
                <li>Mengirim spam atau konten berbahaya</li>
                <li>Melanggar hak kekayaan intelektual orang lain</li>
                <li>Mencoba mengakses sistem tanpa izin</li>
                <li>Mengganggu operasi aplikasi</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">4. Integrasi Google</h3>
              <p className="text-gray-700 leading-relaxed">
                Aplikasi ini menggunakan Google OAuth dan Google Calendar API. Dengan menggunakan fitur ini:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Anda memberikan izin kepada kami untuk mengakses data Google Anda sesuai dengan Kebijakan Privasi kami.</li>
                <li>Anda tetap tunduk pada Syarat Layanan Google.</li>
                <li>Anda dapat mencabut akses kapan saja melalui pengaturan Google Account.</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">5. Konten Pengguna</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Anda bertanggung jawab atas semua konten yang Anda unggah atau buat.</li>
                <li>Anda memberikan kami lisensi terbatas untuk menggunakan konten tersebut dalam menyediakan layanan.</li>
                <li>Kami berhak menghapus konten yang melanggar syarat ini.</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">6. Penolakan Jaminan</h3>
              <p className="text-gray-700 leading-relaxed">
                Aplikasi disediakan "sebagaimana adanya" tanpa jaminan apa pun. Kami tidak menjamin bahwa aplikasi akan bebas dari kesalahan atau gangguan.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">7. Batasan Tanggung Jawab</h3>
              <p className="text-gray-700 leading-relaxed">
                Kami tidak bertanggung jawab atas kerugian langsung, tidak langsung, atau konsekuensial yang timbul dari penggunaan aplikasi ini.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">8. Penghentian</h3>
              <p className="text-gray-700 leading-relaxed">
                Kami dapat menghentikan atau menangguhkan akses Anda ke aplikasi kapan saja jika Anda melanggar syarat ini.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">9. Perubahan Syarat</h3>
              <p className="text-gray-700 leading-relaxed">
                Kami dapat memperbarui syarat ini kapan saja. Perubahan akan diberitahukan melalui aplikasi.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">10. Hukum yang Berlaku</h3>
              <p className="text-gray-700 leading-relaxed">
                Syarat ini diatur oleh hukum Indonesia. Setiap perselisihan akan diselesaikan di pengadilan yang berwenang.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">11. Kontak</h3>
              <p className="text-gray-700 leading-relaxed">
                Jika Anda memiliki pertanyaan, hubungi kami di: catatjasamu@gmail.com
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-green-800 font-medium">
                  Dengan menggunakan CatatJasamu, Anda menyetujui syarat dan ketentuan ini.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;