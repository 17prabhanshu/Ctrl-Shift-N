import { useEffect, useRef, useCallback } from 'react';

export function CursorGlow() {
  const mainRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -300, y: -300 });
  const trailPos = useRef({ x: -300, y: -300 });
  const hovering = useRef(false);
  const visible = useRef(false);
  const rafId = useRef<number>(0);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const animate = useCallback(() => {
    const { x, y } = pos.current;

    // Trail lerps slowly for depth
    trailPos.current.x = lerp(trailPos.current.x, x, 0.06);
    trailPos.current.y = lerp(trailPos.current.y, y, 0.06);

    // Main glow — direct position (zero latency)
    if (mainRef.current) {
      mainRef.current.style.transform = `translate3d(${x - 150}px, ${y - 150}px, 0)`;
    }

    // Dot — direct position (zero latency)
    if (dotRef.current) {
      dotRef.current.style.transform = `translate3d(${x - 6}px, ${y - 6}px, 0)`;
    }

    // Trail — slow follow for depth
    if (trailRef.current) {
      trailRef.current.style.transform = `translate3d(${trailPos.current.x - 250}px, ${trailPos.current.y - 250}px, 0)`;
    }

    // Ring
    if (ringRef.current) {
      ringRef.current.style.transform = `translate3d(${x - 28}px, ${y - 28}px, 0)`;
    }

    rafId.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (!visible.current) {
        visible.current = true;
        [mainRef, dotRef, trailRef, ringRef].forEach(ref => {
          if (ref.current) ref.current.style.opacity = '1';
        });
      }
    };

    const onEnter = () => {
      hovering.current = true;
      if (mainRef.current) {
        mainRef.current.style.width = '80px';
        mainRef.current.style.height = '80px';
        mainRef.current.style.background = 'radial-gradient(circle, rgba(47,129,247,0.35) 0%, rgba(163,113,247,0.18) 50%, transparent 70%)';
      }
      if (dotRef.current) {
        dotRef.current.style.width = '12px';
        dotRef.current.style.height = '12px';
        dotRef.current.style.boxShadow = '0 0 24px rgba(47,129,247,0.7), 0 0 48px rgba(163,113,247,0.4)';
      }
      if (ringRef.current) {
        ringRef.current.style.width = '56px';
        ringRef.current.style.height = '56px';
        ringRef.current.style.opacity = '1';
        ringRef.current.style.borderColor = 'rgba(47,129,247,0.5)';
      }
    };

    const onLeave = () => {
      hovering.current = false;
      if (mainRef.current) {
        mainRef.current.style.width = '300px';
        mainRef.current.style.height = '300px';
        mainRef.current.style.background = 'radial-gradient(circle, rgba(47,129,247,0.14) 0%, rgba(163,113,247,0.08) 35%, rgba(247,120,186,0.04) 60%, transparent 70%)';
      }
      if (dotRef.current) {
        dotRef.current.style.width = '12px';
        dotRef.current.style.height = '12px';
        dotRef.current.style.boxShadow = '0 0 12px rgba(47,129,247,0.5), 0 0 24px rgba(163,113,247,0.2)';
      }
      if (ringRef.current) {
        ringRef.current.style.opacity = '0';
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });

    const selectors = 'a, button, input, textarea, [role="button"], .glass-card, .btn-primary, .badge';
    const bind = () => {
      document.querySelectorAll(selectors).forEach((el) => {
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
      });
    };
    bind();
    const obs = new MutationObserver(bind);
    obs.observe(document.body, { childList: true, subtree: true });

    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId.current);
      obs.disconnect();
    };
  }, [animate]);

  const baseStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0,
    pointerEvents: 'none',
    borderRadius: '50%',
    opacity: 0,
    willChange: 'transform',
  };

  return (
    <>
      {/* Layer 1: Large ambient trail */}
      <div
        ref={trailRef}
        style={{
          ...baseStyle,
          zIndex: 9997,
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(47,129,247,0.1) 0%, rgba(163,113,247,0.06) 30%, rgba(247,120,186,0.03) 50%, transparent 70%)',
          filter: 'blur(50px)',
          transition: 'opacity 0.5s ease',
        }}
      />

      {/* Layer 2: Main glow orb */}
      <div
        ref={mainRef}
        style={{
          ...baseStyle,
          zIndex: 9998,
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(47,129,247,0.14) 0%, rgba(163,113,247,0.08) 35%, rgba(247,120,186,0.04) 60%, transparent 70%)',
          filter: 'blur(25px)',
          transition: 'width 0.3s ease, height 0.3s ease, background 0.3s ease, opacity 0.5s ease',
        }}
      />

      {/* Layer 3: Bright center dot */}
      <div
        ref={dotRef}
        style={{
          ...baseStyle,
          zIndex: 10000,
          width: 12, height: 12,
          background: 'radial-gradient(circle, rgba(47,129,247,0.9) 0%, rgba(163,113,247,0.6) 60%, transparent 100%)',
          boxShadow: '0 0 12px rgba(47,129,247,0.5), 0 0 24px rgba(163,113,247,0.2)',
          transition: 'width 0.2s ease, height 0.2s ease, box-shadow 0.3s ease, opacity 0.5s ease',
        }}
      />

      {/* Layer 4: Interactive ring */}
      <div
        ref={ringRef}
        style={{
          ...baseStyle,
          zIndex: 9999,
          width: 56, height: 56,
          border: '1.5px solid rgba(47,129,247,0.4)',
          opacity: 0,
          transition: 'width 0.25s ease, height 0.25s ease, opacity 0.2s ease, border-color 0.3s ease',
        }}
      />
    </>
  );
}
