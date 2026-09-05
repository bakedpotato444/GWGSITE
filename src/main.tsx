import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

const navItems = ['Events', 'About', 'Gallery', 'Coaching', 'Private Events', 'Shop'];

type PaperImpact = {
  id: number;
  retiring?: boolean;
  rotation: number;
  size: number;
  x: number;
  y: number;
};

const impactPositions = [
  { x: 34, y: 43 },
  { x: 67, y: 44 },
  { x: 33, y: 55 },
  { x: 68, y: 56 },
  { x: 40, y: 48 },
  { x: 60, y: 52 },
  { x: 47, y: 58 },
  { x: 57, y: 41 },
];

function BrandMark() {
  return (
    <a className="brand" href="#top" aria-label="Girls With Guns Australia, home">
      <strong className="brand__monogram">GWG</strong>
      <span className="brand__divider" aria-hidden="true" />
      <span className="brand__text">
        Girls With<br />Guns Australia
      </span>
    </a>
  );
}

function Navigation() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <BrandMark />
      <nav id="mobile-navigation" className={open ? 'nav nav--open' : 'nav'} aria-label="Primary navigation">
        {navItems.map((item) => (
          <a key={item} href={item === 'About' ? '#story' : '#prototype-end'} onClick={() => setOpen(false)}>
            {item}
          </a>
        ))}
        <a className="nav__mobile-cta" href="#prototype-end" onClick={() => setOpen(false)}>Book next shoot</a>
      </nav>
      <a className="header-cta" href="#prototype-end">Book next shoot <span aria-hidden="true">→</span></a>
      <button
        className="menu-button"
        type="button"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
      </button>
    </header>
  );
}

function PaperTarget() {
  const target = useRef<HTMLDivElement>(null);
  const removalTimers = useRef<Set<number>>(new Set());
  const [impacts, setImpacts] = useState<PaperImpact[]>([]);

  useEffect(() => {
    if (!target.current) return;

    const targetElement = target.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 767px)');
    let impactId = 0;
    let positionIndex = Math.floor(Math.random() * impactPositions.length);
    let timer: number | undefined;
    let targetInView = true;
    let heroAtStart = true;
    let firstImpact = true;

    const clearTimer = () => {
      if (timer === undefined) return;
      window.clearTimeout(timer);
      timer = undefined;
    };

    const canRun = () => !reducedMotion.matches && !document.hidden && targetInView && heroAtStart;
    const nextDelay = () => mobile.matches
      ? 3600 + Math.random() * 1500
      : 2600 + Math.random() * 1400;

    const addImpact = () => {
      positionIndex = (positionIndex + 1 + Math.floor(Math.random() * 3)) % impactPositions.length;
      const position = impactPositions[positionIndex];
      const maxActive = mobile.matches ? 2 : 3;
      const nextImpact: PaperImpact = {
        id: ++impactId,
        x: position.x + (Math.random() - .5) * 2.4,
        y: position.y + (Math.random() - .5) * 2.2,
        size: (mobile.matches ? 31 : 38) + Math.random() * (mobile.matches ? 8 : 12),
        rotation: -18 + Math.random() * 36,
      };

      setImpacts((current) => {
        const activeImpacts = current.filter((impact) => !impact.retiring);

        if (activeImpacts.length < maxActive) {
          return [...current, nextImpact];
        }

        const oldest = activeImpacts[0];
        const removalTimer = window.setTimeout(() => {
          setImpacts((items) => items.filter((impact) => impact.id !== oldest.id));
          removalTimers.current.delete(removalTimer);
        }, 560);
        removalTimers.current.add(removalTimer);

        return [
          ...current.map((impact) => impact.id === oldest.id ? { ...impact, retiring: true } : impact),
          nextImpact,
        ];
      });
    };

    const schedule = () => {
      if (!canRun() || timer !== undefined) return;
      timer = window.setTimeout(() => {
        timer = undefined;
        if (!canRun()) return;
        addImpact();
        firstImpact = false;
        schedule();
      }, firstImpact ? 1450 : nextDelay());
    };

    const sync = () => {
      if (canRun()) schedule();
      else clearTimer();
    };

    const observer = new IntersectionObserver(([entry]) => {
      targetInView = entry.isIntersecting;
      sync();
    }, { threshold: .12 });
    observer.observe(targetElement);

    const scrollGate = ScrollTrigger.create({
      trigger: '[data-scroll-stage]',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        heroAtStart = self.progress < .11;
        sync();
      },
    });
    heroAtStart = scrollGate.progress < .11;

    const handleVisibility = () => sync();
    const handleMotionPreference = () => {
      if (reducedMotion.matches) setImpacts([]);
      sync();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    reducedMotion.addEventListener('change', handleMotionPreference);
    sync();

    return () => {
      clearTimer();
      removalTimers.current.forEach((removalTimer) => window.clearTimeout(removalTimer));
      removalTimers.current.clear();
      observer.disconnect();
      scrollGate.kill();
      document.removeEventListener('visibilitychange', handleVisibility);
      reducedMotion.removeEventListener('change', handleMotionPreference);
    };
  }, []);

  return (
    <div ref={target} className="target-rig" data-target-rig aria-label="Worn paper target with a centred circular bullseye">
      <img
        className="physical-target"
        src="/physical-target-sheet-clean-v1.png"
        alt="A large worn paper shooting target held by a rusty steel carrier"
      />
      <div className="target-lockup" aria-hidden="true">
        <span className="target-lockup__eyeline">Girls With</span>
        <strong>Guns</strong>
        <span className="target-lockup__country"><i /> Australia <i /></span>
      </div>
      <p className="target-message" aria-hidden="true">Beginner-friendly shooting<br />experiences for women.</p>
      <div className="paper-impacts" aria-hidden="true">
        {impacts.map((impact) => (
          <span
            className={impact.retiring ? 'paper-impact paper-impact--retiring' : 'paper-impact'}
            key={impact.id}
            style={{
              '--impact-rotation': `${impact.rotation}deg`,
              left: `${impact.x}%`,
              top: `${impact.y}%`,
              width: `${impact.size}px`,
            } as CSSProperties}
          >
            <img src="/paper-impact-decal-v1-256.png" alt="" />
          </span>
        ))}
      </div>
    </div>
  );
}

