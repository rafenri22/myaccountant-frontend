"use client"

import Link from "next/link"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200 py-2">
      <div className="px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <div className="text-gray-600 text-xs sm:text-sm">© {currentYear} MyAccountants. Semua hak dilindungi.</div>
          <div className="flex space-x-4">
            <Link href="/privacy" className="text-gray-500 hover:text-gray-700 text-xs sm:text-sm transition-colors">
              Privasi
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-700 text-xs sm:text-sm transition-colors">
              Syarat
            </Link>
            <Link href="/support" className="text-gray-500 hover:text-gray-700 text-xs sm:text-sm transition-colors">
              Bantuan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
