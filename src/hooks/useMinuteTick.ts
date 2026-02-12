import { useState, useEffect } from "react";

export function useMinuteTick() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Recalculate `now` on every tick so dependents re-render with fresh time
  const now = new Date();

  return { tick, now };
}
