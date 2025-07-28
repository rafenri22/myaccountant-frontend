"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { X, Menu } from "lucide-react"

export default function Sidebar() {
  const [isAccountingOpen, setIsAccountingOpen] = useState(false)
  const [isProductionOpen, setIsProductionOpen] = useState(false)
  const [isReportsOpen, setIsReportsOpen] = useState(false)
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("mobile-sidebar")
      const menuButton = document.getElementById("mobile-menu-button")

      if (
        isMobileMenuOpen &&
        sidebar &&
        menuButton &&
        !sidebar.contains(event.target as Node) &&
        !menuButton.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMobileMenuOpen])

  const toggleAccounting = () => setIsAccountingOpen(!isAccountingOpen)
  const toggleProduction = () => setIsProductionOpen(!isProductionOpen)
  const toggleReports = () => setIsReportsOpen(!isReportsOpen)
  const toggleTransactions = () => setIsTransactionsOpen(!isTransactionsOpen)

  const isActive = (path: string) =>
    pathname === path ? "bg-blue-100 text-blue-800" : "text-gray-600 hover:bg-gray-100"

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:justify-center">
        <h1 className="text-xl font-bold text-gray-800">MyAccountants</h1>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        <ul className="space-y-2">
          <li>
            <Link href="/dashboard" className={`block p-3 rounded-lg transition-colors ${isActive("/dashboard")}`}>
              Dashboard
            </Link>
          </li>
          <li>
            <button
              onClick={toggleAccounting}
              className="w-full text-left text-gray-600 hover:bg-gray-100 p-3 rounded-lg flex justify-between items-center transition-colors"
            >
              <span>Akuntansi</span>
              <svg
                className={`w-4 h-4 transform transition-transform ${isAccountingOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isAccountingOpen && (
              <ul className="ml-4 mt-2 space-y-1">
                <li>
                  <Link
                    href="/accounting/cashform"
                    className={`block p-2 rounded-lg transition-colors ${isActive("/accounting/cashform")}`}
                  >
                    Kelola Kas
                  </Link>
                </li>
                <li>
                  <button
                    onClick={toggleTransactions}
                    className="w-full text-left text-gray-600 hover:bg-gray-100 p-2 rounded-lg flex justify-between items-center transition-colors"
                  >
                    <span>Transaksi</span>
                    <svg
                      className={`w-4 h-4 transform transition-transform ${isTransactionsOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isTransactionsOpen && (
                    <ul className="ml-4 mt-2 space-y-1">
                      <li>
                        <Link
                          href="/accounting/transactions/sales"
                          className={`block p-2 rounded-lg transition-colors ${isActive("/accounting/transactions/sales")}`}
                        >
                          Penjualan
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/accounting/transactions/purchases"
                          className={`block p-2 rounded-lg transition-colors ${isActive("/accounting/transactions/purchases")}`}
                        >
                          Pembelian
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/accounting/transactions/expenses"
                          className={`block p-2 rounded-lg transition-colors ${isActive("/accounting/transactions/expenses")}`}
                        >
                          Biaya Operasional
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/accounting/transactions/capital"
                          className={`block p-2 rounded-lg transition-colors ${isActive("/accounting/transactions/capital")}`}
                        >
                          Modal/Donasi
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
              </ul>
            )}
          </li>
          <li>
            <button
              onClick={toggleProduction}
              className="w-full text-left text-gray-600 hover:bg-gray-100 p-3 rounded-lg flex justify-between items-center transition-colors"
            >
              <span>Produksi & Inventori</span>
              <svg
                className={`w-4 h-4 transform transition-transform ${isProductionOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isProductionOpen && (
              <ul className="ml-4 mt-2 space-y-1">
                <li>
                  <Link
                    href="/production/raw-material"
                    className={`block p-2 rounded-lg transition-colors ${isActive("/production/raw-material")}`}
                  >
                    Kelola Bahan Baku
                  </Link>
                </li>
                <li>
                  <Link
                    href="/production/product"
                    className={`block p-2 rounded-lg transition-colors ${isActive("/production/product")}`}
                  >
                    Kelola Produk
                  </Link>
                </li>
                <li>
                  <button
                    onClick={toggleReports}
                    className="w-full text-left text-gray-600 hover:bg-gray-100 p-2 rounded-lg flex justify-between items-center transition-colors"
                  >
                    <span>Laporan</span>
                    <svg
                      className={`w-4 h-4 transform transition-transform ${isReportsOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isReportsOpen && (
                    <ul className="ml-4 mt-2 space-y-1">
                      <li>
                        <Link
                          href="/production/reports/raw-materials"
                          className={`block p-2 rounded-lg transition-colors ${isActive("/production/reports/raw-materials")}`}
                        >
                          Laporan Bahan Baku
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/production/reports/products"
                          className={`block p-2 rounded-lg transition-colors ${isActive("/production/reports/products")}`}
                        >
                          Laporan Produk
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
              </ul>
            )}
          </li>
        </ul>
      </nav>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white shadow-lg border-r border-gray-200">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Button */}
      <button
        id="mobile-menu-button"
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && <div className="lg:hidden fixed inset-0 z-40 bg-white bg-opacity-50 backdrop-blur-sm" />}

      {/* Mobile Sidebar */}
      <aside
        id="mobile-sidebar"
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <SidebarContent />
        </div>
      </aside>
    </>
  )
}
