import { useLayoutEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

const navItems = ['Events', 'About', 'Gallery', 'Coaching', 'Private', 'Shop'];

function BrandMark() {
  return (
    <a className="brand" href="#top" aria-label="Girls With Guns Australia, home">
      <span className="brand__cross" aria-hidden="true">
        <i />
        <i />
      </span>
      <span className="brand__text">
        Girls With Guns
        <small>Australia</small>
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
      </nav>
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
  return (
    <div className="target-rig" data-target-rig>
      <div className="carrier" aria-hidden="true">
        <span className="carrier__rail" />
        <span className="carrier__clip carrier__clip--left" />
        <span className="carrier__clip carrier__clip--right" />
      </div>
      <div className="paper-target">
        <div className="paper-target__header">
          <span>GWG</span>
          <span>EST. AUSTRALIA</span>
          <span>01</span>
        </div>
        <div className="target-copy" aria-hidden="true">
          <span>Girls With</span>
          <strong>Guns</strong>
        </div>
        <div className="bullseye" aria-label="Centred circular bullseye target">
          <span className="ring ring--one" />
          <span className="ring ring--two" />
          <span className="ring ring--three" />
          <span className="ring ring--four" />
          <span className="ring ring--core" />
          <span className="crosshair crosshair--x" />
          <span className="crosshair crosshair--y" />
        </div>
        <span className="impact impact--one" aria-hidden="true" />
        <span className="impact impact--two" aria-hidden="true" />
        <span className="impact impact--three" aria-hidden="true" />
        <div className="paper-target__footer">
          <span>BEGINNERS WELCOME</span>
          <span>12+ · SUPERVISED</span>
        </div>
      </div>
    </div>
  );
}

function EventCard() {
  return (
    <article className="event-card overlay-card" data-hero-overlay>
      <p className="eyebrow"><span /> Next shoot</p>
      <div className="event-card__body">
        <div>
          <p className="event-card__location">Beaconsfield</p>
          <p className="event-card__date">13 SEP · 10:30AM</p>
        </div>
        <span className="event-card__status">Limited spots</span>
      </div>
      <a href="#prototype-end" className="text-link">
        Book your spot <span aria-hidden="true">↗</span>
      </a>
    </article>
  );
}

function GalleryPreview() {
  return (
    <a className="gallery-preview overlay-card" data-hero-overlay href="#prototype-end">
      <div className="gallery-stack" aria-hidden="true">
        <span className="gallery-print gallery-print--back">03</span>
        <span className="gallery-print gallery-print--mid">02</span>
        <span className="gallery-print gallery-print--front">01</span>
      </div>
      <div>
        <p className="eyebrow">From the range</p>
        <p className="gallery-preview__link">View gallery <span aria-hidden="true">↗</span></p>
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
          .to('[data-target-rig]', { scale: 0.115, yPercent: -3, rotationX: 7, duration: 0.67, ease: 'power2.inOut' }, 0)
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
          .to('[data-target-rig]', { scale: 0.24, yPercent: -5, duration: 0.6, ease: 'power2.inOut' }, 0)
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
