'use client'
import Chat from "@/components/chat"
import { useRouter } from "next/navigation"

export default function MainPage() {
  const router = useRouter()

  const openAdmin = () => {
    router.push('/admin')
  }

  return (
    <div>
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <Chat />
      </main>
      
      {/* Admin Button */}
      <button 
        onClick={openAdmin}
        className="fixed w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-105 z-50 flex items-center justify-center text-sm font-semibold
                   md:top-6 md:right-6 
                   max-md:bottom-6 max-md:right-6"
      >
        Admin
      </button>
    </div>
  );
}