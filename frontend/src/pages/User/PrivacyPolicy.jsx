import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiShield, FiFileText } from 'react-icons/fi';

const PrivacyPolicy = () => {
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
                Kebijakan Privasi
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                Terakhir diperbarui: 10 Februari 2026
              </p>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3 text-white">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <FiShield className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">Kebijakan Privasi CatatJasamu</h2>
                <p className="text-xs sm:text-sm text-blue-100">Informasi tentang privasi dan perlindungan data Anda</p>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4 md:p-6 space-y-6">
            <div className="prose prose-sm sm:prose-base max-w-none">
              <p className="text-gray-700 leading-relaxed">
                Aplikasi CatatJasamu ("kami", "kita", atau "aplikasi") berkomitmen untuk melindungi privasi Anda.
                Kebijakan privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda saat menggunakan aplikasi kami.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">1. Informasi yang Kami Kumpulkan</h3>

              <h4 className="text-md font-medium text-gray-800 mt-4 mb-2">Data Pribadi:</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li><strong>Data dari Google Account:</strong> Saat Anda login menggunakan Google OAuth, kami mengakses nama, alamat email, dan ID pengguna Anda.</li>
                <li><strong>Data Booking:</strong> Informasi tentang booking atau jadwal yang Anda buat, termasuk tanggal, waktu, dan deskripsi.</li>
                <li><strong>Data Penggunaan:</strong> Log aktivitas untuk tujuan debugging dan peningkatan layanan.</li>
              </ul>

              <h4 className="text-md font-medium text-gray-800 mt-4 mb-2">Data dari Integrasi Google Calendar:</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Akses ke kalender Anda untuk membaca dan membuat event booking.</li>
                <li>Data event kalender yang terkait dengan aplikasi kami.</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">2. Cara Kami Menggunakan Informasi Anda</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li><strong>Autentikasi:</strong> Untuk memverifikasi identitas Anda dan memberikan akses ke akun.</li>
                <li><strong>Fungsionalitas Aplikasi:</strong> Untuk menyimpan dan mengelola data booking Anda.</li>
                <li><strong>Integrasi Kalender:</strong> Untuk menyinkronkan booking dengan Google Calendar Anda.</li>
                <li><strong>Peningkatan Layanan:</strong> Untuk menganalisis penggunaan dan meningkatkan fitur aplikasi.</li>
                <li><strong>Keamanan:</strong> Untuk mendeteksi dan mencegah aktivitas yang mencurigakan.</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">3. Berbagi Informasi</h3>
              <p className="text-gray-700 leading-relaxed">
                Kami tidak menjual atau menyewakan data pribadi Anda kepada pihak ketiga. Kami hanya berbagi informasi dalam kondisi berikut:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li><strong>Dengan Google:</strong> Untuk autentikasi dan integrasi Calendar API sesuai dengan kebijakan Google.</li>
                <li><strong>Penyedia Layanan:</strong> Dengan penyedia hosting dan database yang diperlukan untuk menjalankan aplikasi (dengan kontrak keamanan).</li>
                <li><strong>Persyaratan Hukum:</strong> Jika diwajibkan oleh hukum atau untuk melindungi hak kami.</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">4. Keamanan Data</h3>
              <p className="text-gray-700 leading-relaxed">
                Kami menerapkan langkah-langkah keamanan teknis dan organisasi untuk melindungi data Anda:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Enkripsi data dalam transit dan penyimpanan.</li>
                <li>Akses terbatas ke data hanya untuk staf yang berwenang.</li>
                <li>Regular audit keamanan dan pembaruan sistem.</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">5. Retensi Data</h3>
              <p className="text-gray-700 leading-relaxed">
                Kami menyimpan data Anda selama akun aktif dan sesuai dengan kebutuhan layanan. Data akan dihapus jika Anda meminta penghapusan akun.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">6. Hak Anda</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li><strong>Akses:</strong> Anda dapat meminta salinan data pribadi Anda.</li>
                <li><strong>Perbaikan:</strong> Anda dapat memperbarui informasi Anda melalui aplikasi.</li>
                <li><strong>Penghapusan:</strong> Anda dapat meminta penghapusan akun dan data terkait.</li>
                <li><strong>Penarikan Consent:</strong> Anda dapat mencabut akses ke Google Calendar kapan saja.</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">7. Cookies dan Teknologi Pelacakan</h3>
              <p className="text-gray-700 leading-relaxed">
                Aplikasi kami menggunakan cookies untuk sesi login dan penyimpanan preferensi. Anda dapat mengelola cookies melalui pengaturan browser.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">8. Perubahan Kebijakan</h3>
              <p className="text-gray-700 leading-relaxed">
                Kami dapat memperbarui kebijakan ini. Perubahan signifikan akan diberitahukan melalui aplikasi atau email.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">9. Kontak Kami</h3>
              <p className="text-gray-700 leading-relaxed">
                Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, hubungi kami di: catatjasamu@gmail.com
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-800 font-medium">
                  Dengan menggunakan CatatJasamu, Anda menyetujui pengumpulan dan penggunaan informasi sesuai dengan kebijakan ini.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;