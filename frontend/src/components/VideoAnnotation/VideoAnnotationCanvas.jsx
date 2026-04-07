import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { useSocket } from "../../contexts/SocketContext";

/**
 * Canvas d'annotation superposé sur la vidéo.
 * Gère le dessin local + la synchronisation socket.
 */
const VideoAnnotationCanvas = forwardRef(function VideoAnnotationCanvas(
    { roomId, canDraw = false, tool = "pen", color = "#ff0000", lineWidth = 3, active = false },
    ref
) {
    const socket = useSocket();
    const canvasRef = useRef(null);
    const isDrawingRef = useRef(false);
    const currentPointsRef = useRef([]);
    const strokesRef = useRef([]);
    const remoteDrawingRef = useRef(new Map());
    const [, forceRender] = useState(0);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        clearCanvas() {
            strokesRef.current = [];
            remoteDrawingRef.current.clear();
            redraw();
        },
        undoLast() {
            socket.emit('annotation:undo', { roomId });
        },
        getCanvas() {
            return canvasRef.current;
        },
    }));

    // Resize canvas to match container
    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;

        const rect = parent.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        redraw();
    }, []);

    useEffect(() => {
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        const observer = new ResizeObserver(resizeCanvas);
        if (canvasRef.current?.parentElement) {
            observer.observe(canvasRef.current.parentElement);
        }
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            observer.disconnect();
        };
    }, [resizeCanvas]);

    // Draw a stroke on canvas context
    const drawStroke = useCallback((ctx, stroke, canvasW, canvasH) => {
        if (!stroke.points || stroke.points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = stroke.tool === 'eraser' ? 'rgba(0,0,0,1)' : stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (stroke.tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
        } else if (stroke.tool === 'highlighter') {
            ctx.globalAlpha = 0.4;
        }

        const points = stroke.points;
        // Convert normalized coords to canvas coords
        ctx.moveTo(points[0].x * canvasW, points[0].y * canvasH);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x * canvasW, points[i].y * canvasH);
        }
        ctx.stroke();

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
    }, []);

    // Redraw all strokes
    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        for (const stroke of strokesRef.current) {
            drawStroke(ctx, stroke, w, h);
        }

        // Draw remote in-progress strokes
        for (const [, remoteStroke] of remoteDrawingRef.current) {
            drawStroke(ctx, remoteStroke, w, h);
        }
    }, [drawStroke]);

    // Socket listeners
    useEffect(() => {
        socket.emit('annotation:join', roomId);

        const handleState = (data) => {
            strokesRef.current = data.strokes || [];
            redraw();
        };

        const handleStroke = ({ stroke }) => {
            strokesRef.current.push(stroke);
            remoteDrawingRef.current.delete(stroke.userId);
            redraw();
        };

        const handleDrawing = ({ userId, points, color, width, tool }) => {
            remoteDrawingRef.current.set(userId, { points, color, width, tool });
            redraw();
        };

        const handleClear = () => {
            strokesRef.current = [];
            remoteDrawingRef.current.clear();
            redraw();
        };

        socket.on('annotation:state', handleState);
        socket.on('annotation:stroke', handleStroke);
        socket.on('annotation:drawing', handleDrawing);
        socket.on('annotation:clear', handleClear);

        return () => {
            socket.off('annotation:state', handleState);
            socket.off('annotation:stroke', handleStroke);
            socket.off('annotation:drawing', handleDrawing);
            socket.off('annotation:clear', handleClear);
        };
    }, [socket, roomId, redraw]);

    // Normalize point to [0,1] range
    const normalizePoint = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        return {
            x: (clientX - rect.left) / rect.width,
            y: (clientY - rect.top) / rect.height,
        };
    }, []);

    const handlePointerDown = useCallback((e) => {
        if (!canDraw || !active) return;
        e.preventDefault();
        isDrawingRef.current = true;
        const pt = normalizePoint(e);
        if (pt) currentPointsRef.current = [pt];
    }, [canDraw, active, normalizePoint]);

    const handlePointerMove = useCallback((e) => {
        if (!isDrawingRef.current || !canDraw || !active) return;
        e.preventDefault();
        const pt = normalizePoint(e);
        if (!pt) return;
        currentPointsRef.current.push(pt);

        // Draw locally in real-time
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const points = currentPointsRef.current;
        const w = canvas.width;
        const h = canvas.height;

        if (points.length >= 2) {
            ctx.beginPath();
            ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : color;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (tool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
            } else if (tool === 'highlighter') {
                ctx.globalAlpha = 0.4;
            }

            const prev = points[points.length - 2];
            const curr = points[points.length - 1];
            ctx.moveTo(prev.x * w, prev.y * h);
            ctx.lineTo(curr.x * w, curr.y * h);
            ctx.stroke();

            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
        }

        // Broadcast drawing in progress (throttled via socket)
        socket.emit('annotation:drawing', {
            roomId,
            points: currentPointsRef.current,
            color,
            width: lineWidth,
            tool,
        });
    }, [canDraw, active, normalizePoint, color, lineWidth, tool, socket, roomId]);

    const handlePointerUp = useCallback((e) => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;

        if (currentPointsRef.current.length >= 2) {
            const stroke = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                points: currentPointsRef.current,
                color,
                width: lineWidth,
                tool,
            };

            strokesRef.current.push(stroke);
            socket.emit('annotation:stroke', { roomId, stroke });
            redraw();
        }

        currentPointsRef.current = [];
    }, [color, lineWidth, tool, socket, roomId, redraw]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-30"
            style={{
                cursor: canDraw && active ? 'crosshair' : 'default',
                pointerEvents: active ? 'auto' : 'none',
                touchAction: 'none',
            }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
        />
    );
});

export default VideoAnnotationCanvas;
