"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createTransaction, getCash, getTransactions } from "../../../lib/api"

type Transaction = {
  id: number
  type: string
  amount: number
  description: string
  date: string
}

type Cash = {
  id: number
  balance: number
  lastUpdated: string
}

export default function PurchasesPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    purchaseType: "general",
  })
  const [cash, setCash] = useState<Cash | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const limit = 10

  useEffect(() => {
    fetchData()
  }, [page])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [transactionsData, cashData] = await Promise.all([
        getTransactions(page, limit),
        getCash().catch(() => null),
      ])

      setTransactions(transactionsData.transactions.filter((t: Transaction) => t.type === "purchase"))
      setCash(cashData)
    } catch (err: any) {
      setError(err.response?.data?.error || `Gagal memuat data: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: keyof typeof formData) => {
    setFormData({ ...formData, [field]: e.target.value })
    setError(null)
    if (field === "purchaseType" && e.target.value === "rawMaterial") {
      router.push("/production/raw-material")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (!formData.description.trim()) {
      setError("Deskripsi wajib diisi")
      setLoading(false)
      return
    }

    const amount = Number.parseFloat(formData.amount)
    if (!amount || amount <= 0 || isNaN(amount)) {
      setError("Jumlah harus angka positif")
      setLoading(false)
      return
    }

    // Check if cash balance is sufficient
    if (cash && cash.balance < amount) {
      setError(
        `Saldo kas tidak mencukupi. Tersedia: ${formatRupiah(cash.balance)}, Dibutuhkan: ${formatRupiah(amount)}`,
      )
      setLoading(false)
      return
    }

    try {
      await createTransaction({
        type: "purchase",
        amount: Number.parseFloat(amount.toFixed(2)),
        description: formData.description,
      })
      setSuccess("Pembelian berhasil dicatat dan saldo kas telah dikurangi!")
      setFormData({ amount: "", description: "", purchaseType: "general" })
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal mencatat pembelian")
    } finally {
      setLoading(false)
    }
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Kelola Pembelian</h2>

      {/* Navigation Tabs */}
      <div className="mb-6 sm:mb-8">
        <nav className="flex flex-wrap gap-2 sm:gap-4">
          <Link
            href="/accounting/transactions/sales"
            className="px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Penjualan
          </Link>
          <Link
            href="/accounting/transactions/purchases"
            className="px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base bg-blue-600 text-white"
          >
            Pembelian
          </Link>
          <Link
            href="/accounting/transactions/expenses"
            className="px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Biaya Operasional
          </Link>
          <Link
            href="/accounting/transactions/capital"
            className="px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Modal/Donasi
          </Link>
        </nav>
      </div>

      {/* Current Cash Balance */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Saldo Kas Saat Ini</h3>
        {cash ? (
          <p className="text-gray-900 text-base sm:text-lg">
            Saldo: {formatRupiah(cash.balance)} (Terakhir Diperbarui: {new Date(cash.lastUpdated).toLocaleString()})
          </p>
        ) : (
          <p className="text-gray-600 text-sm sm:text-base">Belum ada catatan saldo kas</p>
        )}
      </div>

      {/* Transaction Form */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Catat Pembelian Baru</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Pembelian</label>
            <select
              value={formData.purchaseType}
              onChange={(e) => handleChange(e, "purchaseType")}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              disabled={loading}
            >
              <option value="general">Pembelian Umum</option>
              <option value="rawMaterial">Bahan Baku (akan diarahkan ke halaman bahan baku)</option>
            </select>
          </div>
          {formData.purchaseType !== "rawMaterial" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Masukkan jumlah"
                  value={formData.amount}
                  onChange={(e) => handleChange(e, "amount")}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  disabled={loading}
                />
                {formData.amount && cash && Number.parseFloat(formData.amount) > cash.balance && (
                  <p className="text-red-500 text-sm mt-1">
                    ⚠️ Jumlah melebihi saldo kas yang tersedia ({formatRupiah(cash.balance)})
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <input
                  type="text"
                  placeholder="Contoh: Pembelian peralatan kantor, Pembelian supplies, dll"
                  value={formData.description}
                  onChange={(e) => handleChange(e, "description")}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  disabled={loading}
                />
              </div>
              <div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
                <button
                  type="submit"
                  className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:bg-blue-400 text-sm sm:text-base"
                  disabled={
                    loading || (formData.amount && cash && Number.parseFloat(formData.amount) > cash.balance) || false
                  }
                >
                  {loading ? "Mencatat..." : "Catat Pembelian"}
                </button>
              </div>
            </>
          )}
          {formData.purchaseType === "rawMaterial" && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-blue-800 text-sm">
                Untuk pembelian bahan baku, silakan gunakan halaman khusus bahan baku yang akan mengelola stok dan
                mengurangi saldo kas secara otomatis.
              </p>
            </div>
          )}
        </form>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Riwayat Pembelian</h3>
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deskripsi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {formatRupiah(transaction.amount)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{transaction.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1 || loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 text-sm sm:text-base"
              >
                Sebelumnya
              </button>
              <span className="text-gray-700 text-sm sm:text-base">Halaman {page}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={transactions.length < limit || loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 text-sm sm:text-base"
              >
                Berikutnya
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-600 text-sm sm:text-base">Belum ada pembelian tercatat.</p>
        )}
      </div>
    </div>
  )
}
