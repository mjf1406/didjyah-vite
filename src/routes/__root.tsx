import { createRootRoute, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"

import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { UndoProvider } from "@/lib/undo"
import ConnectionStatusMonitor from "@/components/ConnectionStatusMonitor"
import Navbar from "@/components/Navbar"
import EnsureProfile from "@/components/EnsureProfile"
import { Toaster } from "@/components/ui/sonner"
import PWAUpdatePrompt from "@/components/PWAUpdatePrompt"
import { db } from "@/lib/db"

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <UndoProvider>
          <ConnectionStatusMonitor />
          <Navbar />
          <db.SignedIn>
            <EnsureProfile />
          </db.SignedIn>
          <div className="pb-16 md:pb-0">
            <Outlet />
          </div>
          <Toaster />
          <PWAUpdatePrompt />
        </UndoProvider>
      </TooltipProvider>
      <TanStackRouterDevtools position="bottom-right" />
    </ThemeProvider>
  )
}
