"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Undo2, Redo2, Palette, Download, Trash2 } from "lucide-react"

const GRID_SIZE = 32
const COLORS = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
  "#FFC0CB",
  "#A52A2A",
  "#808080",
  "#C0C0C0",
  "#800000",
  "#008000",
]

type Pixel = {
  color: string
}

type CanvasState = Pixel[][]

export default function PixelCanvas() {
  const [canvas, setCanvas] = useState<CanvasState>(() =>
    Array(GRID_SIZE)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE)
          .fill(null)
          .map(() => ({ color: "#FFFFFF" })),
      ),
  )
  const [selectedColor, setSelectedColor] = useState("#000000")
  const [isDrawing, setIsDrawing] = useState(false)
  const [history, setHistory] = useState<CanvasState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg">("png")
  const [exportScale, setExportScale] = useState(10)

  // Initialize history with the initial canvas state
  useEffect(() => {
    setHistory([canvas])
    setHistoryIndex(0)
  }, [])

  const saveToHistory = useCallback(
    (newCanvas: CanvasState) => {
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(JSON.parse(JSON.stringify(newCanvas)))
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    },
    [history, historyIndex],
  )

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setCanvas(JSON.parse(JSON.stringify(history[newIndex])))
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setCanvas(JSON.parse(JSON.stringify(history[newIndex])))
    }
  }, [history, historyIndex])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault()
          undo()
        } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
          e.preventDefault()
          redo()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [undo, redo])

  const drawPixel = (row: number, col: number) => {
    const newCanvas = canvas.map((r, rowIndex) =>
      r.map((pixel, colIndex) => (rowIndex === row && colIndex === col ? { color: selectedColor } : pixel)),
    )
    setCanvas(newCanvas)
    saveToHistory(newCanvas)
  }

  const handleMouseDown = (row: number, col: number) => {
    setIsDrawing(true)
    drawPixel(row, col)
  }

  const handleMouseEnter = (row: number, col: number) => {
    if (isDrawing) {
      drawPixel(row, col)
    }
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const newCanvas = Array(GRID_SIZE)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE)
          .fill(null)
          .map(() => ({ color: "#FFFFFF" })),
      )
    setCanvas(newCanvas)
    saveToHistory(newCanvas)
  }

  const downloadImage = (format: "png" | "jpeg" = "png", scale = 10) => {
    const canvas_element = document.createElement("canvas")
    const ctx = canvas_element.getContext("2d")
    if (!ctx) return

    const pixelSize = scale
    canvas_element.width = GRID_SIZE * pixelSize
    canvas_element.height = GRID_SIZE * pixelSize

    // Set white background for JPEG (since JPEG doesn't support transparency)
    if (format === "jpeg") {
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, canvas_element.width, canvas_element.height)
    }

    canvas.forEach((row, rowIndex) => {
      row.forEach((pixel, colIndex) => {
        ctx.fillStyle = pixel.color
        ctx.fillRect(colIndex * pixelSize, rowIndex * pixelSize, pixelSize, pixelSize)
      })
    })

    const mimeType = format === "png" ? "image/png" : "image/jpeg"
    const quality = format === "jpeg" ? 0.9 : undefined

    const link = document.createElement("a")
    link.download = `pixel-art.${format}`
    link.href = canvas_element.toDataURL(mimeType, quality)
    link.click()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Pixel Canvas Art Maker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Canvas */}
              <div className="flex-1">
                <div
                  className="inline-block border-2 border-gray-300 bg-white"
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <div
                    className="grid gap-0"
                    style={{
                      gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                      width: "512px",
                      height: "512px",
                    }}
                  >
                    {canvas.map((row, rowIndex) =>
                      row.map((pixel, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className="border border-gray-200 cursor-crosshair hover:opacity-80 transition-opacity"
                          style={{
                            backgroundColor: pixel.color,
                            width: "16px",
                            height: "16px",
                          }}
                          onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                          onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                        />
                      )),
                    )}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="w-full lg:w-80 space-y-6">
                {/* Action Buttons */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button onClick={undo} disabled={historyIndex <= 0} variant="outline" size="sm" className="flex-1">
                      <Undo2 className="w-4 h-4 mr-2" />
                      Undo (Ctrl+Z)
                    </Button>
                    <Button
                      onClick={redo}
                      disabled={historyIndex >= history.length - 1}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Redo2 className="w-4 h-4 mr-2" />
                      Redo (Ctrl+Y)
                    </Button>
                  </div>

                  <Button onClick={clearCanvas} variant="outline" size="sm" className="w-full">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Canvas
                  </Button>
                </div>

                {/* Export Options */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    <span className="font-medium">Export Options</span>
                  </div>

                  {/* Format Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Format</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExportFormat("png")}
                        className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${
                          exportFormat === "png"
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        PNG
                        <span className="block text-xs opacity-75">Transparent</span>
                      </button>
                      <button
                        onClick={() => setExportFormat("jpeg")}
                        className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${
                          exportFormat === "jpeg"
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        JPG
                        <span className="block text-xs opacity-75">Smaller size</span>
                      </button>
                    </div>
                  </div>

                  {/* Scale Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Image Size: {GRID_SIZE * exportScale}x{GRID_SIZE * exportScale}px
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="5"
                        max="20"
                        value={exportScale}
                        onChange={(e) => setExportScale(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Small (160px)</span>
                        <span>Medium (320px)</span>
                        <span>Large (640px)</span>
                      </div>
                    </div>
                  </div>

                  {/* Export Button */}
                  <Button
                    onClick={() => downloadImage(exportFormat, exportScale)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export as {exportFormat.toUpperCase()}
                  </Button>
                </div>

                {/* Gradient Color Selector */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    <span className="font-medium">Color Selector</span>
                  </div>

                  {/* Selected Color Display */}
                  <div
                    className="w-full h-16 border-2 border-gray-300 rounded-md shadow-inner"
                    style={{ backgroundColor: selectedColor }}
                  />

                  {/* Hue Gradient Slider */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Hue</label>
                    <div className="relative h-8 rounded-md overflow-hidden border border-gray-300">
                      <div
                        className="w-full h-full"
                        style={{
                          background:
                            "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
                        }}
                      />
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={(() => {
                          // Convert hex to HSL to get hue value
                          const hex = selectedColor.replace("#", "")
                          const r = Number.parseInt(hex.substr(0, 2), 16) / 255
                          const g = Number.parseInt(hex.substr(2, 2), 16) / 255
                          const b = Number.parseInt(hex.substr(4, 2), 16) / 255
                          const max = Math.max(r, g, b)
                          const min = Math.min(r, g, b)
                          const diff = max - min
                          let h = 0
                          if (diff !== 0) {
                            if (max === r) h = ((g - b) / diff) % 6
                            else if (max === g) h = (b - r) / diff + 2
                            else h = (r - g) / diff + 4
                          }
                          return Math.round(h * 60)
                        })()}
                        onChange={(e) => {
                          const hue = Number.parseInt(e.target.value)
                          // Convert HSL to hex (assuming full saturation and 50% lightness)
                          const c = 1 // chroma
                          const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
                          const m = 0.5 - c / 2
                          let r = 0,
                            g = 0,
                            b = 0

                          if (hue >= 0 && hue < 60) {
                            r = c
                            g = x
                            b = 0
                          } else if (hue >= 60 && hue < 120) {
                            r = x
                            g = c
                            b = 0
                          } else if (hue >= 120 && hue < 180) {
                            r = 0
                            g = c
                            b = x
                          } else if (hue >= 180 && hue < 240) {
                            r = 0
                            g = x
                            b = c
                          } else if (hue >= 240 && hue < 300) {
                            r = x
                            g = 0
                            b = c
                          } else if (hue >= 300 && hue < 360) {
                            r = c
                            g = 0
                            b = x
                          }

                          r = Math.round((r + m) * 255)
                          g = Math.round((g + m) * 255)
                          b = Math.round((b + m) * 255)

                          const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
                          setSelectedColor(hex)
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Brightness/Saturation Gradient */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Brightness</label>
                    <div className="relative h-8 rounded-md overflow-hidden border border-gray-300">
                      <div
                        className="w-full h-full"
                        style={{
                          background: `linear-gradient(to right, #000000 0%, ${selectedColor} 50%, #ffffff 100%)`,
                        }}
                      />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        defaultValue="50"
                        onChange={(e) => {
                          const brightness = Number.parseInt(e.target.value)
                          const hex = selectedColor.replace("#", "")
                          const r = Number.parseInt(hex.substr(0, 2), 16)
                          const g = Number.parseInt(hex.substr(2, 2), 16)
                          const b = Number.parseInt(hex.substr(4, 2), 16)

                          let newR, newG, newB
                          if (brightness < 50) {
                            // Darken
                            const factor = brightness / 50
                            newR = Math.round(r * factor)
                            newG = Math.round(g * factor)
                            newB = Math.round(b * factor)
                          } else {
                            // Lighten
                            const factor = (brightness - 50) / 50
                            newR = Math.round(r + (255 - r) * factor)
                            newG = Math.round(g + (255 - g) * factor)
                            newB = Math.round(b + (255 - b) * factor)
                          }

                          const newHex = `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`
                          setSelectedColor(newHex)
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Quick Color Presets */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Quick Colors</label>
                    <div className="grid grid-cols-8 gap-1">
                      {["#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"].map(
                        (color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                              selectedColor === color ? "border-blue-500 ring-1 ring-blue-200" : "border-gray-300"
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setSelectedColor(color)}
                            title={color}
                          />
                        ),
                      )}
                    </div>
                  </div>

                  {/* Hex Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Hex Color</label>
                    <input
                      type="text"
                      value={selectedColor}
                      onChange={(e) => {
                        const value = e.target.value
                        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                          setSelectedColor(value)
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-sm text-gray-600 space-y-2">
                  <h3 className="font-medium">How to use:</h3>
                  <ul className="space-y-1">
                    <li>• Click and drag to draw pixels</li>
                    <li>• Use Ctrl+Z to undo</li>
                    <li>• Use Ctrl+Y to redo</li>
                    <li>• Adjust hue and brightness sliders</li>
                    <li>• Use quick colors or enter hex values</li>
                    <li>• Download your artwork as PNG</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
