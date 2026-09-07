import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent, type MouseEvent } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import './styles.css';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const navItems = ['Events', 'About', 'Gallery', 'Coaching', 'Private Events', 'Shop'];
const impactPositions = [[34, 43], [67, 44], [33, 57], [68, 58], [41, 48], [60, 54], [47, 60], [56, 41]];
type PaperImpact = { id: number; retiring?: boolean; rotation: number; size: number; x: number; y: number };

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg className={diagonal ? 'arrow arrow--diagonal' : 'arrow'} viewBox="0 0 28 20" fill="none" aria-hidden="true"><path d="M2 10h23M17 3l7 7-7 7" /></svg>;
}

function Navigation({ light, onStory }: { light: boolean; onStory: (event: MouseEvent<HTMLAnchorElement>) => void }) {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const links = Array.from(menu.current?.querySelectorAll<HTMLAnchorElement>('a') ?? []);
    const main = document.querySelector('main');
    if (main) main.inert = true;
    const focusFrame = window.requestAnimationFrame(() => links[0]?.focus({ preventScroll: true }));
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); }
      if (event.key !== 'Tab') return;
      const controls: HTMLElement[] = [...links, trigger.current!];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const desktop = window.matchMedia('(min-width: 1180px)');
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    document.addEventListener('keydown', handleKey);
    desktop.addEventListener('change', closeOnDesktop);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      if (main) main.inert = false;
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
      desktop.removeEventListener('change', closeOnDesktop);
    };
  }, [open]);

  return (
    <header className={'site-header' + (light ? ' site-header--paper' : '') + (open ? ' site-header--open' : '')}>
      <a className="brand" href="#top" aria-label="Girls With Guns Australia, home" onClick={() => setOpen(false)}>
        <strong className="brand__monogram">GWG</strong><span className="brand__divider" aria-hidden="true" />
        <span className="brand__text">Girls With<br />Guns Australia</span>
      </a>
      <nav ref={menu} id="primary-navigation" className={open ? 'nav nav--open' : 'nav'} aria-label="Primary navigation">
        {navItems.map((item, index) => <a key={item} href={item === 'About' ? '#story' : '#prototype-end'} onClick={(event) => {
          setOpen(false);
          if (item === 'About') onStory(event);
        }} style={{ '--item-index': index } as CSSProperties}><span className="nav__number" aria-hidden="true">0{index + 1}</span>{item}</a>)}
        <a className="nav__mobile-cta" href="#prototype-end" onClick={() => setOpen(false)}>Book next shoot <Arrow /></a>
        <p className="nav__signoff">Come curious. Leave confident.</p>
      </nav>
      <a className="header-cta" href="#prototype-end"><span>Book next shoot</span><Arrow /></a>
      <button ref={trigger} className="menu-button" type="button" aria-expanded={open} aria-controls="primary-navigation" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}><span /><span /></button>
    </header>
  );
}

