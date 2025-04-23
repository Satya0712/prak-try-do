
import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { Button } from "@/components/ui/button";
import { Brush, Pencil, Eraser, Trash2, Type, Download, Check } from 'lucide-react';

interface DrawingCanvasProps {
  isDrawing: boolean;
  onDrawingChange?: (data: string) => void;
  width?: number;
  height?: number;
}

export const DrawingCanvas = ({
  isDrawing = false,
  onDrawingChange,
  width = 800,
  height = 500
}: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<'pencil' | 'brush' | 'eraser' | 'text'>('pencil');
  const [activeColor, setActiveColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  
  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
      width,
      height,
      backgroundColor: '#ffffff'
    });
    
    setFabricCanvas(canvas);
    
    return () => {
      canvas.dispose();
    };
  }, [width, height]);
  
  // Handle drawing setting changes
  useEffect(() => {
    if (!fabricCanvas) return;
    
    // Only allow drawing if it's this player's turn
    fabricCanvas.isDrawingMode = isDrawing;
    
    if (!isDrawing) {
      // Make it so spectators can't modify the canvas
      fabricCanvas.selection = false;
      fabricCanvas.hoverCursor = 'default';
      return;
    }
    
    // Configure the brush based on active tool
    if (activeTool === 'pencil') {
      fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
      fabricCanvas.freeDrawingBrush.width = brushSize;
      fabricCanvas.freeDrawingBrush.color = activeColor;
    } else if (activeTool === 'brush') {
      fabricCanvas.freeDrawingBrush = new fabric.CircleBrush(fabricCanvas);
      fabricCanvas.freeDrawingBrush.width = brushSize * 2;
      fabricCanvas.freeDrawingBrush.color = activeColor;
    } else if (activeTool === 'eraser') {
      // Simulate eraser by drawing white lines
      fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
      fabricCanvas.freeDrawingBrush.width = brushSize * 2;
      fabricCanvas.freeDrawingBrush.color = '#FFFFFF';
    }
    
    // Send drawing data when changes happen
    fabricCanvas.on('path:created', () => {
      if (onDrawingChange && fabricCanvas) {
        onDrawingChange(JSON.stringify(fabricCanvas.toJSON()));
      }
    });
    
  }, [fabricCanvas, isDrawing, activeTool, activeColor, brushSize, onDrawingChange]);
  
  const clearCanvas = () => {
    if (fabricCanvas) {
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = '#FFFFFF';
      fabricCanvas.renderAll();
      
      if (onDrawingChange) {
        onDrawingChange(JSON.stringify(fabricCanvas.toJSON()));
      }
    }
  };
  
  const addText = () => {
    if (fabricCanvas && isDrawing) {
      const text = new fabric.IText('Type here', {
        left: 100,
        top: 100,
        fontFamily: 'Arial',
        fill: activeColor,
        fontSize: brushSize * 4
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      
      if (onDrawingChange) {
        onDrawingChange(JSON.stringify(fabricCanvas.toJSON()));
      }
    }
  };
  
  const downloadCanvas = () => {
    if (fabricCanvas) {
      const dataURL = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1
      });
      
      const link = document.createElement('a');
      link.download = 'drawing.png';
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  // Color palette
  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#008000', '#800000', '#808080'
  ];

  return (
    <div className="flex flex-col gap-4">
      {isDrawing && (
        <div className="flex justify-between items-center mb-2">
          <div className="flex gap-2">
            <Button 
              variant={activeTool === 'pencil' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setActiveTool('pencil')}
              title="Pencil"
            >
              <Pencil size={20} />
            </Button>
            <Button 
              variant={activeTool === 'brush' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setActiveTool('brush')}
              title="Brush"
            >
              <Brush size={20} />
            </Button>
            <Button 
              variant={activeTool === 'eraser' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setActiveTool('eraser')}
              title="Eraser"
            >
              <Eraser size={20} />
            </Button>
            <Button 
              variant="outline"
              size="icon"
              onClick={addText}
              title="Add Text"
            >
              <Type size={20} />
            </Button>
            <Button 
              variant="outline"
              size="icon"
              onClick={clearCanvas}
              title="Clear Canvas"
            >
              <Trash2 size={20} />
            </Button>
            <Button 
              variant="outline"
              size="icon"
              onClick={downloadCanvas}
              title="Download Drawing"
            >
              <Download size={20} />
            </Button>
          </div>
          
          <div className="flex gap-2 items-center">
            <span className="text-sm">Size:</span>
            <input 
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24"
            />
          </div>
        </div>
      )}
      
      {isDrawing && (
        <div className="flex gap-2 mb-4">
          {colors.map(color => (
            <button
              key={color}
              className={`w-8 h-8 rounded-full border ${activeColor === color ? 'ring-2 ring-game-primary ring-offset-2' : 'border-gray-300'}`}
              style={{ backgroundColor: color }}
              onClick={() => setActiveColor(color)}
              title={color}
            />
          ))}
        </div>
      )}
      
      <div className="drawing-canvas">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};
