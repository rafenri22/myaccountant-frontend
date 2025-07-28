"use client"

import { useState, useEffect } from "react"
import { Bar, Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { getCash, getTransactions, getProducts } from "../lib/api"

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)

type Product = {
  id: number
  name: string
  stock: number
  sellingPrice: number
  productionCost: number
}

type Transaction = {
  id: number
  type: string
  amount: number
  description: string
  date: string
  product?: Product
}

type Cash = {
  id: number
  balance: number
  lastUpdated: string
}

type SalesSummary = {
  productId: number
  productName: string
  totalQuantity: number
  totalAmount: number
}

type DailySales = {
  date: string
  totalAmount: number
}

type MonthlyFinancial = {
  income: number
  expenses: number
  profit: number
}

export default function DashboardPage() {
  const [cash, setCash] = useState<Cash | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [cashData, transactionsData, productsData] = await Promise.all([
        getCash().catch(() => null),
        getTransactions(1, 1000),
        getProducts(),
      ])

      setCash(cashData)
      setTransactions(transactionsData?.transactions || [])
      setProducts(productsData || [])
    } catch (err: any) {
      setError(err.message || "Gagal memuat data dashboard")
    } finally {
      setLoading(false)
    }
  }

  // Generate available months from transactions
  const availableMonths = Array.from(
    new Set(
      transactions.map((t) => {
        const date = new Date(t.date)
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      }),
    ),
  )
    .sort()
    .reverse()

  // Add current month if not in list
  const currentMonth = new Date()
  const currentMonthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`
  if (!availableMonths.includes(currentMonthStr)) {
    availableMonths.unshift(currentMonthStr)
  }

  // Calculate monthly financial statistics
  const calculateMonthlyFinancial = (month: string): MonthlyFinancial => {
    const monthTransactions = transactions.filter((t) => {
      const transactionMonth = new Date(t.date).toISOString().slice(0, 7)
      return transactionMonth === month
    })

    const income = monthTransactions
      .filter((t) => t.type === "sale" || t.type === "capital")
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = monthTransactions
      .filter((t) => t.type === "purchase" || t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)

    const profit = income - expenses

    return { income, expenses, profit }
  }

  const monthlyFinancial = calculateMonthlyFinancial(selectedMonth)

  // Get month name in Indonesian
  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split("-")
    const monthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ]
    return `${monthNames[Number.parseInt(month) - 1]} ${year}`
  }

  // Penjualan berdasarkan produk
  const salesByProduct: SalesSummary[] = products
    .map((product) => {
      const productSales = transactions
        .filter((t) => t.type === "sale" && t.product?.id === product.id)
        .reduce(
          (acc, t) => ({
            totalQuantity: acc.totalQuantity + 1,
            totalAmount: acc.totalAmount + t.amount,
          }),
          { totalQuantity: 0, totalAmount: 0 },
        )
      return {
        productId: product.id,
        productName: product.name,
        totalQuantity: productSales.totalQuantity,
        totalAmount: productSales.totalAmount,
      }
    })
    .filter((s) => s.totalAmount > 0)

  // Penjualan berdasarkan waktu (30 hari terakhir)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toISOString().split("T")[0]
  }).reverse()

  const salesByDate: DailySales[] = last30Days.map((date) => {
    const dailySales = transactions
      .filter((t) => t.type === "sale" && t.date.startsWith(date))
      .reduce((acc, t) => acc + t.amount, 0)
    return { date, totalAmount: dailySales }
  })

  // Margin laba bersih per produk
  const profitMargins = products.map((product) => {
    const totalSales = transactions
      .filter((t) => t.type === "sale" && t.product?.id === product.id)
      .reduce((acc, t) => acc + t.amount, 0)
    const totalCost =
      (salesByProduct.find((s) => s.productId === product.id)?.totalQuantity || 0) * product.productionCost
    const profit = totalSales - totalCost
    const margin = totalSales > 0 ? (profit / totalSales) * 100 : 0
    return { productName: product.name, margin: margin.toFixed(2) }
  })

  // Perkiraan permintaan bulanan
  const monthlyForecast = products.map((product) => {
    const productSales = transactions.filter((t) => t.type === "sale" && t.product?.id === product.id).length
    const monthsCovered = Math.max(
      1,
      new Set(transactions.filter((t) => t.type === "sale").map((t) => new Date(t.date).toISOString().slice(0, 7)))
        .size,
    )
    const avgMonthlyDemand = productSales / monthsCovered
    return { productName: product.name, avgMonthlyDemand: avgMonthlyDemand.toFixed(2) }
  })

  // Data grafik dengan responsive options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          boxWidth: 12,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => formatRupiah(context.raw as number),
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 10,
          },
        },
      },
      y: {
        ticks: {
          font: {
            size: 10,
          },
        },
      },
    },
  }

  const salesByProductData = {
    labels: salesByProduct.map((s) => s.productName),
    datasets: [
      {
        label: "Total Penjualan (Rp)",
        data: salesByProduct.map((s) => s.totalAmount),
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  }

  const salesByTimeData = {
    labels: last30Days.map((date) => new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" })),
    datasets: [
      {
        label: "Penjualan Harian",
        data: salesByDate.map((s) => s.totalAmount),
        fill: false,
        borderColor: "rgba(59, 130, 246, 1)",
        tension: 0.1,
        pointRadius: 2,
      },
    ],
  }

  // Ringkasan
  const totalTransactions = transactions.length
  const lowStockProducts = products.filter((p) => p.stock < 10)
  const totalSales = salesByProduct.reduce((acc, s) => acc + s.totalAmount, 0)
  const recentTransactions = transactions.slice(0, 5)

  // Statistik transaksi berdasarkan jenis
  const transactionStats = {
    sales: transactions.filter((t) => t.type === "sale").length,
    purchases: transactions.filter((t) => t.type === "purchase").length,
    expenses: transactions.filter((t) => t.type === "expense").length,
    capital: transactions.filter((t) => t.type === "capital").length,
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "sale":
        return "Penjualan"
      case "purchase":
        return "Pembelian"
      case "expense":
        return "Biaya Operasional"
      case "capital":
        return "Modal/Donasi"
      default:
        return type
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h2>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {loading && <p className="text-gray-600 text-sm mb-4">Memuat data...</p>}

      {/* Kartu Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">Saldo Kas</h3>
          <p className="text-sm sm:text-base text-gray-900 font-medium">
            {cash ? formatRupiah(cash.balance) : "Tidak tersedia"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {cash ? `Terakhir: ${new Date(cash.lastUpdated).toLocaleDateString("id-ID")}` : ""}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">Total Transaksi</h3>
          <p className="text-sm sm:text-base text-gray-900 font-medium">{totalTransactions}</p>
          <p className="text-xs text-gray-500 mt-1">Semua jenis</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">Stok Rendah</h3>
          <p className="text-sm sm:text-base text-gray-900 font-medium">{lowStockProducts.length}</p>
          <p className="text-xs text-gray-500 mt-1">{"<"} 10 pcs</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">Total Penjualan</h3>
          <p className="text-sm sm:text-base text-gray-900 font-medium">{formatRupiah(totalSales)}</p>
          <p className="text-xs text-gray-500 mt-1">Semua waktu</p>
        </div>
      </div>

      {/* Statistik Keuangan Bulanan */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Statistik Keuangan Bulanan</h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor="monthSelect" className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
              Pilih Bulan:
            </label>
            <select
              id="monthSelect"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2 sm:px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 sm:flex-none"
            >
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {getMonthName(month)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs sm:text-sm font-medium text-green-800">Pendapatan</p>
                <p className="text-xs text-green-600">Penjualan + Modal</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-base sm:text-xl font-bold text-green-900">{formatRupiah(monthlyFinancial.income)}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs sm:text-sm font-medium text-red-800">Pengeluaran</p>
                <p className="text-xs text-red-600">Pembelian + Biaya</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-base sm:text-xl font-bold text-red-900">{formatRupiah(monthlyFinancial.expenses)}</p>
              </div>
            </div>
          </div>

          <div
            className={`${monthlyFinancial.profit >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"} border rounded-lg p-3 sm:p-4`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p
                  className={`text-xs sm:text-sm font-medium ${monthlyFinancial.profit >= 0 ? "text-blue-800" : "text-orange-800"}`}
                >
                  {monthlyFinancial.profit >= 0 ? "Keuntungan" : "Kerugian"}
                </p>
                <p className={`text-xs ${monthlyFinancial.profit >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                  Pendapatan - Pengeluaran
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p
                  className={`text-base sm:text-xl font-bold ${monthlyFinancial.profit >= 0 ? "text-blue-900" : "text-orange-900"}`}
                >
                  {monthlyFinancial.profit >= 0 ? "+" : ""}
                  {formatRupiah(monthlyFinancial.profit)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs sm:text-sm text-gray-600">
            Data untuk bulan <span className="font-semibold">{getMonthName(selectedMonth)}</span>
          </p>
        </div>
      </div>

      {/* Statistik Transaksi */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Statistik Transaksi</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center">
            <p className="text-lg sm:text-2xl font-bold text-blue-600">{transactionStats.sales}</p>
            <p className="text-xs sm:text-sm text-gray-600">Penjualan</p>
          </div>
          <div className="text-center">
            <p className="text-lg sm:text-2xl font-bold text-red-600">{transactionStats.purchases}</p>
            <p className="text-xs sm:text-sm text-gray-600">Pembelian</p>
          </div>
          <div className="text-center">
            <p className="text-lg sm:text-2xl font-bold text-orange-600">{transactionStats.expenses}</p>
            <p className="text-xs sm:text-sm text-gray-600">Biaya</p>
          </div>
          <div className="text-center">
            <p className="text-lg sm:text-2xl font-bold text-green-600">{transactionStats.capital}</p>
            <p className="text-xs sm:text-sm text-gray-600">Modal</p>
          </div>
        </div>
      </div>

      {/* Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Penjualan per Produk</h3>
          {salesByProduct.length > 0 ? (
            <div className="h-64 sm:h-80">
              <Bar data={salesByProductData} options={chartOptions} />
            </div>
          ) : (
            <p className="text-gray-600 text-sm">Tidak ada data penjualan produk.</p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Penjualan 30 Hari Terakhir</h3>
          {salesByDate.some((s) => s.totalAmount > 0) ? (
            <div className="h-64 sm:h-80">
              <Line data={salesByTimeData} options={chartOptions} />
            </div>
          ) : (
            <p className="text-gray-600 text-sm">Tidak ada data penjualan dalam 30 hari terakhir.</p>
          )}
        </div>
      </div>

      {/* Tables - Mobile Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Margin Laba */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Margin Laba per Produk</h3>
          {profitMargins.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Margin (%)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {profitMargins.map((p) => (
                    <tr key={p.productName}>
                      <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">{p.productName}</td>
                      <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">{p.margin}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 text-sm">Tidak ada data margin laba.</p>
          )}
        </div>

        {/* Perkiraan Permintaan */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Perkiraan Permintaan Bulanan</h3>
          {monthlyForecast.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rata-rata</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monthlyForecast.map((f) => (
                    <tr key={f.productName}>
                      <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">{f.productName}</td>
                      <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">{f.avgMonthlyDemand}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 text-sm">Tidak ada data perkiraan permintaan.</p>
          )}
        </div>
      </div>

      {/* Transaksi Terkini */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Transaksi Terkini</h3>
        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                    Deskripsi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTransactions.map((t) => (
                  <tr key={t.id}>
                    <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">
                      {new Date(t.date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" })}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          t.type === "sale"
                            ? "bg-green-100 text-green-800"
                            : t.type === "purchase"
                              ? "bg-red-100 text-red-800"
                              : t.type === "expense"
                                ? "bg-orange-100 text-orange-800"
                                : t.type === "capital"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {getTransactionTypeLabel(t.type)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">{formatRupiah(t.amount)}</td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 hidden sm:table-cell max-w-xs truncate">
                      {t.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 text-sm">Belum ada transaksi terkini.</p>
        )}
      </div>
    </div>
  )
}
