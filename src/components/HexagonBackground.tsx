import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import './HexagonBackground.css';

interface HexagonBackgroundProps {
    idleTimeoutMs?: number;
}

// Pointy-top hexagon (like real honeycomb cells)
function hexPath(cx: number, cy: number, r: number): string {
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6; // pointy-top offset
        pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return `M${pts.join('L')}Z`;
}

type HexType = 'gold' | 'gray' | 'dark';

type HexCell = {
    cx: number;
    cy: number;
    r: number;
    type: HexType;
    maxOpacity: number;
    dist: number;
    seed: number;
    ring: number; // concentric ring from bottom-right anchor
};

function buildHoneycomb(seed: number): HexCell[] {
    let s = seed;
    const rand = () => { s = (s * 16807) % 2147483647; return (s & 0x7fffffff) / 0x7fffffff; };

    const W = 1920;
    const H = 1080;
    const R = 28;
    const GAP = 4; // gap between cells for organic favo look
    const effectiveR = R + GAP / 2;

    // Pointy-top: h-spacing = sqrt(3) * r, v-spacing = 1.5 * r
    const hStep = Math.sqrt(3) * effectiveR;
    const vStep = 1.5 * effectiveR;

    const cols = Math.ceil(W / hStep) + 3;
    const rows = Math.ceil(H / vStep) + 3;

    // Anchor point (bottom-right)
    const anchorX = W + 40;
    const anchorY = H + 40;

    const maxDist = Math.sqrt(W * W + H * H);

    const types: HexType[] = ['gold', 'gray', 'dark'];
    const weights = [0.30, 0.18, 0.52];

    function pickType(): HexType {
        const v = rand();
        let acc = 0;
        for (let i = 0; i < types.length; i++) {
            acc += weights[i];
            if (v < acc) return types[i];
        }
        return 'dark';
    }

    const cells: HexCell[] = [];

    for (let row = 0; row < rows; row++) {
        const yy = row * vStep;
        const xOffset = (row % 2) * (hStep * 0.5);
        for (let col = 0; col < cols; col++) {
            const xx = col * hStep + xOffset;

            // Distance from anchor
            const dx = anchorX - xx;
            const dy = anchorY - yy;
            const rawDist = Math.sqrt(dx * dx + dy * dy);
            const dist = rawDist / maxDist;

            // Organic boundary: use noise-like variation
            const angleFromAnchor = Math.atan2(dy, dx);
            const wobble = 0.06 * Math.sin(angleFromAnchor * 5 + row * 0.3) +
                           0.04 * Math.cos(angleFromAnchor * 3.7 + col * 0.5);

            // Ring = how many "layers" from anchor
            const ring = Math.floor(rawDist / (effectiveR * 2));

            // Opacity: richer near anchor, fading out
            const baseOp = Math.max(0.15, 1 - dist * 1.6 + wobble);
            const maxOpacity = Math.min(1, baseOp * (0.75 + rand() * 0.25));

            const type = pickType();
            const cellSeed = rand();

            cells.push({
                cx: xx, cy: yy, r: R,
                type, maxOpacity, dist, seed: cellSeed, ring,
            });
        }
    }

    return cells;
}

