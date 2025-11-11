import * as Yup from 'yup'

// Login validation schema
export const loginSchema = Yup.object({
  email: Yup.string()
    .email('Email tidak valid')
    .required('Email wajib diisi'),
  password: Yup.string()
    .min(6, 'Password minimal 6 karakter')
    .required('Password wajib diisi'),
})

// Register validation schema
export const registerSchema = Yup.object({
  name: Yup.string()
    .min(3, 'Nama minimal 3 karakter')
    .required('Nama wajib diisi'),
  email: Yup.string()
    .email('Email tidak valid')
    .required('Email wajib diisi'),
  password: Yup.string()
    .min(6, 'Password minimal 6 karakter')
    .required('Password wajib diisi'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Password tidak cocok')
    .required('Konfirmasi password wajib diisi'),
})

// Client validation schema
export const clientSchema = Yup.object({
  name: Yup.string()
    .min(3, 'Nama minimal 3 karakter')
    .required('Nama klien wajib diisi'),
  email: Yup.string()
    .email('Email tidak valid')
    .nullable(),
  phone: Yup.string()
    .matches(/^[0-9+\-() ]+$/, 'Nomor telepon tidak valid')
    .required('Nomor telepon wajib diisi'),
  address: Yup.string()
    .nullable(),
  notes: Yup.string()
    .nullable(),
})

// Service validation schema
export const serviceSchema = Yup.object({
  name: Yup.string()
    .min(3, 'Nama layanan minimal 3 karakter')
    .required('Nama layanan wajib diisi'),
  description: Yup.string()
    .nullable(),
  price: Yup.number()
    .positive('Harga harus positif')
    .required('Harga wajib diisi'),
  duration: Yup.number()
    .positive('Durasi harus positif')
    .nullable(),
})

// Transaction validation schema
export const transactionSchema = Yup.object({
  clientId: Yup.number()
    .positive()
    .required('Klien wajib dipilih'),
  serviceId: Yup.number()
    .positive()
    .required('Layanan wajib dipilih'),
  amount: Yup.number()
    .positive('Jumlah harus positif')
    .required('Jumlah wajib diisi'),
  date: Yup.date()
    .required('Tanggal wajib diisi'),
  status: Yup.string()
    .oneOf(['pending', 'completed', 'cancelled'], 'Status tidak valid')
    .required('Status wajib dipilih'),
  notes: Yup.string()
    .nullable(),
})
