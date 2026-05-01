import { useState, useEffect } from "react"
import { Link, useLocation } from "@tanstack/react-router"
import { db } from "@/lib/db"
import { useUserWithProfile } from "@/lib/useUser"
import ThemeToggle from "@/components/ThemeToggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CreateDidjyahDialog } from "@/components/didjyah/CreateDidjyahDialog"
import { CreateFolderDialog } from "@/components/didjyah/CreateFolderDialog"
import { ViewToggle } from "@/components/didjyah/ViewToggle"
import { History } from "lucide-react"
import { Button } from "@/components/ui/button"

function getInitials(firstName?: string, lastName?: string) {
  const f = (firstName || "").trim()
  const l = (lastName || "").trim()
  if (!f && !l) return "?"
  return `${f[0] || ""}${l[0] || ""}`.toUpperCase()
}

function Clock() {
  const [time, setTime] = useState<string>("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, "0")
      const minutes = now.getMinutes().toString().padStart(2, "0")
      const seconds = now.getSeconds().toString().padStart(2, "0")
      setTime(`${hours}:${minutes}:${seconds}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return <div className="font-mono text-sm tabular-nums">{time}</div>
}

export default function Navbar() {
  const { pathname } = useLocation()
  const isDidjyahRoute = pathname === "/"

  return (
    <>
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/didjyah-logo.svg"
                alt="DidjYah"
                width={32}
                height={32}
                className="size-8"
              />
              <span className="font-semibold tracking-tight">DidjYah</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <db.SignedIn>
                <Link
                  to="/history"
                  activeProps={{
                    className: "bg-accent text-accent-foreground",
                  }}
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <History className="h-4 w-4" />
                  <span>History</span>
                </Link>
              </db.SignedIn>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Clock />
            {isDidjyahRoute ? (
              <db.SignedIn>
                <div className="flex items-center gap-2">
                  <CreateDidjyahDialog />
                  <CreateFolderDialog />
                </div>
              </db.SignedIn>
            ) : null}
            <ViewToggle />
            <ThemeToggle />
            <db.SignedOut>
              <Link
                to="/login"
                className="rounded-full border border-gray-200 px-3 py-1 text-sm hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
              >
                Log in
              </Link>
            </db.SignedOut>

            <db.SignedIn>
              <NavbarSignedIn />
            </db.SignedIn>
          </div>

          <div className="flex md:hidden items-center gap-3">
            <Clock />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-background dark:border-gray-800 md:hidden">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-around px-4">
          {isDidjyahRoute ? (
            <db.SignedIn>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center justify-center gap-1">
                  <CreateDidjyahDialog />
                  <span className="text-xs">Create</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-1">
                  <CreateFolderDialog />
                  <span className="text-xs">Folder</span>
                </div>
              </div>
              <Link
                to="/history"
                className="flex flex-col items-center justify-center gap-1"
              >
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <History className="h-5 w-5" />
                </Button>
                <span className="text-xs">History</span>
              </Link>
              <div className="flex flex-col items-center justify-center gap-1">
                <ViewToggle />
                <span className="text-xs">View</span>
              </div>
            </db.SignedIn>
          ) : null}
          <db.SignedIn>
            <div className="flex flex-col items-center justify-center gap-1">
              <NavbarSignedIn />
              <span className="text-xs">Profile</span>
            </div>
          </db.SignedIn>
        </div>
      </nav>
    </>
  )
}

function NavbarSignedIn() {
  const { user, profile } = useUserWithProfile()
  const fullName = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(" ")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar>
          <AvatarImage src={profile?.googlePicture} alt={fullName} />
          <AvatarFallback>
            {getInitials(profile?.firstName, profile?.lastName)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={profile?.googlePicture} alt={fullName} />
              <AvatarFallback>
                {getInitials(profile?.firstName, profile?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{fullName || "User"}</span>
              <span className="text-xs text-gray-500">
                {profile?.plan ?? "Free"}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.isGuest ? (
          <>
            <DropdownMenuItem asChild>
              <Link to="/login">Sign in with Google</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            void db.auth.signOut()
          }}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
