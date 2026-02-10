import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShield, FiFileText, FiLogIn, FiUserPlus, FiCheckCircle, FiCalendar, FiUsers, FiBarChart2 } from 'react-icons/fi';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FiCalendar className="w-6 h-6" />,
      title: "Manajemen Booking",
      description: "Kelola booking jasa dengan mudah dan terorganisir"
    },
    {
      icon: <FiUsers className="w-6 h-6" />,
      title: "Manajemen Klien",
      description: "Pantau dan kelola data klien Anda dengan efisien"
    },
    {
      icon: <FiBarChart2 className="w-6 h-6" />,
      title: "Laporan Keuangan",
      description: "Monitor pendapatan dan pengeluaran bisnis Anda"
    }
  ];

  const benefits = [
    "Integrasi Google Calendar",
    "Backup & Restore Data",
    "Multi-user Support",
    "Responsive Design",
    "Real-time Notifications",
    "Secure & Private"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CJ</span>
              </div>
              <span className="text-xl font-bold text-gray-900">CatatJasamu</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/privacy-policy"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Kebijakan Privasi
              </Link>
              <Link
                to="/terms-of-service"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Syarat & Ketentuan
              </Link>
              <button
                onClick={() => navigate('/login')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Masuk
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Kelola Booking Jasa Anda
              <span className="block text-blue-600">dengan Mudah & Efisien</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              CatatJasamu adalah platform modern untuk mengelola booking jasa, integrasi Google Calendar,
              dan monitoring bisnis Anda. Dirancang khusus untuk freelancer dan bisnis jasa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <FiUserPlus className="w-5 h-5" />
                Daftar Sekarang
              </button>
              <button
                onClick={() => navigate('/login')}
                className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <FiLogIn className="w-5 h-5" />
                Masuk ke Akun
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Fitur Unggulan</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Semua yang Anda butuhkan untuk mengelola bisnis jasa Anda dalam satu platform
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Mengapa Memilih CatatJasamu?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Platform yang dirancang khusus untuk memenuhi kebutuhan bisnis jasa modern
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-white border border-gray-100">
                <FiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Siap Mengelola Bisnis Anda?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Bergabunglah dengan ribuan pengguna yang telah mempercayai CatatJasamu
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Mulai Gratis Sekarang
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CJ</span>
                </div>
                <span className="text-xl font-bold">CatatJasamu</span>
              </div>
              <p className="text-gray-400 mb-4">
                Platform modern untuk mengelola booking jasa dengan integrasi Google Calendar.
              </p>
              <p className="text-gray-400 text-sm">
                © 2026 CatatJasamu. All rights reserved.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Produk</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Fitur</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Harga</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrasi</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Dukungan</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Kebijakan Privasi</Link></li>
                <li><Link to="/terms-of-service" className="hover:text-white transition-colors">Syarat & Ketentuan</Link></li>
                <li><a href="mailto:catatjasamu@gmail.com" className="hover:text-white transition-colors">Kontak</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;