function PaperTarget({ active, paused }: { active: boolean; paused: boolean }) {
  const [impacts, setImpacts] = useState<PaperImpact[]>([]);
  const current = useRef<PaperImpact[]>([]);
  const nextId = useRef(0);
  const removals = useRef(new Set<number>());
  useEffect(() => () => { removals.current.forEach(window.clearTimeout); removals.current.clear(); }, []);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 767px)');
    let timer: number | undefined;
    const update = (items: PaperImpact[]) => { current.current = items; setImpacts(items); };
    const stop = () => { window.clearTimeout(timer); timer = undefined; };
    const canRun = () => active && !paused && !document.hidden && !reduced.matches;
    const schedule = () => {
      stop();
      if (!canRun()) return;
      timer = window.setTimeout(() => {
        if (!canRun()) return;
        const live = current.current.filter((impact) => !impact.retiring);
        const candidates = impactPositions.filter(([x, y]) => !live.some((impact) => Math.hypot(impact.x - x, impact.y - y) < 10));
        const [x, y] = candidates[Math.floor(Math.random() * candidates.length)] ?? impactPositions[0];
        const oldest = live.length >= (mobile.matches ? 2 : 3) ? live[0] : undefined;
        update([...current.current.map((impact) => impact.id === oldest?.id ? { ...impact, retiring: true } : impact), {
          id: ++nextId.current, x: x + (Math.random() - .5) * 1.6, y: y + (Math.random() - .5) * 1.6,
          size: 3.6 + Math.random() * .6, rotation: Math.random() * 70 - 35,
        }]);
        if (oldest) {
          const removal = window.setTimeout(() => {
            update(current.current.filter((impact) => impact.id !== oldest.id));
            removals.current.delete(removal);
          }, 620);
          removals.current.add(removal);
        }
        schedule();
      }, current.current.length ? (mobile.matches ? 3800 : 3000) + Math.random() * 1200 : 2100);
    };
    const onPreference = () => { if (reduced.matches) update([]); schedule(); };
    const onViewportChange = () => {
      if (mobile.matches) update(current.current.filter((impact) => !impact.retiring).slice(-2));
      schedule();
    };
    document.addEventListener('visibilitychange', schedule);
    reduced.addEventListener('change', onPreference);
    mobile.addEventListener('change', onViewportChange);
    schedule();
    return () => {
      stop();
      document.removeEventListener('visibilitychange', schedule);
      reduced.removeEventListener('change', onPreference);
      mobile.removeEventListener('change', onViewportChange);
    };
  }, [active, paused]);

  return (
    <div className="target-rig" data-target-rig>
      <div className="target-surface">
        <img className="physical-target" src="/physical-target-sheet-clean-v1.webp" width="1536" height="1024" fetchPriority="high" alt="Weathered paper target on a steel carrier, with circular scoring rings and a pink bullseye" />
        <h1 className="target-lockup"><span className="target-lockup__eyeline">Girls With</span><strong>Guns</strong><span className="target-lockup__country"><i />Australia<i /></span></h1>
        <p className="target-message">Beginner-friendly shooting<br />experiences for women.</p>
        <div className="paper-impacts" aria-hidden="true">{impacts.map((impact) => <span key={impact.id} className={'paper-impact' + (impact.retiring ? ' paper-impact--retiring' : '')} style={{ '--impact-rotation': impact.rotation + 'deg', left: impact.x + '%', top: impact.y + '%', width: impact.size + '%' } as CSSProperties}><img src="/paper-impact-decal-v1-256.png" width="256" height="256" alt="" /></span>)}</div>
      </div>
    </div>
  );
}

