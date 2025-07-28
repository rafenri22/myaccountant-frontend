"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createRawMaterial, updateRawMaterial, deleteRawMaterial, getRawMaterials, getCash } from "../../lib/api"

type RawMaterial = {
  id: number
  name: string
  stock: number
  costPerUnit: number
}

type Cash = {
  id: number
  balance: number
  lastUpdated: string
}

export default function RawMaterialForm() {
  const [formData, setFormData] = useState({
    name: "",
    stock: "",
    costPerUnit: "",
  })
  const [updateFormData, setUpdateFormData] = useState({
    id: 0,
    name: "",
    costPerUnit: "",
    stockToAdd: "",
  })
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [cash, setCash] = useState<Cash | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedRawMaterialId, setSelectedRawMaterialId] = useState<number | null>(null)
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null)
  const [updateCalculatedCost, setUpdateCalculatedCost] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    calculateTotalCost()
  }, [formData.stock, formData.costPerUnit])

  useEffect(() => {
    calculateUpdateCost()
  }, [updateFormData.stockToAdd, updateFormData.costPerUnit])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [rawMaterialsData, cashData] = await Promise.all([getRawMaterials(), getCash().catch(() => null)])
      setRawMaterials(rawMaterialsData)
      setCash(cashData)
    } catch (err) {
      setError("Gagal memuat data")
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalCost = () => {
    const stock = Number.parseFloat(formData.stock)
    const costPerUnit = Number.parseFloat(formData.costPerUnit)
    if (!isNaN(stock) && !isNaN(costPerUnit) && stock > 0 && costPerUnit > 0) {
      setCalculatedCost(stock * costPerUnit)
    } else {
      setCalculatedCost(null)
    }
  }

  const calculateUpdateCost = () => {
    const stockToAdd = Number.parseFloat(updateFormData.stockToAdd)
    const costPerUnit = Number.parseFloat(updateFormData.costPerUnit)
    if (!isNaN(stockToAdd) && !isNaN(costPerUnit) && stockToAdd > 0 && costPerUnit > 0) {
      setUpdateCalculatedCost(stockToAdd * costPerUnit)
    } else {
      setUpdateCalculatedCost(null)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof formData) => {
    setFormData({ ...formData, [field]: e.target.value })
    setError(null)
  }

  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof updateFormData) => {
    setUpdateFormData({ ...updateFormData, [field]: e.target.value })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (!formData.name.trim()) {
      setError("Nama wajib diisi")
      setLoading(false)
      return
    }

    const stock = Number.parseFloat(formData.stock)
    if (isNaN(stock) || stock < 0) {
      setError("Stok harus angka non-negatif")
      setLoading(false)
      return
    }

    const costPerUnit = Number.parseFloat(formData.costPerUnit)
    if (isNaN(costPerUnit) || costPerUnit <= 0) {
      setError("Biaya per unit harus angka positif")
      setLoading(false)
      return
    }

    const totalCost = stock * costPerUnit
    if (cash && cash.balance < totalCost) {
      setError(
        `Saldo kas tidak mencukupi. Dibutuhkan: ${formatRupiah(totalCost)}, Tersedia: ${formatRupiah(cash.balance)}`,
      )
      setLoading(false)
      return
    }

    try {
      await createRawMaterial({
        name: formData.name,
        stock: stock,
        costPerUnit: costPerUnit,
      })
      setSuccess("Bahan baku berhasil ditambahkan dan saldo kas telah dikurangi!")
      setFormData({ name: "", stock: "", costPerUnit: "" })
      setCalculatedCost(null)
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal menambahkan bahan baku")
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (rawMaterial: RawMaterial) => {
    setUpdateFormData({
      id: rawMaterial.id,
      name: rawMaterial.name,
      costPerUnit: rawMaterial.costPerUnit.toString(),
      stockToAdd: "",
    })
    setUpdateCalculatedCost(null)
    setIsEditModalOpen(true)
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (!updateFormData.name.trim()) {
      setError("Nama wajib diisi")
      setLoading(false)
      return
    }

    if (updateFormData.costPerUnit && Number.parseFloat(updateFormData.costPerUnit) <= 0) {
      setError("Biaya per unit harus angka positif")
      setLoading(false)
      return
    }

    if (updateFormData.stockToAdd && Number.parseFloat(updateFormData.stockToAdd) < 0) {
      setError("Stok yang ditambahkan harus angka non-negatif")
      setLoading(false)
      return
    }

    // Check cash balance if adding stock
    if (updateFormData.stockToAdd && Number.parseFloat(updateFormData.stockToAdd) > 0) {
      const stockToAdd = Number.parseFloat(updateFormData.stockToAdd)
      const costPerUnit = Number.parseFloat(updateFormData.costPerUnit)
      const totalCost = stockToAdd * costPerUnit

      if (cash && cash.balance < totalCost) {
        setError(
          `Saldo kas tidak mencukupi. Dibutuhkan: ${formatRupiah(totalCost)}, Tersedia: ${formatRupiah(cash.balance)}`,
        )
        setLoading(false)
        return
      }
    }

    try {
      await updateRawMaterial(updateFormData.id, {
        name: updateFormData.name,
        costPerUnit: updateFormData.costPerUnit ? Number.parseFloat(updateFormData.costPerUnit) : undefined,
        stockToAdd: updateFormData.stockToAdd ? Number.parseFloat(updateFormData.stockToAdd) : undefined,
      })
      setSuccess("Bahan baku berhasil diperbarui!")
      setIsEditModalOpen(false)
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal memperbarui bahan baku")
    } finally {
      setLoading(false)
    }
  }

  const openDeleteModal = (id: number) => {
    setSelectedRawMaterialId(id)
    setIsDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedRawMaterialId) return

    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      await deleteRawMaterial(selectedRawMaterialId)
      setSuccess("Bahan baku berhasil dihapus!")
      setIsDeleteModalOpen(false)
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal menghapus bahan baku")
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
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Kelola Bahan Baku</h2>

      {/* Current Cash Balance */}
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

      {/* Create Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Tambah Bahan Baku Baru</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
            <input
              type="text"
              placeholder="Masukkan nama bahan baku"
              value={formData.name}
              onChange={(e) => handleChange(e, "name")}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stok Awal (kg)</label>
            <input
              type="number"
              step="0.01"
              placeholder="Masukkan stok awal"
              value={formData.stock}
              onChange={(e) => handleChange(e, "stock")}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Biaya per Unit (Rp/kg)</label>
            <input
              type="number"
              step="0.01"
              placeholder="Masukkan biaya per kg"
              value={formData.costPerUnit}
              onChange={(e) => handleChange(e, "costPerUnit")}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Biaya Pembelian</label>
            <p className="text-gray-900 text-lg font-semibold">
              {calculatedCost !== null ? formatRupiah(calculatedCost) : "N/A"}
            </p>
            {calculatedCost !== null && cash && cash.balance < calculatedCost && (
              <p className="text-red-500 text-sm mt-1">
                ⚠️ Saldo kas tidak mencukupi! Kekurangan: {formatRupiah(calculatedCost - cash.balance)}
              </p>
            )}
          </div>
          <div className="md:col-span-3">
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
            <button
              type="submit"
              className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:bg-blue-400"
              disabled={loading || (calculatedCost !== null && cash !== null && cash.balance < calculatedCost)}
            >
              {loading ? "Menambahkan..." : "Tambah Bahan Baku"}
            </button>
          </div>
        </form>
      </div>

      {/* Raw Materials Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Daftar Bahan Baku</h3>
        {rawMaterials.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stok (kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Biaya per Unit (Rp/kg)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rawMaterials.map((rawMaterial) => (
                  <tr key={rawMaterial.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rawMaterial.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rawMaterial.stock.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatRupiah(rawMaterial.costPerUnit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(rawMaterial)}
                        className="text-blue-600 hover:text-blue-800 mr-4"
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(rawMaterial.id)}
                        className="text-red-600 hover:text-red-800"
                        disabled={loading}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">Belum ada bahan baku tersedia.</p>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Bahan Baku</h3>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                <input
                  type="text"
                  value={updateFormData.name}
                  onChange={(e) => handleUpdateChange(e, "name")}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Biaya per Unit (Rp/kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={updateFormData.costPerUnit}
                  onChange={(e) => handleUpdateChange(e, "costPerUnit")}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stok untuk Ditambahkan (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Opsional"
                  value={updateFormData.stockToAdd}
                  onChange={(e) => handleUpdateChange(e, "stockToAdd")}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Biaya Tambahan</label>
                <p className="text-gray-900 font-semibold">
                  {updateCalculatedCost !== null ? formatRupiah(updateCalculatedCost) : "N/A"}
                </p>
                {updateCalculatedCost !== null && cash && cash.balance < updateCalculatedCost && (
                  <p className="text-red-500 text-sm mt-1">
                    ⚠️ Saldo kas tidak mencukupi! Kekurangan: {formatRupiah(updateCalculatedCost - cash.balance)}
                  </p>
                )}
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {success && <p className="text-green-500 text-sm">{success}</p>}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                  disabled={
                    loading || (updateCalculatedCost !== null && cash !== null && cash.balance < updateCalculatedCost)
                  }
                >
                  {loading ? "Memperbarui..." : "Perbarui"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Konfirmasi Penghapusan</h3>
            <p className="text-gray-600 mb-4">Apakah Anda yakin ingin menghapus bahan baku ini?</p>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={loading}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400"
                disabled={loading}
              >
                {loading ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
