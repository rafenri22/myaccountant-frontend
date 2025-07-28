"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getCash, updateCash } from "../../lib/api"

type Cash = {
  id: number
  balance: number
  lastUpdated: string
  movements: { id: number; type: string; amount: number; description: string; date: string }[]
}

export default function CashForm() {
  const [formData, setFormData] = useState({
    amount: "",
    type: "addition",
    description: "",
  })
  const [cash, setCash] = useState<Cash | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCash()
  }, [])

  const fetchCash = async () => {
    setLoading(true)
    try {
      const data = await getCash()
      setCash(data)
    } catch (err) {
      setError("Gagal memuat saldo kas")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: keyof typeof formData) => {
    setFormData({ ...formData, [field]: e.target.value })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (!formData.amount || Number.parseFloat(formData.amount) <= 0) {
      setError("Jumlah harus angka positif")
      setLoading(false)
      return
    }

    if (!formData.description.trim()) {
      setError("Deskripsi wajib diisi")
      setLoading(false)
      return
    }

    // Check if deduction would result in negative balance
    if (formData.type === "deduction" && cash) {
      const deductionAmount = Number.parseFloat(formData.amount)
      if (cash.balance < deductionAmount) {
        setError(`Saldo tidak mencukupi. Saldo saat ini: ${formatRupiah(cash.balance)}`)
        setLoading(false)
        return
      }
    }

    try {
      await updateCash({
        amount: Number.parseFloat(formData.amount),
        type: formData.type,
        description: formData.description,
      })
      setSuccess("Saldo kas berhasil diperbarui!")
      setFormData({ amount: "", type: "addition", description: "" })
      fetchCash()
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal memperbarui saldo kas")
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
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Kelola Saldo Kas</h2>

      {/* Current Balance */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Saldo Kas Saat Ini</h3>
        {cash ? (
          <p className="text-gray-900 text-lg">
            Saldo: {formatRupiah(cash.balance)} (Terakhir Diperbarui: {new Date(cash.lastUpdated).toLocaleString()})
          </p>
        ) : (
          <p className="text-gray-600">Belum ada catatan saldo kas</p>
        )}
      </div>

      {/* Update Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Perbarui Saldo Kas</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
            <input
              type="number"
              step="0.01"
              placeholder="Masukkan jumlah"
              value={formData.amount}
              onChange={(e) => handleChange(e, "amount")}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
            <select
              value={formData.type}
              onChange={(e) => handleChange(e, "type")}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="addition">Penambahan</option>
              <option value="deduction">Pengurangan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <input
              type="text"
              placeholder="Masukkan deskripsi"
              value={formData.description}
              onChange={(e) => handleChange(e, "description")}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
          <div className="md:col-span-3">
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
            <button
              type="submit"
              className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:bg-blue-400"
              disabled={loading}
            >
              {loading ? "Memperbarui..." : "Perbarui Saldo Kas"}
            </button>
          </div>
        </form>
      </div>

      {/* Cash Movements Table */}
      {cash && cash.movements.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Riwayat Pergerakan Kas</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deskripsi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jenis
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cash.movements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(movement.date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{movement.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatRupiah(movement.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          movement.type === "addition" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {movement.type === "addition" ? "Penambahan" : "Pengurangan"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
