import type React from "react"
import "./globals.css"
import Sidebar from "./components/Sidebar"
import Header from "./components/Header"
import Footer from "./components/Footer"

export const metadata = {
  title: "MyAccountants - Sistem Manajemen Akuntansi & Inventori",
  description:
    "Sistem manajemen akuntansi dan inventori yang membantu bisnis Anda berkembang dengan pengelolaan keuangan yang efisien dan akurat.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-gray-50">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6">{children}</main>
            <Footer />
          </div>
        </div>
      </body>
    </html>
  )
}