export default function HexagonBackground({ idleTimeoutMs = 10000 }: HexagonBackgroundProps) {
    const [isIdle, setIsIdle] = useState(false);
    const [visibleSet, setVisibleSet] = useState<Set<number>>(new Set());
    const [fadedSet, setFadedSet] = useState<Set<number>>(new Set());
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const breathRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const colorRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const baseVisibleRef = useRef<Set<number>>(new Set());

    const cells = useMemo(() => buildHoneycomb(42), []);

    // Sort by ring (nearest to anchor first)
    const revealOrder = useMemo(() => {
        return cells
            .map((c, i) => ({ i, ring: c.ring, seed: c.seed }))
            .sort((a, b) => a.ring - b.ring || a.seed - b.seed)
            .map(x => x.i);
    }, [cells]);

    // Base: closest ~25% of cells (fixed shape when active)
    const baseVisible = useMemo(() => {
        const set = new Set<number>();
        const count = Math.floor(revealOrder.length * 0.25);
        for (let i = 0; i < count; i++) set.add(revealOrder[i]);
        return set;
    }, [revealOrder]);

    // Frontier cells: just beyond the base, used for breathing animation
    const frontierCells = useMemo(() => {
        const baseCount = Math.floor(revealOrder.length * 0.25);
        const frontierEnd = Math.min(revealOrder.length, Math.floor(revealOrder.length * 0.55));
        return revealOrder.slice(baseCount, frontierEnd);
    }, [revealOrder]);

    const resetTimer = useCallback(() => {
        setIsIdle(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setIsIdle(true), idleTimeoutMs);
    }, [idleTimeoutMs]);

    useEffect(() => {
        resetTimer();
        const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
        let lastReset = 0;
        const handleActivity = () => {
            const now = Date.now();
            if (now - lastReset > 1000) {
                resetTimer();
                lastReset = now;
            }
        };
        events.forEach(e => window.addEventListener(e, handleActivity));
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            events.forEach(e => window.removeEventListener(e, handleActivity));
        };
    }, [resetTimer]);

    // Init base
    useEffect(() => {
        baseVisibleRef.current = baseVisible;
        setVisibleSet(new Set(baseVisible));
    }, [baseVisible]);

    // Internal cells: base visible, used for color shifting
    const internalCells = useMemo(() => {
        const baseCount = Math.floor(revealOrder.length * 0.25);
        return revealOrder.slice(0, baseCount);
    }, [revealOrder]);

    // Idle: slow growth + breathing at frontier + color shifts on internals
    // Active: snap back, clear all effects
    useEffect(() => {
        if (animRef.current) clearInterval(animRef.current);
        if (breathRef.current) clearInterval(breathRef.current);
        if (colorRef.current) clearInterval(colorRef.current);

        if (isIdle) {
            // Phase 1: slow growth outward
            let revealIdx = 0;
            while (revealIdx < revealOrder.length && baseVisibleRef.current.has(revealOrder[revealIdx])) {
                revealIdx++;
            }
            let growthDone = false;

            animRef.current = setInterval(() => {
                if (revealIdx >= revealOrder.length) {
                    growthDone = true;
                    if (animRef.current) clearInterval(animRef.current);
                    return;
                }
                setVisibleSet(prev => {
                    const next = new Set(prev);
                    next.add(revealOrder[revealIdx]);
                    revealIdx++;
                    if (Math.random() > 0.6 && revealIdx < revealOrder.length) {
                        next.add(revealOrder[revealIdx]);
                        revealIdx++;
                    }
                    return next;
                });
            }, 350);

            // Phase 2: breathing at frontier
            breathRef.current = setInterval(() => {
                if (!growthDone && revealIdx < revealOrder.length * 0.4) return;
                setVisibleSet(prev => {
                    const next = new Set(prev);
                    const count = 2 + Math.floor(Math.random() * 3);
                    for (let i = 0; i < count; i++) {
                        const idx = frontierCells[Math.floor(Math.random() * frontierCells.length)];
                        if (next.has(idx)) {
                            next.delete(idx);
                        } else {
                            next.add(idx);
                        }
                    }
                    return next;
                });
            }, 2200);

            // Phase 3: color shift — some internal cells fade fill in/out
            colorRef.current = setInterval(() => {
                setFadedSet(prev => {
                    const next = new Set(prev);
                    // Toggle 2-5 random internal cells
                    const count = 2 + Math.floor(Math.random() * 4);
                    for (let i = 0; i < count; i++) {
                        const idx = internalCells[Math.floor(Math.random() * internalCells.length)];
                        if (next.has(idx)) {
                            next.delete(idx); // restore fill
                        } else {
                            next.add(idx); // fade out fill
                        }
                    }
                    return next;
                });
            }, 3000);

        } else {
            // Snap back: reset everything instantly
            setVisibleSet(new Set(baseVisibleRef.current));
            setFadedSet(new Set());
        }

        return () => {
            if (animRef.current) clearInterval(animRef.current);
            if (breathRef.current) clearInterval(breathRef.current);
            if (colorRef.current) clearInterval(colorRef.current);
        };
    }, [isIdle, revealOrder, frontierCells, internalCells]);

    const renderHex = (cell: HexCell, i: number) => {
        const d = hexPath(cell.cx, cell.cy, cell.r);
        const isVisible = visibleSet.has(i);
        const isFaded = fadedSet.has(i);
        const opacity = isVisible ? cell.maxOpacity : 0;
        // Fill fades to 0 when shifted, border always stays
        const fillOp = isFaded ? 0 : 1;

        return (
            <path
                key={i}
                d={d}
                className="hex-cell"
                style={{ opacity, fillOpacity: fillOp }}
                fill={
                    cell.type === 'gold' ? '#c9a227' :
                    cell.type === 'gray' ? '#6b7280' :
                    '#1a1a2e'
                }
                stroke="#c9a227"
                strokeWidth="0.8"
            />
        );
    };

    return (
        <div className="hexagon-bg-container">
            <svg
                className="hexagon-svg"
                viewBox="0 0 1920 1080"
                preserveAspectRatio="xMaxYMax slice"
                xmlns="http://www.w3.org/2000/svg"
            >
                {cells.map((cell, i) => renderHex(cell, i))}
            </svg>
        </div>
    );
}
