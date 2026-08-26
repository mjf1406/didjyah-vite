import React, { useState, useMemo } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import type { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { faPickerLookups } from "@/lib/fa-icons"
import PopoverContentInline from "./PopoverContentInline"

type FAIconName = IconName

interface FAIconPickerProps {
  onSelectIcon: (iconName: FAIconName, prefix: IconPrefix) => void
  selectedIcon?: { name: FAIconName; prefix: IconPrefix }
}

const FAIconPicker: React.FC<FAIconPickerProps> = ({
  onSelectIcon,
  selectedIcon,
}) => {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredIcons = useMemo(() => {
    return faPickerLookups.filter((icon) =>
      icon.iconName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  const handleSelectIcon = (iconName: FAIconName, prefix: IconPrefix) => {
    onSelectIcon(iconName, prefix)
    setOpen(false)
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-52 justify-between">
            {selectedIcon ? (
              <FontAwesomeIcon
                icon={[selectedIcon.prefix, selectedIcon.name]}
                className="mr-2 h-6 w-6"
              />
            ) : (
              <FontAwesomeIcon
                icon={["fas", "circle-question"]}
                className="mr-2 h-6 w-6"
              />
            )}
            {selectedIcon ? selectedIcon.name : "Select icon..."}
          </Button>
        </PopoverTrigger>
        <PopoverContentInline
          className="w-[300px]"
          onClick={(e) => e.stopPropagation()}
          align="start"
        >
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Search icons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="h-[300px] overflow-x-hidden overflow-y-auto">
              <div className="grid grid-cols-7 gap-1">
                {filteredIcons?.map((icon) => (
                  <Button
                    key={`${icon.prefix}-${icon.iconName}`}
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => handleSelectIcon(icon.iconName, icon.prefix)}
                    title={`${icon.prefix} ${icon.iconName}`}
                  >
                    <FontAwesomeIcon
                      icon={[icon.prefix, icon.iconName]}
                      className="h-4 w-4"
                    />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContentInline>
      </Popover>
    </div>
  )
}

export default FAIconPicker
