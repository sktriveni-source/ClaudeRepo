import { useEffect, useState } from "react";

interface Props {
  expiresAt: number;
  onExpire?: () => void;
}

export default function BookingTimer({ expiresAt, onExpire }: Props) {
  const [remainingMs, setRemainingMs] = useState(expiresAt - Date.now());

  useEffect(() => {
    const tick = () => {
      const rem = expiresAt - Date.now();
      setRemainingMs(rem);
      if (rem <= 0) {
        onExpire?.();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const clamped = Math.max(0, remainingMs);
  const totalSeconds = Math.floor(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const isDanger = totalSeconds <= 60;

  return (
    <div className={`timer-banner ${isDanger ? "danger" : ""}`}>
      <span>
        {clamped > 0
          ? "Your seats are held. Complete payment before the timer runs out:"
          : "Your seat hold has expired."}
      </span>
      <span className="timer-clock">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