function DetailIcon({ name }: { name: 'calendar' | 'clock' | 'people' }) {
  if (name === 'calendar') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2v4M18 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z" /></svg>;
  }

  if (name === 'clock') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 11a3 3 0 0 0 0-6M17 14a4 4 0 0 1 4 4v2" /></svg>;
}

function EventCard() {
  return (
    <article className="event-card overlay-card" data-hero-overlay>
      <span className="event-card__pin" aria-hidden="true" />
      <p className="event-card__eyebrow">Next shoot</p>
      <p className="event-card__location">Beaconsfield</p>
      <div className="event-card__details">
        <p><DetailIcon name="calendar" /> 13 September</p>
        <p><DetailIcon name="clock" /> 10:30 AM</p>
        <p><DetailIcon name="people" /> Limited spots</p>
      </div>
      <a href="#prototype-end" className="paper-button">
        Book your spot <span aria-hidden="true">→</span>
      </a>
    </article>
  );
}

function GalleryPreview() {
  return (
    <a className="gallery-preview overlay-card" data-hero-overlay href="#prototype-end" aria-label="View the Girls With Guns gallery">
      <div className="gallery-stack" aria-hidden="true">
        <span className="gallery-print gallery-print--back"><img src="/shooting-range-hero-backdrop.png" alt="" /></span>
        <span className="gallery-print gallery-print--mid"><img src="/shooting-range-hero-backdrop.png" alt="" /></span>
        <span className="gallery-print gallery-print--front"><img src="/shooting-range-hero-backdrop.png" alt="" /></span>
      </div>
      <div className="gallery-label">
        <p>From the Range</p>
        <span>View gallery <i aria-hidden="true">→</i></span>
      </div>
    </a>
  );
}

