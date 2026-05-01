import React from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import type { IconPrefix, IconName } from "@fortawesome/fontawesome-svg-core"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ChevronDown, MoreVertical, Edit, Trash } from "lucide-react"
import type { InstaQLEntity } from "@instantdb/react"
import type { AppSchema } from "@/instant.schema"
import EditFolderDialog from "@/components/didjyah/EditFolderDialog"
import DeleteFolderAlertDialog from "@/components/didjyah/DeleteFolderAlertDialog"
import DidjyahCard from "@/components/didjyah/DidjyahCard"

/* eslint-disable @typescript-eslint/no-empty-object-type -- InstaQL nested link shapes */
type DidjyahFolderEntity = InstaQLEntity<AppSchema, "didjyahFolders", {}>
type DidjyahInFolder = InstaQLEntity<
  AppSchema,
  "didjyahs",
  { records: {}; folder: {} }
>
/* eslint-enable @typescript-eslint/no-empty-object-type */

function isNestedOverlayTarget(target: HTMLElement | null) {
  if (!target) return false
  return !!(
    target.closest('[data-slot="dialog-content"]') ||
    target.closest('[data-slot="dialog-overlay"]') ||
    target.closest('[data-slot="alert-dialog-content"]') ||
    target.closest('[data-slot="alert-dialog-overlay"]') ||
    target.closest('[data-slot="drawer-content"]') ||
    target.closest('[data-slot="drawer-overlay"]') ||
    target.closest('[data-slot="dropdown-menu-content"]') ||
    target.closest('[data-slot="dropdown-menu-sub-content"]')
  )
}

function FolderActionsDropdown({
  isGrid,
  buttonClassName,
  onEdit,
  onDelete,
}: {
  isGrid: boolean
  buttonClassName?: string
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={
            buttonClassName ??
            (isGrid
              ? "h-6 w-6 shrink-0 bg-background/70 backdrop-blur-sm hover:bg-background"
              : "shrink-0")
          }
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <MoreVertical className={isGrid ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          variant="destructive"
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface FolderCardProps {
  folder: DidjyahFolderEntity
  /** DidjYahs in this folder (sorted). */
  folderDidjyahs: DidjyahInFolder[]
  viewMode?: "list" | "grid"
}

function folderIcon(
  icon: string | undefined,
  iconColor: string | undefined,
  sizeClass: string,
) {
  if (icon) {
    const parts = icon.split("|")
    if (parts.length === 2) {
      const [prefix, iconName] = parts
      return (
        <FontAwesomeIcon
          icon={[prefix as IconPrefix, iconName as IconName]}
          style={{ color: iconColor ?? "#000000" }}
          className={sizeClass}
        />
      )
    }
  }
  return (
    <FontAwesomeIcon
      icon={["fas", "folder"]}
      style={{ color: iconColor ?? "#000000" }}
      className={sizeClass}
    />
  )
}

const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  folderDidjyahs,
  viewMode = "list",
}) => {
  const [open, setOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const isGrid = viewMode === "grid"
  const childCount = folderDidjyahs.length
  const countLabel =
    childCount === 1 ? "1 DidjYah" : `${childCount} DidjYahs`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          id={`Folder-${folder.id}`}
          role="button"
          tabIndex={0}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls={`folder-contents-${folder.id}`}
          className={`group relative flex cursor-pointer overflow-hidden rounded-lg border shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            isGrid ? "w-full flex-col" : "w-full max-w-[450px] flex-row"
          }`}
        >
          <div
            style={{ backgroundColor: folder.color ?? "#e8e8e8" }}
            className={`flex items-center justify-center ${
              isGrid
                ? "h-12 w-full p-1.5 lg:h-16 lg:p-2"
                : "w-12 p-2 md:w-20 md:min-w-20 md:p-4"
            }`}
          >
            {folderIcon(
              folder.icon,
              folder.iconColor,
              isGrid ? "text-lg lg:text-2xl" : "text-3xl md:text-5xl",
            )}
          </div>

          <div
            className={`flex w-full flex-col ${
              isGrid ? "gap-0.5 p-1.5 lg:p-2" : "gap-1 p-2 md:gap-2 md:p-4"
            }`}
          >
            <div
              className={`flex ${
                isGrid
                  ? "flex-col gap-0.5"
                  : "items-center justify-between gap-3 md:gap-5"
              }`}
            >
              <div
                className={`min-w-0 flex flex-1 flex-col ${isGrid ? "pr-14" : ""}`}
              >
                <span
                  id={`folder-name-${folder.id}`}
                  className={`truncate font-semibold ${
                    isGrid ? "text-[10px] lg:text-sm" : "text-xs md:text-base"
                  }`}
                >
                  {folder.name}
                </span>
                <span
                  className={`text-muted-foreground ${
                    isGrid ? "text-[9px] lg:text-xs" : "text-[10px] md:text-xs"
                  }`}
                >
                  {countLabel}
                </span>
              </div>

              {!isGrid ? (
                <div className="flex shrink-0 items-center gap-1">
                  <span
                    className="flex shrink-0 items-center justify-center"
                    aria-hidden
                  >
                    <ChevronDown
                      className={`h-5 w-5 transition-transform duration-200 md:h-6 md:w-6 ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </span>
                  <FolderActionsDropdown
                    isGrid={false}
                    onEdit={() => setEditDialogOpen(true)}
                    onDelete={() => setDeleteDialogOpen(true)}
                  />
                </div>
              ) : null}
            </div>

            {isGrid ? (
              <div className="absolute top-1 right-1 flex items-center gap-0.5">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-md bg-background/70 backdrop-blur-sm"
                  aria-hidden
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </span>
                <FolderActionsDropdown
                  isGrid
                  onEdit={() => setEditDialogOpen(true)}
                  onDelete={() => setDeleteDialogOpen(true)}
                />
              </div>
            ) : null}
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent
        id={`folder-contents-${folder.id}`}
        side="bottom"
        align="center"
        sideOffset={8}
        collisionPadding={12}
        className="w-[min(92vw,28rem)] gap-0 overflow-hidden p-0"
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement | null
          if (isNestedOverlayTarget(target)) {
            e.preventDefault()
          }
        }}
      >
        <div
          className="flex items-center gap-2 border-b border-foreground/10 px-3 py-2"
          style={{ backgroundColor: folder.color ?? "#e8e8e8" }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {folderIcon(
              folder.icon,
              folder.iconColor,
              "text-base shrink-0",
            )}
            <PopoverHeader className="min-w-0 gap-0 p-0">
              <PopoverTitle className="truncate text-sm font-semibold">
                {folder.name}
              </PopoverTitle>
              <p className="truncate text-xs text-muted-foreground">
                {countLabel}
              </p>
            </PopoverHeader>
          </div>
          <FolderActionsDropdown
            isGrid={false}
            buttonClassName="h-8 w-8 shrink-0"
            onEdit={() => setEditDialogOpen(true)}
            onDelete={() => setDeleteDialogOpen(true)}
          />
        </div>

        <div className="max-h-[min(70vh,24rem)] overflow-y-auto p-2">
          {childCount === 0 ? (
            <p className="px-1 py-6 text-center text-xs text-muted-foreground">
              No DidjYahs in this folder yet.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {folderDidjyahs.map((item) => (
                <DidjyahCard
                  key={item.id}
                  detail={item}
                  viewMode="grid"
                  onRecorded={() => setOpen(false)}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>

      <EditFolderDialog
        folder={folder}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
      <DeleteFolderAlertDialog
        folder={folder}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </Popover>
  )
}

export default FolderCard
