import { useCallback, useEffect, useState } from "react";

type Params = {
  itemCount: number;
  onEnter: (index: number) => void;
  onEscape?: () => void;
};

export function useArrowListNavigation({
  itemCount,
  onEnter,
  onEscape,
}: Params) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex((prev) => {
      if (itemCount <= 0) return 0;
      return Math.min(prev, itemCount - 1);
    });
  }, [itemCount]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (itemCount <= 0) return;
        setActiveIndex((prev) => (prev + 1) % itemCount);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (itemCount <= 0) return;
        setActiveIndex((prev) => (prev - 1 + itemCount) % itemCount);
        return;
      }
      if (e.key === "Enter") {
        if (itemCount <= 0) return;
        e.preventDefault();
        onEnter(activeIndex);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onEscape?.();
      }
    },
    [activeIndex, itemCount, onEnter, onEscape],
  );

  return { activeIndex, setActiveIndex, onKeyDown };
}
