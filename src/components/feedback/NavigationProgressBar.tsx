import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function NavigationProgressBar() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [completing, setCompleting] = useState(false);
  const prevPathRef = useRef(location.pathname + location.search);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const current = location.pathname + location.search;
    if (current === prevPathRef.current) return;
    prevPathRef.current = current;

    if (timerRef.current) clearTimeout(timerRef.current);

    setCompleting(false);
    setVisible(true);

    // Brief fill then complete
    timerRef.current = setTimeout(() => {
      setCompleting(true);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setCompleting(false);
      }, 360);
    }, 80);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [location]);

  if (!visible) return null;

  return <div className={`npb${completing ? ' npb--complete' : ''}`} aria-hidden />;
}