function DetailIcon({ clock = false }: { clock?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">{clock ? <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></> : <><path d="M7 3v4M17 3v4M3 10h18M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2Z" /><path d="M7 14h2m3 0h2m3 0h1M7 17h2m3 0h2" /></>}</svg>;
}

function EventCard() {
  return <div className="event-position" data-hero-overlay><article className="event-card">
    <span className="event-card__pin" aria-hidden="true" />
    <div className="event-card__topline"><p className="eyebrow">Next shoot</p><span className="event-card__availability"><i />Limited spots</span></div>
    <h2>Beaconsfield</h2>
    <div className="event-card__details"><p><DetailIcon />13 September</p><p><DetailIcon clock />10:30 AM</p></div>
    <a href="#prototype-end" className="paper-button"><span>Book your spot</span><Arrow /></a>
    <span className="event-card__fold" aria-hidden="true" />
  </article></div>;
}

function GalleryPreview() {
  const galleryImages = [
    { layer: 'back', src: '/gwg-range-wide.webp', location: 'Bendigo', number: '01' },
    { layer: 'mid', src: '/gwg-target-group.webp', location: 'Bendigo', number: '02' },
    { layer: 'front', src: '/gwg-beaconsfield-group.webp', location: 'Beaconsfield', number: '03' },
  ];
  return <div className="gallery-position" data-hero-overlay><a className="gallery-preview" href="#prototype-end" aria-label="View the Girls With Guns gallery">
    <div className="gallery-stack" aria-hidden="true">{galleryImages.map(({ layer, src, location, number }) => <span className={'gallery-print gallery-print--' + layer} key={layer}><img src={src} alt="" width="1600" height="1200" loading="lazy" /><small>{location} <i>{number}</i></small></span>)}</div>
    <div className="gallery-label"><p>From the Range</p><span>View gallery<Arrow /></span></div>
  </a></div>;
}

function StoryPanel() {
  return <section className="story-panel" id="story" data-story aria-labelledby="story-heading" tabIndex={-1}>
    <div className="story-panel__inner">
      <figure className="story-panel__media" data-story-media>
        <div className="story-panel__image"><img data-story-image src="/gwg-participant-portrait.webp" alt="A Girls With Guns participant smiling at the range while holding a pink rifle" width="1200" height="1020" /></div>
        <div className="story-panel__media-caption"><span className="eyebrow">Our story</span><p>It starts with<br /><em>showing up.</em></p></div>
        <figcaption>GWG participant / Bendigo</figcaption>
      </figure>
      <div className="story-panel__copy">
        <p className="eyebrow eyebrow--dark" data-story-reveal><span />Why GWG exists</p>
        <h2 id="story-heading" data-story-reveal>Always wanted<br className="desktop-break" /> to try.<br /><em>Never wanted<br className="desktop-break" /> to go alone.</em></h2>
        <p className="story-panel__body" data-story-reveal>Farrah kept meeting women who were curious about shooting, but felt intimidated by the environment or simply didn’t know where to start. Girls With Guns Australia grew from that gap.</p>
        <a className="story-cta" href="#prototype-end" data-story-reveal><span>Meet Farrah &amp; read the story</span><Arrow diagonal /></a>
        <p className="story-panel__signature" data-story-reveal>Come curious. Leave confident.</p>
      </div>
    </div>
    <div className="story-panel__folio" aria-hidden="true"><span>Girls With Guns Australia</span><span>A little courage goes a long way.</span><span>02 / Our story</span></div>
  </section>;
}

const experienceFacts = [
  { label: 'Beginner friendly', detail: 'No prior experience' },
  { label: 'No licence required', detail: 'Come as you are' },
  { label: 'Ages 12+', detail: 'A shared first experience' },
  { label: 'Everything provided', detail: 'Equipment & safety gear' },
];

const experienceSteps = [
  { number: '01', title: 'Safety briefing', detail: 'Get comfortable before you step onto the range.' },
  { number: '02', title: 'Rifles & pistols', detail: 'Try both, with guidance throughout the session.' },
  { number: '03', title: 'Take home your target', detail: 'Leave with the proof that you gave it a go.' },
];

function ExperienceSection() {
  return <section className="experience-section" id="experience" data-experience aria-labelledby="experience-heading">
    <div className="experience-section__inner">
      <header className="experience-section__header">
        <p className="eyebrow experience-section__eyebrow" data-experience-reveal><span />03 / The experience</p>
        <h2 id="experience-heading" data-experience-reveal>Never shot before?<br /><em>Perfect.</em></h2>
        <div className="experience-section__intro" data-experience-reveal>
          <p>No experience, no licence and no gear? That’s exactly what a GWG shoot day is built for. Everything is set up so your first time feels clear, guided and approachable.</p>
          <a className="experience-cta" href="#prototype-end"><span>See what a GWG shoot day is like</span><Arrow /></a>
        </div>
      </header>

      <div className="experience-section__body">
        <dl className="experience-facts" aria-label="What to know before a Girls With Guns shoot">
          {experienceFacts.map(({ label, detail }, index) => <div className="experience-fact" data-experience-reveal key={label}>
            <dt><span>0{index + 1}</span>{label}</dt><dd>{detail}</dd>
          </div>)}
        </dl>

        <div className="experience-media" data-experience-media>
          <figure className="experience-media__group">
            <img src="/gwg-beaconsfield-wide.webp" alt="Girls With Guns participants at Beaconsfield holding their paper targets after a shoot" width="1536" height="1152" loading="lazy" />
            <figcaption>Beaconsfield / After the shoot</figcaption>
          </figure>
          <figure className="experience-media__detail">
            <img src="/gwg-safety-gear.webp" alt="Pink hearing protection and safety glasses ready for Girls With Guns participants" width="1000" height="1333" loading="lazy" />
            <figcaption>Safety gear / Provided</figcaption>
          </figure>
          <p className="experience-media__note" aria-hidden="true">Everything’s ready.<br />So you can be too.</p>
        </div>
      </div>

      <ol className="experience-process" aria-label="A Girls With Guns shoot day">
        {experienceSteps.map(({ number, title, detail }) => <li className="experience-step" data-experience-step key={number}>
          <span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div>
        </li>)}
      </ol>
    </div>
  </section>;
}

const exploreItems = [
  { title: 'Gallery', detail: 'Real shoot-day imagery.', image: '/gwg-target-group.webp', position: 'center 42%' },
  { title: '1-on-1 Coaching', detail: 'Learn at your own pace.', image: '/gwg-participant-portrait.webp', position: '51% 25%' },
  { title: 'Private Events', detail: 'Hens, birthdays, teams.', image: '/gwg-beaconsfield-group.webp', position: 'center 43%' },
  { title: 'Shop GWG', detail: 'Merch.', image: null, position: 'center' },
];

function ExploreVisual({ item, mobile = false }: { item: typeof exploreItems[number]; mobile?: boolean }) {
  if (!item.image) return <span className={(mobile ? 'explore-row__mobile-visual ' : 'explore-preview__brand ') + 'explore-brand-visual'} aria-hidden="true">
    <span>Girls With</span><strong>GWG</strong><small>Australia / Shop</small>
  </span>;
  return <span className={mobile ? 'explore-row__mobile-visual' : 'explore-preview__image'} aria-hidden="true">
    <img src={item.image} alt="" width="1440" height="1224" loading="lazy" style={{ objectPosition: item.position }} />
  </span>;
}

function ExploreSection() {
  const [active, setActive] = useState(0);
  return <section className="explore-section" id="explore" data-explore aria-labelledby="explore-heading">
    <div className="explore-section__inner">
      <header className="explore-section__header">
        <p className="eyebrow eyebrow--dark explore-section__eyebrow" data-explore-reveal><span />04 / Explore GWG</p>
        <h2 id="explore-heading" data-explore-reveal>Start wherever<br /><em>feels right.</em></h2>
        <p data-explore-reveal>See the shoot days, build confidence one-on-one, bring your own group or head to the shop.</p>
      </header>

      <div className="explore-section__layout">
        <nav className="explore-list" aria-label="Explore Girls With Guns">
          {exploreItems.map((item, index) => <a
            className={'explore-row' + (active === index ? ' explore-row--active' : '')}
            href="#prototype-end"
            key={item.title}
            data-explore-row
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
          >
            <span className="explore-row__number">0{index + 1}</span>
            <span className="explore-row__copy"><strong>{item.title}</strong><small>{item.detail}</small></span>
            <Arrow diagonal />
            <ExploreVisual item={item} mobile />
          </a>)}
        </nav>

        <div className="explore-preview" data-explore-preview aria-hidden="true">
          {exploreItems.map((item, index) => <span className={'explore-preview__layer' + (active === index ? ' explore-preview__layer--active' : '')} key={item.title}>
            <ExploreVisual item={item} />
            <span className="explore-preview__caption"><i>GWG</i><b>0{index + 1} / 04</b></span>
          </span>)}
        </div>
      </div>
      <div className="explore-section__folio" aria-hidden="true"><span>Contents / Girls With Guns Australia</span><span>Choose your next step</span></div>
    </div>
  </section>;
}

function FinalCta() {
  const [joined, setJoined] = useState(false);
  const previewWaitlist = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setJoined(true);
  };

  return <section className="final-cta" id="prototype-end" data-final aria-labelledby="final-cta-heading" tabIndex={-1}>
      <div className="final-cta__inner">
        <header className="final-cta__header">
          <p className="eyebrow final-cta__eyebrow" data-final-reveal><span />05 / Your next shoot</p>
          <h2 id="final-cta-heading" data-final-reveal>Ready when<br /><em>you are.</em></h2>
          <p data-final-reveal>Book the next shoot, or tell GWG where you’d like to see one.</p>
        </header>

        <div className="final-cta__grid">
          <article className="final-event" data-final-card aria-labelledby="final-event-title">
            <div className="final-event__topline"><span>Next shoot</span><span className="final-event__status"><i />Limited spots</span></div>
            <h3 id="final-event-title">Beaconsfield</h3>
            <dl className="final-event__details">
              <div><dt>Date</dt><dd>13 September</dd></div>
              <div><dt>Start</dt><dd>10:30 AM</dd></div>
            </dl>
            <a className="final-event__button" href="#prototype-end"><span>Book your spot</span><Arrow /></a>
            <p className="final-event__note">Preview event details — booking link to be connected.</p>
          </article>

          <div className="waitlist-panel" data-final-card>
            <p className="eyebrow">Not your area?</p>
            <h3>Tell us where<br />to go next.</h3>
            <p className="waitlist-panel__body">Add your suburb or postcode and how far you’re happy to travel. When a suitable shoot opens nearby, GWG can let you know.</p>
            {joined ? <div className="waitlist-success" role="status" tabIndex={-1}>
              <span>Preview complete</span><strong>That’s the success state.</strong><p>No details were submitted or saved.</p>
              <button type="button" onClick={() => setJoined(false)}>Try the form again</button>
            </div> : <form className="waitlist-form" onSubmit={previewWaitlist}>
              <label><span>Suburb or postcode</span><input name="location" type="text" autoComplete="postal-code" placeholder="e.g. Pakenham 3810" required /></label>
              <label><span>Travel distance</span><select name="distance" defaultValue="" required><option value="" disabled>Select distance</option><option value="30">Up to 30 km</option><option value="60">Up to 60 km</option><option value="100">Up to 100 km</option><option value="anywhere">Happy to travel</option></select></label>
              <button type="submit"><span>Join the waitlist</span><Arrow /></button>
              <small>Prototype only — these details aren’t submitted yet.</small>
            </form>}
          </div>
        </div>
      </div>
  </section>;
}

