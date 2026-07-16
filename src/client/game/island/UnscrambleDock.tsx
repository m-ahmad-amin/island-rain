import { useMemo, useRef, useState, type PointerEvent } from 'react';
import { useGame } from './GameContext';
import type { TrayLetter } from './types';

type DragState = {
  fromIndex: number;
  letter: string;
  id: string;
  x: number;
  y: number;
  insertIndex: number;
};

const SLOT_STRIDE = 54; // tile width + gap

const moveItem = <T,>(items: T[], from: number, to: number): T[] => {
  if (from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item === undefined) return items;
  next.splice(to, 0, item);
  return next;
};

export const UnscrambleDock = () => {
  const { assemblySlots, reorderAssembly } = useGame();
  const rowRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [isSliding, setIsSliding] = useState(false);
  const dragMovedRef = useRef(false);
  const originRef = useRef({ x: 0, y: 0 });

  const displaySlots: TrayLetter[] = useMemo(() => {
    if (!dragging) return assemblySlots;
    return moveItem(assemblySlots, dragging.fromIndex, dragging.insertIndex);
  }, [assemblySlots, dragging]);

  /** How many slots each letter should slide (displayIndex - sourceIndex) */
  const slideById = useMemo(() => {
    const map = new Map<string, number>();
    assemblySlots.forEach((item, sourceIndex) => {
      const displayIndex = displaySlots.findIndex((s) => s.id === item.id);
      map.set(item.id, displayIndex - sourceIndex);
    });
    return map;
  }, [assemblySlots, displaySlots]);

  const indexFromPointerX = (clientX: number): number => {
    const row = rowRef.current;
    if (!row || assemblySlots.length === 0) return 0;

    const rect = row.getBoundingClientRect();
    const contentWidth =
      assemblySlots.length * SLOT_STRIDE - (SLOT_STRIDE - 48);
    const startX = rect.left + (rect.width - contentWidth) / 2;
    const index = Math.floor((clientX - startX) / SLOT_STRIDE);
    return Math.max(0, Math.min(assemblySlots.length - 1, index));
  };

  const startDrag = (index: number, item: TrayLetter, e: PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragMovedRef.current = false;
    setIsSliding(false);
    originRef.current = { x: e.clientX, y: e.clientY };
    setDragging({
      fromIndex: index,
      letter: item.letter,
      id: item.id,
      x: e.clientX,
      y: e.clientY,
      insertIndex: index,
    });
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - originRef.current.x;
    const dy = e.clientY - originRef.current.y;
    if (Math.hypot(dx, dy) > 4) {
      dragMovedRef.current = true;
      setIsSliding(true);
    }
    setDragging({
      ...dragging,
      x: e.clientX,
      y: e.clientY,
      insertIndex: indexFromPointerX(e.clientX),
    });
  };

  const onPointerUp = () => {
    if (!dragging) return;
    if (dragMovedRef.current && dragging.fromIndex !== dragging.insertIndex) {
      reorderAssembly(dragging.fromIndex, dragging.insertIndex);
    }
    setDragging(null);
    dragMovedRef.current = false;
    setIsSliding(false);
  };

  return (
    <div
      className="unscramble-dock pointer-events-auto mx-3 mb-3"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <p className="unscramble-dock__hint-main">Unscramble the letters</p>
      <p className="unscramble-dock__hint-sub">
        Drag a letter left or right to unscramble
      </p>

      <div ref={rowRef} className="unscramble-dock__row">
        {assemblySlots.map((item, i) => {
          const slide = slideById.get(item.id) ?? 0;
          const isLifted = dragging?.id === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-slot-index={i}
              className={`unscramble-tile${isLifted ? ' unscramble-tile--lifted' : ''}${
                isSliding && !isLifted ? ' unscramble-tile--shifting' : ''
              }`}
              style={{
                transform: isLifted
                  ? undefined
                  : `translateX(${slide * SLOT_STRIDE}px)`,
              }}
              onPointerDown={(e) => startDrag(i, item, e)}
              aria-label={`Letter ${item.letter.toUpperCase()}`}
            >
              {/* Letter stays on the floating ghost while lifted */}
              {isLifted ? '' : item.letter.toUpperCase()}
            </button>
          );
        })}
      </div>

      {dragging && (
        <div
          className="unscramble-drag-ghost unscramble-drag-ghost--lifted"
          style={{ left: dragging.x, top: dragging.y }}
        >
          {dragging.letter.toUpperCase()}
        </div>
      )}
    </div>
  );
};
