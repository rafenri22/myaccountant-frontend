"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createProduct, getRawMaterials, getProducts, updateProduct, deleteProduct } from "../../lib/api"

type RawMaterial = {
  id: number
  name: string
  stock: number
  costPerUnit: number
}

type Product = {
  id: number
  name: string
  stock: number
  productionCost: number
  sellingPrice: number
  productionTime?: number
  rawMaterials: { rawMaterial: RawMaterial; quantity: number }[]
}

export default function ProductForm() {
  const [createFormData, setCreateFormData] = useState({
    name: "",
    productionTime: "",
    profitMargin: "",
  })
  const [updateFormData, setUpdateFormData] = useState({
    id: 0,
    name: "",
    productionTime: "",
    profitMargin: "",
    stockToAdd: "",
    rawMaterials: [{ rawMaterialId: 0, quantity: "" }],
  })
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedRawMaterials, setSelectedRawMaterials] = useState<{ rawMaterialId: number; quantity: string }[]>([
    { rawMaterialId: 0, quantity: "" },
  ])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [calculatedProductionCost, setCalculatedProductionCost] = useState<number | null>(null)
  const [calculatedSellingPrice, setCalculatedSellingPrice] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    calculateSellingPrice()
  }, [selectedRawMaterials, createFormData.profitMargin])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [rawMaterialsData, productsData] = await Promise.all([getRawMaterials(), getProducts()])
      setRawMaterials(rawMaterialsData)
      setProducts(productsData)
    } catch (err) {
      setError("Gagal memuat data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof createFormData) => {
    setCreateFormData({ ...createFormData, [field]: e.target.value })
    setError(null)
    calculateSellingPrice()
  }

  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof updateFormData) => {
    setUpdateFormData({ ...updateFormData, [field]: e.target.value })
    setError(null)
  }

  const handleRawMaterialChange = (
    index: number,
    field: "rawMaterialId" | "quantity",
    value: string,
    isUpdate = false,
  ) => {
    const target = isUpdate ? updateFormData.rawMaterials : selectedRawMaterials
    const setTarget = isUpdate ? setUpdateFormData : setSelectedRawMaterials

    const newRawMaterials = [...target]
    newRawMaterials[index] = { ...newRawMaterials[index], [field]: value }

    if (isUpdate) {
      setUpdateFormData({ ...updateFormData, rawMaterials: newRawMaterials })
    } else {
      setSelectedRawMaterials(newRawMaterials)
    }

    setError(null)
    if (!isUpdate) calculateSellingPrice()
  }

  const addRawMaterial = (isUpdate = false) => {
    if (isUpdate) {
      setUpdateFormData({
        ...updateFormData,
        rawMaterials: [...updateFormData.rawMaterials, { rawMaterialId: 0, quantity: "" }],
      })
    } else {
      setSelectedRawMaterials([...selectedRawMaterials, { rawMaterialId: 0, quantity: "" }])
    }
  }

  const removeRawMaterial = (index: number, isUpdate = false) => {
    if (isUpdate) {
      setUpdateFormData({
        ...updateFormData,
        rawMaterials: updateFormData.rawMaterials.filter((_, i) => i !== index),
      })
    } else {
      setSelectedRawMaterials(selectedRawMaterials.filter((_, i) => i !== index))
    }
    if (!isUpdate) calculateSellingPrice()
  }

  const calculateSellingPrice = () => {
    let productionCost = 0

    for (const rm of selectedRawMaterials) {
      if (rm.rawMaterialId && rm.quantity) {
        const material = rawMaterials.find((m) => m.id === Number.parseInt(rm.rawMaterialId.toString()))
        if (material) {
          const quantity = Number.parseFloat(rm.quantity)
          if (!isNaN(quantity) && quantity > 0) {
            const cost = material.costPerUnit * quantity
            productionCost += cost
          }
        }
      }
    }

    const profitMargin = Number.parseFloat(createFormData.profitMargin || "0")
    if (!isNaN(profitMargin) && profitMargin >= 0) {
      const profitAmount = (productionCost * profitMargin) / 100
      const sellingPrice = productionCost + profitAmount
      setCalculatedProductionCost(productionCost > 0 ? Number.parseFloat(productionCost.toFixed(2)) : null)
      setCalculatedSellingPrice(sellingPrice > 0 ? Number.parseFloat(sellingPrice.toFixed(2)) : null)
    } else {
      setCalculatedProductionCost(null)
      setCalculatedSellingPrice(null)
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (!createFormData.name.trim()) {
      setError("Nama wajib diisi")
      setLoading(false)
      return
    }

    const profitMargin = Number.parseFloat(createFormData.profitMargin)
    if (isNaN(profitMargin) || profitMargin < 0) {
      setError("Margin laba harus angka non-negatif")
      setLoading(false)
      return
    }

    if (
      selectedRawMaterials.length === 0 ||
      selectedRawMaterials.some((rm) => rm.rawMaterialId === 0 || !rm.quantity || Number.parseFloat(rm.quantity) <= 0)
    ) {
      setError("Minimal satu bahan baku valid dengan kuantitas positif diperlukan")
      setLoading(false)
      return
    }

    try {
      await createProduct({
        name: createFormData.name,
        productionTime: createFormData.productionTime ? Number.parseInt(createFormData.productionTime) : undefined,
        profitMargin: profitMargin,
        rawMaterials: selectedRawMaterials.map((rm) => ({
          rawMaterialId: Number.parseInt(rm.rawMaterialId.toString()),
          quantity: Number.parseFloat(rm.quantity),
        })),
      })

      setSuccess("Produk berhasil ditambahkan!")
      setCreateFormData({ name: "", productionTime: "", profitMargin: "" })
      setSelectedRawMaterials([{ rawMaterialId: 0, quantity: "" }])
      setCalculatedProductionCost(null)
      setCalculatedSellingPrice(null)
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal menambahkan produk")
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (product: Product) => {
    setUpdateFormData({
      id: product.id,
      name: product.name,
      productionTime: product.productionTime?.toString() || "",
      profitMargin:
        product.productionCost > 0
          ? (((product.sellingPrice - product.productionCost) * 100) / product.productionCost).toString()
          : "",
      stockToAdd: "",
      rawMaterials: product.rawMaterials.map((rm) => ({
        rawMaterialId: rm.rawMaterial.id,
        quantity: rm.quantity.toString(),
      })),
    })
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

    const profitMargin = updateFormData.profitMargin ? Number.parseFloat(updateFormData.profitMargin) : undefined
    if (profitMargin !== undefined && (isNaN(profitMargin) || profitMargin < 0)) {
      setError("Margin laba harus angka non-negatif")
      setLoading(false)
      return
    }

    if (
      updateFormData.rawMaterials.length === 0 ||
      updateFormData.rawMaterials.some(
        (rm) => rm.rawMaterialId === 0 || !rm.quantity || Number.parseFloat(rm.quantity) <= 0,
      )
    ) {
      setError("Minimal satu bahan baku valid dengan kuantitas positif diperlukan")
      setLoading(false)
      return
    }

    const stockToAdd = updateFormData.stockToAdd ? Number.parseInt(updateFormData.stockToAdd) : undefined
    if (stockToAdd !== undefined && (isNaN(stockToAdd) || stockToAdd < 0)) {
      setError("Stok yang ditambahkan harus angka non-negatif (dalam pcs)")
      setLoading(false)
      return
    }

    try {
      await updateProduct(updateFormData.id, {
        name: updateFormData.name,
        productionTime: updateFormData.productionTime ? Number.parseInt(updateFormData.productionTime) : undefined,
        profitMargin: profitMargin,
        rawMaterials: updateFormData.rawMaterials.map((rm) => ({
          rawMaterialId: Number.parseInt(rm.rawMaterialId.toString()),
          quantity: Number.parseFloat(rm.quantity),
        })),
        stockToAdd: stockToAdd,
      })

      setSuccess("Produk berhasil diperbarui!")
      setIsEditModalOpen(false)
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal memperbarui produk")
    } finally {
      setLoading(false)
    }
  }

  const openDeleteModal = (id: number) => {
    setSelectedProductId(id)
    setIsDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedProductId) return

    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      await deleteProduct(selectedProductId)
      setSuccess("Produk berhasil dihapus!")
      setIsDeleteModalOpen(false)
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal menghapus produk")
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
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Kelola Produk</h2>

      {/* Create Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Tambah Produk Baru</h3>
        <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
            <input
              type="text"
              placeholder="Masukkan nama produk"
              value={createFormData.name}
              onChange={(e) => handleCreateChange(e, "name")}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Produksi (hari)</label>
            <input
              type="number"
              placeholder="Opsional"
              value={createFormData.productionTime}
              onChange={(e) => handleCreateChange(e, "productionTime")}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Margin Laba (%)</label>
            <input
              type="number"
              step="0.01"
              placeholder="Masukkan margin laba"
              value={createFormData.profitMargin}
              onChange={(e) => handleCreateChange(e, "profitMargin")}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bahan Baku (untuk 1 pcs produk)</label>
            {selectedRawMaterials.map((rm, index) => (
              <div key={index} className="flex space-x-2 mb-2">
                <select
                  value={rm.rawMaterialId}
                  onChange={(e) => handleRawMaterialChange(index, "rawMaterialId", e.target.value)}
                  className="w-1/2 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="0">Pilih bahan baku</option>
                  {rawMaterials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name} (Stok: {material.stock.toFixed(2)} kg, Biaya: {formatRupiah(material.costPerUnit)}
                      /kg)
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Kuantitas (kg)"
                  value={rm.quantity}
                  onChange={(e) => handleRawMaterialChange(index, "quantity", e.target.value)}
                  className="w-1/3 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => removeRawMaterial(index)}
                  className="text-red-600 hover:text-red-800"
                  disabled={loading}
                >
                  Hapus
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addRawMaterial()}
              className="mt-2 text-blue-600 hover:text-blue-800"
              disabled={loading}
            >
              Tambah Bahan Baku
            </button>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Produksi per Pcs</label>
            <p className="text-gray-900">
              {calculatedProductionCost !== null ? formatRupiah(calculatedProductionCost) : "N/A"}
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual per Pcs</label>
            <p className="text-gray-900">
              {calculatedSellingPrice !== null ? formatRupiah(calculatedSellingPrice) : "N/A"}
            </p>
          </div>
          <div className="md:col-span-2">
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
            <button
              type="submit"
              className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:bg-blue-400"
              disabled={loading}
            >
              {loading ? "Menambahkan..." : "Tambah Produk"}
            </button>
          </div>
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Daftar Produk</h3>
        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stok (pcs)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Biaya Produksi/pcs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Harga Jual/pcs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bahan Baku
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.stock} pcs</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatRupiah(product.productionCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatRupiah(product.sellingPrice)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.rawMaterials.map((rm) => (
                        <div key={rm.rawMaterial.id}>
                          {rm.rawMaterial.name}: {rm.quantity.toFixed(2)} kg
                        </div>
                      ))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(product)}
                        className="text-blue-600 hover:text-blue-800 mr-4"
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(product.id)}
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
          <p className="text-gray-600">Belum ada produk tersedia.</p>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Produk</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Produksi (hari)</label>
                <input
                  type="number"
                  value={updateFormData.productionTime}
                  onChange={(e) => handleUpdateChange(e, "productionTime")}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Margin Laba (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={updateFormData.profitMargin}
                  onChange={(e) => handleUpdateChange(e, "profitMargin")}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bahan Baku (untuk 1 pcs produk)</label>
                {updateFormData.rawMaterials.map((rm, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <select
                      value={rm.rawMaterialId}
                      onChange={(e) => handleRawMaterialChange(index, "rawMaterialId", e.target.value, true)}
                      className="w-1/2 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    >
                      <option value="0">Pilih bahan baku</option>
                      {rawMaterials.map((material) => (
                        <option key={material.id} value={material.id}>
                          {material.name} (Stok: {material.stock.toFixed(2)} kg)
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Kuantitas (kg)"
                      value={rm.quantity}
                      onChange={(e) => handleRawMaterialChange(index, "quantity", e.target.value, true)}
                      className="w-1/3 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => removeRawMaterial(index, true)}
                      className="text-red-600 hover:text-red-800"
                      disabled={loading}
                    >
                      Hapus
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addRawMaterial(true)}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                  disabled={loading}
                >
                  Tambah Bahan Baku
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stok untuk Ditambahkan (pcs)</label>
                <input
                  type="number"
                  placeholder="Opsional - akan mengurangi bahan baku"
                  value={updateFormData.stockToAdd}
                  onChange={(e) => handleUpdateChange(e, "stockToAdd")}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
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
                  disabled={loading}
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
            <p className="text-gray-600 mb-4">Apakah Anda yakin ingin menghapus produk ini?</p>
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
