"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, User, Settings, LogOut, ChevronDown } from "lucide-react"

export default function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const pathname = usePathname()

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard"
    if (pathname.includes("/accounting/cashform")) return "Kelola Kas"
    if (pathname.includes("/accounting/transactions/sales")) return "Penjualan"
    if (pathname.includes("/accounting/transactions/purchases")) return "Pembelian"
    if (pathname.includes("/accounting/transactions/expenses")) return "Biaya Operasional"
    if (pathname.includes("/accounting/transactions/capital")) return "Modal/Donasi"
    if (pathname.includes("/production/raw-material")) return "Kelola Bahan Baku"
    if (pathname.includes("/production/product")) return "Kelola Produk"
    if (pathname.includes("/production/reports")) return "Laporan"
    return "MyAccountants"
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          {/* Left side - Page Title (with space for mobile menu) */}
          <div className="flex items-center space-x-3 ml-12 lg:ml-0">
            <div className="flex-shrink-0 hidden sm:block">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MA</span>
              </div>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
            </div>
          </div>

          {/* Center - Breadcrumb (hidden on mobile) */}
          <div className="hidden xl:flex items-center space-x-2 text-sm text-gray-500">
            <Link href="/dashboard" className="hover:text-gray-700">
              Beranda
            </Link>
            {pathname !== "/dashboard" && (
              <>
                <span>/</span>
                <span className="text-gray-900">{getPageTitle()}</span>
              </>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Notifications */}
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full relative">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-1 sm:space-x-2 p-1 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
                <span className="text-xs sm:text-sm font-medium hidden sm:block">Admin</span>
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">Administrator</p>
                    <p className="text-xs text-gray-500">admin@myaccountants.com</p>
                  </div>
                  <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <User className="h-4 w-4 mr-2" />
                    Profil Saya
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Pengaturan
                  </Link>
                  <div className="border-t border-gray-100">
                    <button className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50">
                      <LogOut className="h-4 w-4 mr-2" />
                      Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
