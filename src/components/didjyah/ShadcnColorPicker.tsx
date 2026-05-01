import React, { useState, useMemo, useEffect } from "react"
import {
  HexColorPicker,
  RgbaColorPicker,
  HslaColorPicker,
} from "react-colorful"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PopoverContentInline from "./PopoverContentInline"

interface ColorPickerProps {
  onSelectColor: (color: string) => void
  selectedColor?: string
}

function hexToRgba(hex: string | undefined) {
  if (!hex) return { r: 0, g: 0, b: 0, a: 1 }
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { r: 0, g: 0, b: 0, a: 1 }
  if (!result[1] || !result[2] || !result[3])
    return { r: 0, g: 0, b: 0, a: 1 }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: 1,
  }
}

function rgbaToHex({ r, g, b }: { r: number; g: number; b: number }) {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")
}

function rgbaToHsla({
  r,
  g,
  b,
  a,
}: {
  r: number
  g: number
  b: number
  a: number
}) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn),
    min = Math.min(rn, gn, bn)
  let h = 0,
    s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0)
        break
      case gn:
        h = (bn - rn) / d + 2
        break
      case bn:
        h = (rn - gn) / d + 4
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    a,
  }
}

function hslaToRgba({
  h,
  s,
  l,
  a,
}: {
  h: number
  s: number
  l: number
  a: number
}) {
  const sn = s / 100
  const ln = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const f = (n: number) =>
    ln -
    sn *
      Math.min(ln, 1 - ln) *
      Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return {
    r: Math.round(255 * f(0)),
    g: Math.round(255 * f(8)),
    b: Math.round(255 * f(4)),
    a,
  }
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  onSelectColor,
  selectedColor = "#000000",
}) => {
  const [open, setOpen] = useState(false)
  const [currentColor, setCurrentColor] = useState(selectedColor)

  useEffect(() => {
    // Sync local picker when the bound form value changes externally.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prop → state sync
    setCurrentColor(selectedColor)
  }, [selectedColor])

  const rgba = useMemo(() => hexToRgba(currentColor), [currentColor])
  const hsla = useMemo(() => rgbaToHsla(rgba), [rgba])

  const handleColorChange = (newColor: string) => {
    setCurrentColor(newColor)
  }

  const handleRgbaChange = (newRgba: {
    r: number
    g: number
    b: number
    a: number
  }) => {
    setCurrentColor(rgbaToHex(newRgba))
  }

  const handleHslaChange = (newHsla: {
    h: number
    s: number
    l: number
    a: number
  }) => {
    const rgbaColor = hslaToRgba(newHsla)
    setCurrentColor(rgbaToHex(rgbaColor))
  }

  const handlePopoverOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      onSelectColor(currentColor)
    }
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Popover open={open} onOpenChange={handlePopoverOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-52 justify-between">
            <div
              className="mr-2 h-4 w-4 rounded-full border border-gray-300"
              style={{ backgroundColor: currentColor }}
            />
            {currentColor}
          </Button>
        </PopoverTrigger>
        <PopoverContentInline
          className="w-[300px]"
          align="start"
          onClick={(e) => e.stopPropagation()}
        >
          <Tabs defaultValue="hex">
            <TabsList className="bg-secondary text-foreground grid w-full grid-cols-3">
              <TabsTrigger value="hex">Hex</TabsTrigger>
              <TabsTrigger value="rgba">RGBA</TabsTrigger>
              <TabsTrigger value="hsla">HSLA</TabsTrigger>
            </TabsList>
            <TabsContent value="hex" className="mt-4">
              <HexColorPicker
                color={currentColor}
                onChange={handleColorChange}
              />
              <Input
                type="text"
                value={currentColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="mt-2"
              />
            </TabsContent>
            <TabsContent value="rgba" className="mt-4">
              <RgbaColorPicker color={rgba} onChange={handleRgbaChange} />
              <div className="mt-2 grid grid-cols-4 gap-2">
                {["r", "g", "b"].map((channel) => (
                  <Input
                    key={channel}
                    type="number"
                    min="0"
                    max="255"
                    value={rgba[channel as keyof typeof rgba]}
                    onChange={(e) =>
                      handleRgbaChange({
                        ...rgba,
                        [channel]: parseInt(e.target.value, 10),
                      })
                    }
                  />
                ))}
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={rgba.a}
                  onChange={(e) =>
                    handleRgbaChange({ ...rgba, a: parseFloat(e.target.value) })
                  }
                />
              </div>
            </TabsContent>
            <TabsContent value="hsla" className="mt-4">
              <HslaColorPicker color={hsla} onChange={handleHslaChange} />
              <div className="mt-2 grid grid-cols-4 gap-2">
                <Input
                  type="number"
                  min="0"
                  max="360"
                  value={hsla.h}
                  onChange={(e) =>
                    handleHslaChange({ ...hsla, h: parseInt(e.target.value, 10) })
                  }
                />
                {["s", "l"].map((channel) => (
                  <Input
                    key={channel}
                    type="number"
                    min="0"
                    max="100"
                    value={hsla[channel as keyof typeof hsla]}
                    onChange={(e) =>
                      handleHslaChange({
                        ...hsla,
                        [channel]: parseInt(e.target.value, 10),
                      })
                    }
                  />
                ))}
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={hsla.a}
                  onChange={(e) =>
                    handleHslaChange({ ...hsla, a: parseFloat(e.target.value) })
                  }
                />
              </div>
            </TabsContent>
          </Tabs>
        </PopoverContentInline>
      </Popover>
    </div>
  )
}

export default ColorPicker