function SiteFooter() {
  return <footer className="site-footer">
    <div className="site-footer__inner">
      <a className="footer-brand" href="#top" aria-label="Girls With Guns Australia, back to top"><strong>GWG</strong><span>Girls With<br />Guns Australia</span></a>
      <nav className="footer-nav" aria-label="Footer navigation">
        <a href="#prototype-end">Events</a><a href="#story">About</a><a href="#explore">Gallery</a><a href="#explore">Coaching</a><a href="#explore">Private Events</a><a href="#explore">Shop</a>
      </nav>
      <div className="footer-social"><a href="#prototype-end">Instagram</a><a href="#prototype-end">Facebook</a></div>
      <p className="site-footer__signoff">Come curious.<br /><em>Leave confident.</em></p>
      <div className="site-footer__bottom"><span>© 2026 Girls With Guns Australia</span><span>Private homepage prototype</span><a href="#top">Back to top <Arrow /></a></div>
    </div>
  </footer>;
}

function App() {
  const root = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const experience = useRef<ScrollTrigger | null>(null);
  const [heroActive, setHeroActive] = useState(true);
  const [lightHeader, setLightHeader] = useState(false);
  const [paused, setPaused] = useState(false);

  const goToStory = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const target = document.getElementById('story');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !experience.current) {
      target?.scrollIntoView(); target?.focus({ preventScroll: true }); return;
    }
    gsap.to(window, { scrollTo: { y: experience.current.end, autoKill: true }, duration: 1.15, overwrite: 'auto', ease: 'power2.inOut', onComplete: () => {
      history.replaceState(null, '', '#story'); target?.focus({ preventScroll: true });
    } });
  };

  const navigatePreview = (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    const hash = link?.getAttribute('href');
    if (hash !== '#top' && hash !== '#prototype-end') return;
    const destination = document.querySelector<HTMLElement>(hash);
    if (!destination) return;
    event.preventDefault();
    const finish = () => {
      history.replaceState(null, '', hash);
      if (hash === '#top') document.querySelector<HTMLAnchorElement>('.brand')?.focus({ preventScroll: true });
      else { destination.tabIndex = -1; destination.focus({ preventScroll: true }); }
    };
    gsap.to(window, { scrollTo: { y: destination, autoKill: true }, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : .85, overwrite: 'auto', ease: 'power2.inOut', onComplete: finish });
  };

  useLayoutEffect(() => {
    if (!root.current || !stage.current || !scene.current) return;
    const app = root.current;
    const stageElement = stage.current;
    const sceneElement = scene.current;
    const hero = app.querySelector<HTMLElement>('[data-hero]')!;
    const story = app.querySelector<HTMLElement>('[data-story]')!;
    const experienceSection = app.querySelector<HTMLElement>('[data-experience]');
    const exploreSection = app.querySelector<HTMLElement>('[data-explore]');
    const prototypeEnd = app.querySelector<HTMLElement>('#prototype-end');
    const rig = app.querySelector<HTMLElement>('[data-target-rig]')!;
    const mm = gsap.matchMedia();
    let alive = true;

    mm.add({ desktop: '(min-width: 768px)', mobile: '(max-width: 767px)', reduced: '(prefers-reduced-motion: reduce)' }, (context) => {
      const { mobile, reduced } = context.conditions!;
      const distance = () => Math.round(window.innerHeight * (mobile ? .78 : .96));
      const measure = () => {
        stageElement.style.setProperty('--scene-height', sceneElement.offsetHeight + 'px');
        stageElement.style.setProperty('--travel', reduced ? '0px' : distance() + 'px');
      };
      measure();
      const observer = new ResizeObserver(() => { measure(); ScrollTrigger.refresh(); });
      observer.observe(story);

      if (reduced) {
        hero.inert = false; story.inert = false; setHeroActive(false);
        const header = ScrollTrigger.create({ trigger: story, start: 'top 90px', onEnter: () => setLightHeader(true), onLeaveBack: () => setLightHeader(false) });
        return () => { header.kill(); observer.disconnect(); };
      }

      const syncState = (progress: number) => {
          setHeroActive(progress < .035);
          setLightHeader(progress > .78);
          hero.inert = progress > .18;
          story.inert = progress < .78;
      };
      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        onUpdate: () => syncState(timeline.progress()),
        scrollTrigger: { trigger: stageElement, start: 'top top', end: () => '+=' + distance(), scrub: mobile ? .22 : .32, invalidateOnRefresh: true, onRefreshInit: measure, onRefresh: (self) => syncState(self.progress) },
      });
      experience.current = timeline.scrollTrigger!;
      syncState(experience.current.progress);

      // The printed bullseye stays on the range's vanishing point during retraction.
      timeline
        .to('[data-hero-overlay]', { opacity: 0, y: mobile ? 12 : 25, duration: .23, stagger: .025 }, .015)
        .to('[data-target-rig]', { scale: mobile ? .16 : .09, y: () => (window.innerHeight * .5) - (rig.offsetTop + rig.offsetHeight * .512), rotationX: mobile ? 0 : 3, duration: .81, ease: 'power2.inOut' }, 0)
        .to('[data-lane]', { scale: 1, duration: .85, ease: 'power1.inOut' }, 0)
        .to('.lane-shade', { opacity: .24, duration: .75 }, .05)
        .fromTo(story, { xPercent: 101 }, { xPercent: 0, duration: .66, ease: 'power3.inOut' }, .4)
        .to('[data-target-rig]', { opacity: 0, duration: .2 }, .77)
        .fromTo('[data-story-media]', { x: mobile ? 0 : 54 }, { x: 0, duration: .54, ease: 'power3.out' }, .55)
        .fromTo('[data-story-image]', { scale: 1.08 }, { scale: 1, duration: .6, ease: 'power2.out' }, .55)
        .fromTo('[data-story-reveal]', { opacity: 0, y: mobile ? 12 : 24 }, { opacity: 1, y: 0, duration: .29, stagger: .045, ease: 'power2.out' }, .73)
        .to({}, { duration: .08 });

      const refresh = () => { if (alive) { measure(); ScrollTrigger.refresh(); } };
      document.fonts.ready.then(refresh);
      window.addEventListener('load', refresh, { once: true });
      return () => {
        window.removeEventListener('load', refresh);
        observer.disconnect();
        experience.current = null;
        hero.inert = false; story.inert = false;
      };
    }, root);

    const experienceHeader = experienceSection ? ScrollTrigger.create({
      trigger: experienceSection,
      start: 'top 76px',
      onEnter: () => setLightHeader(false),
      onLeaveBack: () => setLightHeader(true),
    }) : null;

    const exploreHeader = exploreSection ? ScrollTrigger.create({
      trigger: exploreSection,
      start: 'top 76px',
      onEnter: () => setLightHeader(true),
      onLeaveBack: () => setLightHeader(false),
    }) : null;

    const endHeader = prototypeEnd ? ScrollTrigger.create({
      trigger: prototypeEnd,
      start: 'top 76px',
      onEnter: () => setLightHeader(false),
      onLeaveBack: () => setLightHeader(true),
    }) : null;

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      if (!experienceSection) return;
      const reveals = experienceSection.querySelectorAll<HTMLElement>('[data-experience-reveal]');
      const steps = experienceSection.querySelectorAll<HTMLElement>('[data-experience-step]');
      const media = experienceSection.querySelector<HTMLElement>('[data-experience-media]');
      const reveal = gsap.timeline({
        scrollTrigger: { trigger: experienceSection, start: 'top 77%', once: true },
      });
      if (media) reveal.fromTo(media, { clipPath: 'inset(6% 6% 6% 6%)', scale: 1.035 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: .65, ease: 'power2.out' });
      reveal
        .fromTo(reveals, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .42, stagger: .065, ease: 'power2.out' }, .1)
        .fromTo(steps, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .35, stagger: .08, ease: 'power1.out' }, .32);
      return () => reveal.kill();
    }, root);

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      if (!exploreSection) return;
      const reveals = exploreSection.querySelectorAll<HTMLElement>('[data-explore-reveal]');
      const rows = exploreSection.querySelectorAll<HTMLElement>('[data-explore-row]');
      const preview = exploreSection.querySelector<HTMLElement>('[data-explore-preview]');
      const reveal = gsap.timeline({ scrollTrigger: { trigger: exploreSection, start: 'top 78%', once: true } });
      reveal.fromTo(reveals, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .42, stagger: .07, ease: 'power2.out' });
      if (preview) reveal.fromTo(preview, { clipPath: 'inset(5% 5% 5% 5%)', scale: 1.025 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: .58, ease: 'power2.out' }, .08);
      reveal.fromTo(rows, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .36, stagger: .065, ease: 'power1.out' }, .2);
      return () => reveal.kill();
    }, root);

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      if (!prototypeEnd) return;
      const reveals = prototypeEnd.querySelectorAll<HTMLElement>('[data-final-reveal]');
      const cards = prototypeEnd.querySelectorAll<HTMLElement>('[data-final-card]');
      const reveal = gsap.timeline({ scrollTrigger: { trigger: prototypeEnd, start: 'top 78%', once: true } });
      reveal
        .fromTo(reveals, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .42, stagger: .07, ease: 'power2.out' })
        .fromTo(cards, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .46, stagger: .1, ease: 'power2.out' }, .2);
      return () => reveal.kill();
    }, root);

    const restoreHash = window.setTimeout(() => {
      if (location.hash === '#story' && experience.current) window.scrollTo({ top: experience.current.end, behavior: 'instant' });
    }, 150);
    return () => { alive = false; window.clearTimeout(restoreHash); experienceHeader?.kill(); exploreHeader?.kill(); endHeader?.kill(); mm.revert(); };
  }, []);

  return <div className="app" ref={root} id="top" onClick={navigatePreview}>
    <a className="skip-link" href="#story" onClick={goToStory}>Skip to our story</a>
    <Navigation light={lightHeader} onStory={goToStory} />
    <main>
      <div className="scroll-stage" ref={stage} data-scroll-stage><div className="scene" ref={scene}>
        <section className="hero" data-hero aria-label="Girls With Guns Australia introduction">
          <img className="lane" data-lane src="/shooting-range-hero-backdrop.webp" alt="" width="1672" height="941" fetchPriority="high" />
          <div className="lane-shade" aria-hidden="true" /><div className="lane-vignette" aria-hidden="true" />
          <div className="hero-edition" data-hero-overlay aria-hidden="true"><span>Take a breath.</span><span>Try something new.</span></div>
          <PaperTarget active={heroActive} paused={paused} />
          <EventCard /><GalleryPreview />
          <a className="scroll-cue" href="#story" onClick={goToStory} data-hero-overlay><span>Step inside</span><span className="scroll-cue__line" aria-hidden="true" /></a>
          <button className="effects-toggle" data-hero-overlay type="button" aria-pressed={paused} onClick={() => setPaused(!paused)} aria-label={paused ? 'Resume bullet hole effects' : 'Pause bullet hole effects'}><span className={paused ? 'effects-icon effects-icon--play' : 'effects-icon'} aria-hidden="true" />{paused ? 'Resume effects' : 'Pause effects'}</button>
        </section>
        <StoryPanel />
      </div></div>
      <ExperienceSection />
      <ExploreSection />
      <FinalCta />
    </main>
    <SiteFooter />
  </div>;
}

const rootContainer = document.getElementById('root') as HTMLDivElement & { reactRoot?: Root };
rootContainer.reactRoot ??= createRoot(rootContainer);
rootContainer.reactRoot.render(<App />);