function StoryPanel() {
  return (
    <section className="story-panel" id="story" data-story aria-labelledby="story-heading">
      <div className="story-panel__media" data-story-media>
        <div className="media-placeholder">
          <span className="media-placeholder__index">01 / REAL GWG MEDIA</span>
          <span className="media-placeholder__play" aria-hidden="true">▶</span>
          <p>Farrah at the range</p>
          <small>Photo or short film placeholder</small>
        </div>
      </div>
      <div className="story-panel__copy">
        <p className="eyebrow eyebrow--dark"><span /> Why GWG exists</p>
        <h2 id="story-heading">
          For the women who always wanted to try<span>—</span> but never wanted to walk in alone.
        </h2>
        <p className="story-panel__body">
          Farrah kept meeting women who were curious about shooting, but felt intimidated by the environment or simply didn’t know where to start. Girls With Guns Australia grew from that gap.
        </p>
        <a className="story-cta" href="#prototype-end">
          Meet Farrah &amp; read the story
          <span aria-hidden="true">↗</span>
        </a>
      </div>
      <p className="story-panel__folio" aria-hidden="true">GWG / 02</p>
    </section>
  );
}

function App() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!root.current) return;

    const context = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const timeline = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: '[data-scroll-stage]',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.42,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .to('[data-hero-overlay]', { autoAlpha: 0, y: 18, duration: 0.18, stagger: 0.025 }, 0.04)
          .to('[data-target-rig]', { scale: 0.105, yPercent: -5, rotationX: 5, duration: 0.67, ease: 'power2.inOut' }, 0)
          .to('[data-lane]', { scale: 1, filter: 'brightness(.68) saturate(.78)', duration: 0.67 }, 0)
          .fromTo('[data-story]', { xPercent: 102 }, { xPercent: 0, duration: 0.52, ease: 'power3.inOut' }, 0.38)
          .to('[data-target-rig]', { autoAlpha: 0, duration: 0.15 }, 0.8)
          .fromTo('[data-story-media]', { xPercent: 7 }, { xPercent: 0, duration: 0.34, ease: 'power2.out' }, 0.55);
      });

      mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () => {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: '[data-scroll-stage]',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.28,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .to('[data-hero-overlay]', { autoAlpha: 0, y: 10, duration: 0.16 }, 0.02)
          .to('[data-target-rig]', { scale: 0.2, yPercent: -5, duration: 0.6, ease: 'power2.inOut' }, 0)
          .fromTo('[data-story]', { xPercent: 102 }, { xPercent: 0, duration: 0.52, ease: 'power3.inOut' }, 0.38)
          .to('[data-target-rig]', { autoAlpha: 0, duration: 0.16 }, 0.8);
      });

      return () => mm.revert();
    }, root);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh, { once: true });

    return () => {
      window.removeEventListener('load', refresh);
      context.revert();
    };
  }, []);

  return (
    <div className="app" ref={root} id="top">
      <Navigation />
      <main>
        <div className="scroll-stage" data-scroll-stage>
          <div className="scene">
            <section className="hero" aria-label="Girls With Guns Australia introduction">
              <img
                className="lane"
                data-lane
                src="/shooting-range-hero-backdrop.png"
                alt="Empty indoor shooting range lane receding into the distance"
              />
              <div className="lane-vignette" aria-hidden="true" />
              <PaperTarget />
              <EventCard />
              <GalleryPreview />
              <div className="scroll-cue" data-hero-overlay aria-hidden="true">
                <span>Scroll to enter</span>
                <i />
              </div>
            </section>
            <StoryPanel />
          </div>
        </div>
        <section className="prototype-end" id="prototype-end" aria-labelledby="prototype-end-title">
          <p className="eyebrow eyebrow--dark">Prototype boundary</p>
          <h2 id="prototype-end-title">The hero lands here. The rest of the homepage stays out of the way.</h2>
        </section>
      </main>
    </div>
  );
}

const rootContainer = document.getElementById('root') as HTMLDivElement & {
  reactRoot?: Root;
};

rootContainer.reactRoot ??= createRoot(rootContainer);
rootContainer.reactRoot.render(<App />);
