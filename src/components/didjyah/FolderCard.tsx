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
import { ChevronDown, MoreVertical, Edit, Trash } from "lucide-react"
import type { InstaQLEntity } from "@instantdb/react"
import type { AppSchema } from "@/instant.schema"
import EditFolderDialog from "@/components/didjyah/EditFolderDialog"
import DeleteFolderAlertDialog from "@/components/didjyah/DeleteFolderAlertDialog"

/* eslint-disable @typescript-eslint/no-empty-object-type -- InstaQL nested link shapes */
type DidjyahFolderEntity = InstaQLEntity<AppSchema, "didjyahFolders", {}>
/* eslint-enable @typescript-eslint/no-empty-object-type */

interface FolderCardProps {
  folder: DidjyahFolderEntity
  childCount: number
  viewMode?: "list" | "grid"
  isExpanded: boolean
  onToggle: () => void
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
  childCount,
  viewMode = "list",
  isExpanded,
  onToggle,
}) => {
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const isGrid = viewMode === "grid"
  const countLabel =
    childCount === 1 ? "1 DidjYah" : `${childCount} DidjYahs`

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return
    onToggle()
  }

  return (
    <div
      id={`Folder-${folder.id}`}
      className={`relative flex cursor-pointer overflow-hidden rounded-lg border shadow-sm ${
        isGrid ? "w-full flex-col" : "w-full max-w-[450px] flex-row"
      }`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onToggle()
        }
      }}
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
            isGrid ? "flex-col gap-0.5" : "items-center justify-between gap-3 md:gap-5"
          }`}
        >
          <div className="min-w-0 flex flex-1 flex-col">
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
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggle()
                }}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
              >
                <ChevronDown
                  className={`h-5 w-5 transition-transform md:h-6 md:w-6 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    variant="destructive"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}
        </div>

        {isGrid ? (
          <div className="absolute top-1 right-1 flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 bg-background/70 backdrop-blur-sm hover:bg-background"
              onClick={(e) => {
                e.stopPropagation()
                onToggle()
              }}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 bg-background/70 backdrop-blur-sm hover:bg-background"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditDialogOpen(true)
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteDialogOpen(true)
                  }}
                  variant="destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>

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
    </div>
  )
}

export default FolderCard
