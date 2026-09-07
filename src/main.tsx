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

type SitePage = 'home' | 'events' | 'about' | 'gallery';

function Navigation({ light, currentPage = 'home' }: { light: boolean; currentPage?: SitePage }) {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const navHref = (item: string) => {
    if (item === 'Events') return currentPage === 'events' ? '#event' : '/events#event';
    if (item === 'About') return currentPage === 'about' ? '#story' : '/about#story';
    if (item === 'Gallery') return currentPage === 'gallery' ? '#gallery' : '/gallery#gallery';
    return currentPage === 'home' ? '#explore' : '/#explore';
  };

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
      <a className="brand" href={currentPage === 'home' ? '#top' : '/#top'} aria-label="Girls With Guns Australia, home" onClick={() => setOpen(false)}>
        <strong className="brand__monogram">GWG</strong><span className="brand__divider" aria-hidden="true" />
        <span className="brand__text">Girls With<br />Guns Australia</span>
      </a>
      <nav ref={menu} id="primary-navigation" className={open ? 'nav nav--open' : 'nav'} aria-label="Primary navigation">
        {navItems.map((item, index) => <a key={item} href={navHref(item)} aria-current={(currentPage === 'events' && item === 'Events') || (currentPage === 'about' && item === 'About') || (currentPage === 'gallery' && item === 'Gallery') ? 'page' : undefined} onClick={() => setOpen(false)} style={{ '--item-index': index } as CSSProperties}><span className="nav__number" aria-hidden="true">0{index + 1}</span>{item}</a>)}
        <a className="nav__mobile-cta" href={currentPage === 'events' ? '#event-details' : '/events#event-details'} onClick={() => setOpen(false)}>Book next shoot <Arrow /></a>
        <p className="nav__signoff">Come curious. Leave confident.</p>
      </nav>
      <a className="header-cta" href={currentPage === 'events' ? '#event-details' : '/events#event-details'}><span>Book next shoot</span><Arrow /></a>
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
    <a href="/events#event-details" className="paper-button"><span>Book your spot</span><Arrow /></a>
    <span className="event-card__fold" aria-hidden="true" />
  </article></div>;
}

function GalleryPreview() {
  const galleryImages = [
    { layer: 'back', src: '/gwg-range-wide.webp', location: 'Bendigo', number: '01' },
    { layer: 'mid', src: '/gwg-target-group.webp', location: 'Bendigo', number: '02' },
    { layer: 'front', src: '/gwg-beaconsfield-group.webp', location: 'Beaconsfield', number: '03' },
  ];
  return <div className="gallery-position" data-hero-overlay><a className="gallery-preview" href="/gallery#gallery" aria-label="View the Girls With Guns gallery">
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
        <a className="story-cta" href="/about#story" data-story-reveal><span>Meet Farrah &amp; read the story</span><Arrow diagonal /></a>
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
          <a className="experience-cta" href="/events#day"><span>See what a GWG shoot day is like</span><Arrow /></a>
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
  { title: 'Gallery', detail: 'Real shoot-day imagery.', image: '/gwg-target-group.webp', position: 'center 42%', href: '/gallery#gallery' },
  { title: '1-on-1 Coaching', detail: 'Learn at your own pace.', image: '/gwg-participant-portrait.webp', position: '51% 25%', href: '#prototype-end' },
  { title: 'Private Events', detail: 'Hens, birthdays, teams.', image: '/gwg-beaconsfield-group.webp', position: 'center 43%', href: '#prototype-end' },
  { title: 'Shop GWG', detail: 'Merch.', image: null, position: 'center', href: '#prototype-end' },
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
            href={item.href}
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
            <a className="final-event__button" href="/events#event-details"><span>Book your spot</span><Arrow /></a>
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

function SiteFooter({ currentPage = 'home' }: { currentPage?: SitePage }) {
  return <footer className="site-footer">
    <div className="site-footer__inner">
      <a className="footer-brand" href={currentPage === 'home' ? '#top' : '/#top'} aria-label="Girls With Guns Australia, home"><strong>GWG</strong><span>Girls With<br />Guns Australia</span></a>
      <nav className="footer-nav" aria-label="Footer navigation">
        <a href={currentPage === 'events' ? '#event' : '/events#event'} aria-current={currentPage === 'events' ? 'page' : undefined}>Events</a><a href={currentPage === 'about' ? '#story' : '/about#story'} aria-current={currentPage === 'about' ? 'page' : undefined}>About</a><a href={currentPage === 'gallery' ? '#gallery' : '/gallery#gallery'} aria-current={currentPage === 'gallery' ? 'page' : undefined}>Gallery</a><a href={currentPage === 'home' ? '#explore' : '/#explore'}>Coaching</a><a href={currentPage === 'home' ? '#explore' : '/#explore'}>Private Events</a><a href={currentPage === 'home' ? '#explore' : '/#explore'}>Shop</a>
      </nav>
      <div className="footer-social"><a href={currentPage === 'home' ? '#prototype-end' : '/#prototype-end'}>Instagram</a><a href={currentPage === 'home' ? '#prototype-end' : '/#prototype-end'}>Facebook</a></div>
      <p className="site-footer__signoff">Come curious.<br /><em>Leave confident.</em></p>
      <div className="site-footer__bottom"><span>© 2026 Girls With Guns Australia</span><span>Private website prototype</span><a href="#top">Back to top <Arrow /></a></div>
    </div>
  </footer>;
}

const eventDaySteps = [
  { number: '01', title: 'Safety briefing', detail: 'Meet the team, get fitted with safety gear and learn how the range works.' },
  { number: '02', title: 'Target shooting', detail: 'Start slowly, settle in and build confidence with support close by.' },
  { number: '03', title: 'Rifles & pistols', detail: 'Try both across the session, with clear guidance at every step.' },
  { number: '04', title: 'Keep your target', detail: 'Take it home as proof that you gave something new a proper go.' },
];

const eventFaq = [
  { question: 'Do I need a firearms licence?', answer: 'No. The current GWG event format is designed for complete beginners attending under range supervision. The live event listing will carry the final eligibility and range requirements.' },
  { question: 'What if I have never shot before?', answer: 'That is completely fine. You will begin with a safety briefing, then work through the session with guidance from the range team.' },
  { question: 'How old do you need to be?', answer: 'The current preview event is listed as ages 12+. Check the live event listing before booking, as age and range requirements can vary.' },
  { question: 'What should I bring?', answer: 'Bring photo ID, enclosed shoes and water. The event listing will confirm anything else required for that particular range.' },
  { question: 'Is the equipment provided?', answer: 'Yes. The current GWG format includes the firearms, ammunition and safety equipment used during the session.' },
  { question: 'Can I come on my own?', answer: 'Absolutely. Plenty of women come because they want to try it without needing to organise a whole group first.' },
];

function EventsPage() {
  const root = useRef<HTMLDivElement>(null);
  const [lightHeader, setLightHeader] = useState(false);
  const [bookingNote, setBookingNote] = useState(false);
  const [joined, setJoined] = useState(false);
  const [location, setLocation] = useState('');
  const [distance, setDistance] = useState('');

  useEffect(() => {
    document.title = 'Events — Girls With Guns Australia';
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = 'Explore upcoming Girls With Guns Australia shoot days and see what to expect on the range.';
  }, []);

  const navigateSection = (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    const hash = link?.getAttribute('href');
    const destination = hash ? document.querySelector<HTMLElement>(hash) : null;
    if (!hash || !destination) return;
    event.preventDefault();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.to(window, { scrollTo: { y: destination, offsetY: 76, autoKill: true }, duration: reduced ? 0 : .72, ease: 'power2.inOut', overwrite: 'auto', onComplete: () => {
      history.replaceState(null, '', hash);
      destination.focus({ preventScroll: true });
    } });
  };

  const previewBooking = () => setBookingNote(true);
  const previewWaitlist = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setJoined(true);
  };

  useLayoutEffect(() => {
    if (!root.current) return;
    const scope = root.current;
    const themedSections = [
      { selector: '[data-events-dates]', light: true },
      { selector: '[data-events-day]', light: true },
      { selector: '[data-events-ready]', light: false },
      { selector: '[data-events-faq]', light: true },
      { selector: '[data-events-waitlist]', light: false },
    ];
    const syncHeaderTheme = () => {
      let light = false;
      themedSections.forEach(({ selector, light: sectionLight }) => {
        const section = scope.querySelector<HTMLElement>(selector);
        if (section && section.getBoundingClientRect().top <= 77) light = sectionLight;
      });
      setLightHeader(light);
    };
    const headerTrigger = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: syncHeaderTheme, onRefresh: syncHeaderTheme });
    const headerFrame = window.requestAnimationFrame(syncHeaderTheme);
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const heroReveal = scope.querySelectorAll<HTMLElement>('[data-events-hero-reveal]');
      const ticket = scope.querySelector<HTMLElement>('[data-events-ticket]');
      const heroTimeline = gsap.timeline({ defaults: { ease: 'power2.out' } });
      heroTimeline.fromTo(heroReveal, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .48, stagger: .07 });
      if (ticket) heroTimeline.fromTo(ticket, { opacity: 0, y: 22, rotation: -2.6 }, { opacity: 1, y: 0, rotation: -1.2, duration: .62, ease: 'power3.out' }, .12);

      const sectionAnimations = Array.from(scope.querySelectorAll<HTMLElement>('[data-events-section]')).map((section) => {
        const items = section.querySelectorAll<HTMLElement>('[data-events-reveal]');
        if (!items.length) return null;
        return gsap.fromTo(items, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .44, stagger: .065, ease: 'power2.out', scrollTrigger: { trigger: section, start: 'top 82%', once: true } });
      });
      const refresh = () => ScrollTrigger.refresh();
      document.fonts.ready.then(refresh);
      window.addEventListener('load', refresh, { once: true });
      return () => {
        window.removeEventListener('load', refresh);
        heroTimeline.kill();
        sectionAnimations.forEach((animation) => animation?.kill());
      };
    }, scope);
    return () => { window.cancelAnimationFrame(headerFrame); headerTrigger.kill(); mm.revert(); };
  }, []);

  return <div className="events-page app" ref={root} id="top" onClick={navigateSection}>
    <a className="skip-link" href="#event-details">Skip to event details</a>
    <Navigation light={lightHeader} currentPage="events" />
    <main>
      <section className="events-hero" id="event" aria-labelledby="events-heading" tabIndex={-1}>
        <img className="events-hero__image" src="/gwg-range-wide.webp" alt="Women taking part in a Girls With Guns shoot day at the range" width="1600" height="1200" fetchPriority="high" />
        <div className="events-hero__shade" aria-hidden="true" />
        <div className="events-hero__inner">
          <div className="events-hero__copy">
            <p className="eyebrow" data-events-hero-reveal><span />Events / Girls With Guns Australia</p>
            <h1 id="events-heading" data-events-hero-reveal>Your next shoot<br /><em>starts here.</em></h1>
            <p className="events-hero__intro" data-events-hero-reveal>A guided range day for women who are curious, completely new to it, or ready to come back for another go.</p>
            <a className="events-hero__jump" href="#day" data-events-hero-reveal>See what happens on the day <Arrow /></a>
          </div>

          <article className="events-ticket" id="event-details" data-events-ticket aria-labelledby="events-ticket-title" tabIndex={-1}>
            <div className="events-ticket__topline"><span>Preview event details</span><span className="events-ticket__status"><i />Limited spots</span></div>
            <p className="events-ticket__place">Next shoot / Victoria</p>
            <h2 id="events-ticket-title">Beaconsfield</h2>
            <dl className="events-ticket__details">
              <div><dt>Date</dt><dd><time>13 September</time></dd></div>
              <div><dt>Start</dt><dd><time>10:30 AM</time></dd></div>
              <div><dt>Location</dt><dd>Beaconsfield</dd></div>
              <div><dt>Price</dt><dd>To be confirmed</dd></div>
            </dl>
            <ul className="events-ticket__tags" aria-label="Event highlights"><li>Beginner friendly</li><li>Ages 12+</li><li>Equipment provided</li></ul>
            <button className="events-ticket__button" type="button" onClick={previewBooking}><span>Book your spot</span><Arrow /></button>
            {bookingNote ? <p className="events-ticket__note" role="status">Booking is not live in this prototype. The final button will open the confirmed event listing.</p> : <p className="events-ticket__note">Event details and booking link still need final confirmation.</p>}
          </article>
        </div>
      </section>

      <section className="events-dates" data-events-dates data-events-section aria-labelledby="events-dates-heading">
        <div className="events-dates__inner">
          <p className="eyebrow eyebrow--dark" data-events-reveal><span />More shoot dates</p>
          <h2 id="events-dates-heading" data-events-reveal>The next one will<br /><em>appear here.</em></h2>
          <p data-events-reveal>As new events are confirmed, this page will show the date, range, availability and booking link in one place.</p>
          <a href="#waitlist" data-events-reveal>Tell GWG where to go next <Arrow /></a>
        </div>
      </section>

      <section className="events-day" id="day" data-events-day data-events-section aria-labelledby="events-day-heading" tabIndex={-1}>
        <div className="events-day__inner">
          <header className="events-day__header">
            <p className="eyebrow eyebrow--dark" data-events-reveal><span />02 / The day</p>
            <h2 id="events-day-heading" data-events-reveal>A clear plan.<br /><em>No guesswork.</em></h2>
            <p data-events-reveal>You will know what is happening before you step onto the range. The pace stays calm, the guidance stays close and there is room to ask questions.</p>
          </header>
          <figure className="events-day__photo" data-events-reveal>
            <img src="/gwg-beaconsfield-wide.webp" alt="Girls With Guns participants together at Beaconsfield after a shoot" width="1536" height="1152" loading="lazy" />
            <figcaption><span>Beaconsfield</span><span>After the shoot / 01</span></figcaption>
          </figure>
          <ol className="events-day__steps" aria-label="What happens at a Girls With Guns event">
            {eventDaySteps.map(({ number, title, detail }) => <li key={number} data-events-reveal><span>{number}</span><h3>{title}</h3><p>{detail}</p></li>)}
          </ol>
        </div>
      </section>

      <section className="events-ready" data-events-ready data-events-section aria-labelledby="events-ready-heading">
        <div className="events-ready__inner">
          <div className="events-ready__copy">
            <p className="eyebrow" data-events-reveal><span />03 / Good to know</p>
            <h2 id="events-ready-heading" data-events-reveal>New to it?<br /><em>That’s the point.</em></h2>
            <p data-events-reveal>GWG is built for the women who have wanted to try shooting but did not know where to begin, what to bring or who to go with.</p>
            <dl className="events-ready__facts">
              <div data-events-reveal><dt>01</dt><dd><strong>No experience needed</strong><span>Complete beginners are welcome.</span></dd></div>
              <div data-events-reveal><dt>02</dt><dd><strong>No licence required</strong><span>For the current supervised event format.</span></dd></div>
              <div data-events-reveal><dt>03</dt><dd><strong>Ages 12+</strong><span>Final requirements sit on the live listing.</span></dd></div>
              <div data-events-reveal><dt>04</dt><dd><strong>Everything provided</strong><span>Equipment and safety gear are ready.</span></dd></div>
            </dl>
          </div>
          <div className="events-ready__visual" data-events-reveal>
            <figure><img src="/gwg-safety-gear.webp" alt="Pink hearing protection and safety glasses prepared for participants" width="1000" height="1333" loading="lazy" /><figcaption>Safety gear / Ready for you</figcaption></figure>
            <aside className="events-bring" aria-labelledby="events-bring-heading">
              <p>Before you leave home</p><h3 id="events-bring-heading">What to bring</h3>
              <ul><li><span>01</span>Photo ID</li><li><span>02</span>Enclosed shoes</li><li><span>03</span>Water recommended</li></ul>
            </aside>
          </div>
        </div>
      </section>

      <section className="events-faq" data-events-faq data-events-section aria-labelledby="events-faq-heading">
        <div className="events-faq__inner">
          <header>
            <p className="eyebrow eyebrow--dark" data-events-reveal><span />04 / Before you book</p>
            <h2 id="events-faq-heading" data-events-reveal>Questions are<br /><em>welcome.</em></h2>
            <p data-events-reveal>If something still feels unclear, start here. Final range-specific information will always sit on the live event listing.</p>
          </header>
          <div className="events-faq__list" data-events-reveal>
            {eventFaq.map(({ question, answer }) => <details key={question}><summary>{question}<span aria-hidden="true" /></summary><p>{answer}</p></details>)}
          </div>
          <p className="events-faq__note" data-events-reveal>Prototype content: the event date, availability and eligibility details still need final confirmation.</p>
        </div>
      </section>

      <section className="events-waitlist" id="waitlist" data-events-waitlist data-events-section aria-labelledby="events-waitlist-heading" tabIndex={-1}>
        <div className="events-waitlist__inner">
          <header>
            <p className="eyebrow" data-events-reveal><span />05 / Your area</p>
            <h2 id="events-waitlist-heading" data-events-reveal>Not near<br />Beaconsfield?<br /><em>Tell GWG.</em></h2>
          </header>
          <div className="events-waitlist__form" data-events-reveal>
            <h3>Where should the next shoot be?</h3>
            <p>Add your suburb or postcode and how far you would travel. When a suitable date opens nearby, GWG can let you know.</p>
            {joined ? <div className="waitlist-success" role="status">
              <span>Preview complete</span><strong>That’s the success state.</strong><p>No details were submitted or saved.</p>
              <button type="button" onClick={() => setJoined(false)}>Try the form again</button>
            </div> : <form className="waitlist-form" onSubmit={previewWaitlist}>
              <label><span>Suburb or postcode</span><input name="location" type="text" autoComplete="postal-code" placeholder="e.g. Pakenham 3810" value={location} onChange={(event) => setLocation(event.target.value)} required /></label>
              <label><span>Travel distance</span><select name="distance" value={distance} onChange={(event) => setDistance(event.target.value)} required><option value="" disabled>Select distance</option><option value="30">Up to 30 km</option><option value="60">Up to 60 km</option><option value="100">Up to 100 km</option><option value="anywhere">Happy to travel</option></select></label>
              <button type="submit"><span>Join the waitlist</span><Arrow /></button>
              <small>Prototype only — these details are not submitted yet.</small>
            </form>}
          </div>
        </div>
      </section>
    </main>
    <SiteFooter currentPage="events" />
  </div>;
}

const aboutPrinciples = [
  { number: '01', title: 'An approachable start', detail: 'The first visit should feel clear, not exclusive.' },
  { number: '02', title: 'Safety without theatre', detail: 'Straight answers, proper guidance and time to listen.' },
  { number: '03', title: 'A women-first space', detail: 'A place where asking questions never feels out of place.' },
  { number: '04', title: 'Confidence you earn', detail: 'The feeling that comes after giving something new a proper go.' },
  { number: '05', title: 'Community without pressure', detail: 'Come alone or bring someone. Either way, you are part of the day.' },
];

function AboutPage() {
  const root = useRef<HTMLDivElement>(null);
  const [lightHeader, setLightHeader] = useState(false);

  useEffect(() => {
    document.title = 'About — Girls With Guns Australia';
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = 'Why Farrah created Girls With Guns Australia: a clearer, more approachable first step onto the shooting range for women.';
  }, []);

  const navigateSection = (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    const hash = link?.getAttribute('href');
    const destination = hash ? document.querySelector<HTMLElement>(hash) : null;
    if (!hash || !destination) return;
    event.preventDefault();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.to(window, { scrollTo: { y: destination, offsetY: 76, autoKill: true }, duration: reduced ? 0 : .72, ease: 'power2.inOut', overwrite: 'auto', onComplete: () => {
      history.replaceState(null, '', hash);
      destination.focus({ preventScroll: true });
    } });
  };

  useLayoutEffect(() => {
    if (!root.current) return;
    const scope = root.current;
    const themedSections = [
      { selector: '[data-about-origin]', light: true },
      { selector: '[data-about-principles]', light: false },
      { selector: '[data-about-community]', light: true },
      { selector: '[data-about-invitation]', light: false },
    ];
    const syncHeaderTheme = () => {
      let light = false;
      themedSections.forEach(({ selector, light: sectionLight }) => {
        const section = scope.querySelector<HTMLElement>(selector);
        if (section && section.getBoundingClientRect().top <= 77) light = sectionLight;
      });
      setLightHeader(light);
    };
    const headerTrigger = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: syncHeaderTheme, onRefresh: syncHeaderTheme });
    const headerFrame = window.requestAnimationFrame(syncHeaderTheme);
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const heroItems = scope.querySelectorAll<HTMLElement>('[data-about-hero-reveal]');
      const heroMedia = scope.querySelector<HTMLElement>('[data-about-hero-media]');
      const heroTimeline = gsap.timeline({ defaults: { ease: 'power2.out' } });
      heroTimeline.fromTo(heroItems, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .48, stagger: .07 });
      if (heroMedia) heroTimeline.fromTo(heroMedia, { opacity: 0, clipPath: 'inset(0 0 100% 0)' }, { opacity: 1, clipPath: 'inset(0 0 0% 0)', duration: .72, ease: 'power3.inOut' }, .08);

      const sectionAnimations = Array.from(scope.querySelectorAll<HTMLElement>('[data-about-section]')).map((section) => {
        const items = section.querySelectorAll<HTMLElement>('[data-about-reveal]');
        if (!items.length) return null;
        return gsap.fromTo(items, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .42, stagger: .06, ease: 'power2.out', scrollTrigger: { trigger: section, start: 'top 84%', once: true } });
      });

      const refresh = () => ScrollTrigger.refresh();
      document.fonts.ready.then(refresh);
      window.addEventListener('load', refresh, { once: true });
      return () => {
        window.removeEventListener('load', refresh);
        heroTimeline.kill();
        sectionAnimations.forEach((animation) => animation?.kill());
      };
    }, scope);

    mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      const heroImage = scope.querySelector<HTMLElement>('[data-about-hero-image]');
      if (!heroImage) return;
      const parallax = gsap.fromTo(heroImage, { yPercent: -3, scale: 1.045 }, { yPercent: 5, scale: 1.02, ease: 'none', scrollTrigger: { trigger: '[data-about-hero]', start: 'top top', end: 'bottom top', scrub: .7 } });
      return () => parallax.kill();
    }, scope);

    return () => { window.cancelAnimationFrame(headerFrame); headerTrigger.kill(); mm.revert(); };
  }, []);

  return <div className="about-page app" ref={root} id="top" onClick={navigateSection}>
    <a className="skip-link" href="#story">Skip to the story</a>
    <Navigation light={lightHeader} currentPage="about" />
    <main>
      <section className="about-hero" data-about-hero aria-labelledby="about-heading">
        <div className="about-hero__inner">
          <div className="about-hero__copy">
            <p className="eyebrow" data-about-hero-reveal><span />About / Girls With Guns Australia</p>
            <h1 id="about-heading" data-about-hero-reveal>For the women<br />who wanted<br /><em>to try.</em></h1>
            <p data-about-hero-reveal>Farrah built Girls With Guns Australia for women who were curious about shooting, but did not want to figure out the range alone.</p>
            <a className="about-hero__jump" href="#story" data-about-hero-reveal>Why GWG exists <Arrow /></a>
          </div>
          <figure className="about-hero__media" data-about-hero-media>
            <img data-about-hero-image src="/gwg-range-wide.webp" alt="Women taking part in a Girls With Guns range day" width="1600" height="1200" fetchPriority="high" />
            <figcaption><span>Girls With Guns Australia</span><span>On the range / 01</span></figcaption>
          </figure>
          <p className="about-hero__aside" data-about-hero-reveal aria-hidden="true">A clearer first step<br />for women, with women.</p>
        </div>
      </section>

      <section className="about-origin" id="story" data-about-origin data-about-section aria-labelledby="about-origin-heading" tabIndex={-1}>
        <div className="about-origin__inner">
          <header className="about-origin__header">
            <p className="eyebrow eyebrow--dark" data-about-reveal><span />01 / Where it started</p>
            <h2 id="about-origin-heading" data-about-reveal>It kept starting<br />with the same<br /><em>sentence.</em></h2>
          </header>
          <div className="about-origin__story">
            <p className="about-origin__statement" data-about-reveal>I’d love to try.<br />I just don’t know<br />where to start.</p>
            <div className="about-origin__body" data-about-reveal>
              <p>Farrah kept meeting women who saw her shooting and were interested, but the environment could feel intimidating and the first step was not always obvious.</p>
              <p>GWG grew from making that step more approachable: a day where the safety briefing is clear, questions are welcome and nobody is expected to arrive already knowing the ropes.</p>
              <p>The point was never to make shooting look intimidating. It was to give women a proper chance to decide whether they enjoyed it.</p>
            </div>
          </div>
          <figure className="about-origin__photo" data-about-reveal>
            <img src="/gwg-participant-portrait.webp" alt="A Girls With Guns participant smiling at the range while holding a pink rifle" width="1200" height="1020" loading="lazy" />
            <figcaption><span>A first step</span><span>Made together / 02</span></figcaption>
          </figure>
          <p className="about-origin__signoff" data-about-reveal>Come curious.<br /><em>Leave confident.</em></p>
        </div>
      </section>

      <section className="about-principles" data-about-principles data-about-section aria-labelledby="about-principles-heading">
        <div className="about-principles__inner">
          <header>
            <p className="eyebrow" data-about-reveal><span />02 / What matters</p>
            <h2 id="about-principles-heading" data-about-reveal>Confidence comes<br />after the<br /><em>first step.</em></h2>
            <p data-about-reveal>GWG does not ask you to feel fearless before you arrive. It gives you a clearer place to begin.</p>
          </header>
          <ol className="about-principles__list">
            {aboutPrinciples.map(({ number, title, detail }) => <li key={number} data-about-reveal><span>{number}</span><h3>{title}</h3><p>{detail}</p></li>)}
          </ol>
        </div>
      </section>

      <section className="about-community" data-about-community data-about-section aria-labelledby="about-community-heading">
        <div className="about-community__inner">
          <header>
            <p className="eyebrow eyebrow--dark" data-about-reveal><span />03 / The people</p>
            <h2 id="about-community-heading" data-about-reveal>The range is only<br /><em>part of the story.</em></h2>
            <p data-about-reveal>GWG is not about being the toughest person in the room. It is about the moment someone settles in, takes the shot and realises she can do more than she expected.</p>
          </header>
          <figure className="about-community__photo" data-about-reveal>
            <img src="/gwg-beaconsfield-group.webp" alt="Girls With Guns participants together after a range day" width="1536" height="1152" loading="lazy" />
            <figcaption><span>Beaconsfield</span><span>Together after the shoot / 03</span></figcaption>
          </figure>
          <ol className="about-community__steps" aria-label="The Girls With Guns experience">
            <li data-about-reveal><span>01</span><strong>Show up curious.</strong></li>
            <li data-about-reveal><span>02</span><strong>Learn at your pace.</strong></li>
            <li data-about-reveal><span>03</span><strong>Leave with your target.</strong></li>
          </ol>
        </div>
      </section>

      <section className="about-invitation" data-about-invitation data-about-section aria-labelledby="about-invitation-heading">
        <div className="about-invitation__inner">
          <p className="eyebrow" data-about-reveal><span />04 / Come along</p>
          <h2 id="about-invitation-heading" data-about-reveal>Meet GWG<br /><em>at the range.</em></h2>
          <p data-about-reveal>See the next shoot, what happens on the day and what you need to bring.</p>
          <div className="about-invitation__actions" data-about-reveal>
            <a className="about-invitation__primary" href="/events#event"><span>Explore shoot days</span><Arrow /></a>
            <a className="about-invitation__secondary" href="/events#waitlist">Join the location waitlist <Arrow /></a>
          </div>
        </div>
      </section>
    </main>
    <SiteFooter currentPage="about" />
  </div>;
}

const galleryImages = [
  {
    src: '/gwg-beaconsfield-wide.webp',
    alt: 'Girls With Guns participants at Beaconsfield holding their paper targets after the shoot',
    location: 'Beaconsfield', moment: 'After the shoot', number: '01', width: 1536, height: 1152, position: '50% 48%',
  },
  {
    src: '/gwg-participant-portrait.webp',
    alt: 'A smiling Girls With Guns participant wearing pink hearing protection and holding a pink rifle',
    location: 'Bendigo', moment: 'First-time confidence', number: '02', width: 1200, height: 1020, position: '50% 38%',
  },
  {
    src: '/gwg-sale-pistol.webp',
    alt: 'A Girls With Guns participant firing a pistol under an instructor’s supervision at Sale Pistol Club',
    location: 'Sale', moment: 'First shot at the line', number: '03', width: 2000, height: 1500, position: '43% 50%',
  },
  {
    src: '/gwg-target-group.webp',
    alt: 'Three Girls With Guns participants holding their paper targets together at Bendigo',
    location: 'Bendigo', moment: 'Targets worth keeping', number: '04', width: 1400, height: 1189, position: '50% 42%',
  },
  {
    src: '/gwg-sale-rifle.webp',
    alt: 'A Girls With Guns participant trying a scoped rifle with an instructor at Sale Pistol Club',
    location: 'Sale', moment: 'Trying the rifle line', number: '05', width: 2000, height: 1500, position: '72% 50%',
  },
  {
    src: '/gwg-beaconsfield-group.webp',
    alt: 'Five Girls With Guns participants holding targets and pink safety gear at Beaconsfield',
    location: 'Beaconsfield', moment: 'The group shot', number: '06', width: 1600, height: 1200, position: '50% 44%',
  },
  {
    src: '/gwg-sale-group.webp',
    alt: 'A large group of Girls With Guns participants smiling with their targets after a Sale shoot day',
    location: 'Sale', moment: 'Targets up', number: '07', width: 2000, height: 1500, position: '50% 50%',
  },
  {
    src: '/gwg-range-wide.webp',
    alt: 'Girls With Guns participants gathered inside the Bendigo range shelter between turns',
    location: 'Bendigo', moment: 'Between turns', number: '08', width: 1400, height: 1190, position: '44% 50%',
  },
  {
    src: '/gwg-sale-targets.webp',
    alt: 'Four Girls With Guns participants holding their paper targets at Sale Pistol Club',
    location: 'Sale', moment: 'The proof comes home', number: '09', width: 2000, height: 1500, position: '50% 50%',
  },
  {
    src: '/gwg-safety-gear.webp',
    alt: 'Rows of pink hearing protection and safety glasses laid out before an Echuca shoot',
    location: 'Echuca', moment: 'Ready at the line', number: '10', width: 1000, height: 1333, position: '50% 50%',
  },
  {
    src: '/gwg-sale-team-selfie.webp',
    alt: 'Three smiling Girls With Guns team members together at Sale Pistol Club',
    location: 'Sale', moment: 'Morning at the club', number: '11', width: 2000, height: 1500, position: '50% 50%',
  },
  {
    src: '/gwg-sale-instructors.webp',
    alt: 'The Girls With Guns instructor team standing together at Sale Pistol Club',
    location: 'Sale', moment: 'The instructor team', number: '12', width: 2000, height: 1500, position: '50% 50%',
  },
  {
    src: '/gwg-sale-team-backs.webp',
    alt: 'The Girls With Guns team showing their branded shirts against the Sale range wall',
    location: 'Sale', moment: 'GWG on tour', number: '13', width: 2000, height: 1500, position: '50% 50%',
  },
] as const;

const galleryJournalLayouts = ['wide', 'range', 'gear', 'sweep', 'portrait', 'duo', 'closing', 'detail'] as const;

function GalleryPage() {
  const root = useRef<HTMLDivElement>(null);
  const lightbox = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const [lightHeader, setLightHeader] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const featuredImages = galleryImages.slice(0, 5);
  const journalImages = galleryImages.slice(featuredImages.length);
  const galleryCount = String(galleryImages.length).padStart(2, '0');
  const featuredCount = String(featuredImages.length).padStart(2, '0');
  const locationCount = String(new Set(galleryImages.map((image) => image.location)).size).padStart(2, '0');
  const lightboxOpen = lightboxIndex !== null;

  const featurePosition = (index: number) => {
    const distance = (index - activeFeature + featuredImages.length) % featuredImages.length;
    if (distance === 0) return 'active';
    if (distance === 1) return 'next';
    if (distance === featuredImages.length - 1) return 'previous';
    return 'hidden';
  };

  useEffect(() => {
    document.title = 'Gallery — Girls With Guns Australia';
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = 'Real moments from Girls With Guns Australia shoot days across Victoria.';
  }, []);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReduceMotion(preference.matches);
    preference.addEventListener('change', updatePreference);
    return () => preference.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (carouselPaused || reduceMotion) return;
    const timer = window.setTimeout(() => setActiveFeature((current) => (current + 1) % featuredImages.length), 5200);
    return () => window.clearTimeout(timer);
  }, [activeFeature, carouselPaused, reduceMotion, featuredImages.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => closeButton.current?.focus({ preventScroll: true }));
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxIndex(null);
      if (event.key === 'ArrowLeft') setLightboxIndex((current) => current === null ? 0 : (current - 1 + galleryImages.length) % galleryImages.length);
      if (event.key === 'ArrowRight') setLightboxIndex((current) => current === null ? 0 : (current + 1) % galleryImages.length);
      if (event.key !== 'Tab') return;
      const controls = Array.from(lightbox.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? []);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
      window.requestAnimationFrame(() => lastFocused.current?.focus({ preventScroll: true }));
    };
  }, [lightboxOpen]);

  const openLightbox = (index: number, event: MouseEvent<HTMLButtonElement>) => {
    lastFocused.current = event.currentTarget;
    setLightboxIndex(index);
  };

  const navigateSection = (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    const hash = link?.getAttribute('href');
    const destination = hash ? document.querySelector<HTMLElement>(hash) : null;
    if (!hash || !destination) return;
    event.preventDefault();
    gsap.to(window, { scrollTo: { y: destination, offsetY: 76, autoKill: true }, duration: reduceMotion ? 0 : .72, ease: 'power2.inOut', overwrite: 'auto', onComplete: () => {
      history.replaceState(null, '', hash);
      destination.focus({ preventScroll: true });
    } });
  };

  useLayoutEffect(() => {
    if (!root.current) return;
    const scope = root.current;
    const themedSections = [
      { selector: '[data-gallery-journal]', light: true },
      { selector: '[data-gallery-invitation]', light: false },
    ];
    const syncHeaderTheme = () => {
      let light = false;
      themedSections.forEach(({ selector, light: sectionLight }) => {
        const section = scope.querySelector<HTMLElement>(selector);
        if (section && section.getBoundingClientRect().top <= 77) light = sectionLight;
      });
      setLightHeader(light);
    };
    const headerTrigger = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: syncHeaderTheme, onRefresh: syncHeaderTheme });
    const headerFrame = window.requestAnimationFrame(syncHeaderTheme);
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const heroItems = scope.querySelectorAll<HTMLElement>('[data-gallery-hero-reveal]');
      const heroMedia = scope.querySelector<HTMLElement>('[data-gallery-hero-media]');
      const heroTimeline = gsap.timeline({ defaults: { ease: 'power2.out' } });
      heroTimeline.fromTo(heroItems, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .46, stagger: .07 });
      if (heroMedia) heroTimeline.fromTo(heroMedia, { opacity: 0, clipPath: 'inset(0 0 100% 0)' }, { opacity: 1, clipPath: 'inset(0 0 0% 0)', duration: .74, ease: 'power3.inOut' }, .09);

      const sectionAnimations = Array.from(scope.querySelectorAll<HTMLElement>('[data-gallery-section]')).map((section) => {
        const items = section.querySelectorAll<HTMLElement>('[data-gallery-reveal]');
        if (!items.length) return null;
        return gsap.fromTo(items, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: .44, stagger: .065, ease: 'power2.out', scrollTrigger: { trigger: section, start: 'top 84%', once: true } });
      });

      const refresh = () => ScrollTrigger.refresh();
      document.fonts.ready.then(refresh);
      window.addEventListener('load', refresh, { once: true });
      return () => {
        window.removeEventListener('load', refresh);
        heroTimeline.kill();
        sectionAnimations.forEach((animation) => animation?.kill());
      };
    }, scope);

    return () => { window.cancelAnimationFrame(headerFrame); headerTrigger.kill(); mm.revert(); };
  }, []);

  const currentLightboxImage = lightboxIndex === null ? null : galleryImages[lightboxIndex];

  return <div className="gallery-page app" ref={root} id="top" onClick={navigateSection}>
    <a className="skip-link" href="#journal">Skip to the photo journal</a>
    <Navigation light={lightHeader} currentPage="gallery" />
    <main>
      <section className="gallery-hero" id="gallery" aria-labelledby="gallery-heading" tabIndex={-1}>
        <div className="gallery-hero__inner">
          <header className="gallery-hero__copy">
            <p className="eyebrow" data-gallery-hero-reveal><span />Gallery / On the range</p>
            <h1 id="gallery-heading" data-gallery-hero-reveal>The range,<br />as it<br /><em>happened.</em></h1>
            <p data-gallery-hero-reveal>Shoot days, first targets, safety gear and the people who showed up to give it a go.</p>
            <a className="gallery-hero__jump" href="#journal" data-gallery-hero-reveal>See the full roll <Arrow /></a>
          </header>

          <div
            className={'gallery-featured' + (carouselPaused || reduceMotion ? ' gallery-featured--paused' : '')}
            data-gallery-hero-media
            onMouseEnter={() => setCarouselPaused(true)}
            onMouseLeave={() => setCarouselPaused(false)}
            onFocusCapture={() => setCarouselPaused(true)}
            onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setCarouselPaused(false); }}
          >
            <div className="gallery-featured__stage">
              {featuredImages.map((image, index) => {
                const position = featurePosition(index);
                const isActive = position === 'active';
                return <button
                  className={`gallery-featured__slide gallery-featured__slide--${position}`}
                  type="button"
                  key={image.src}
                  tabIndex={position === 'hidden' ? -1 : 0}
                  aria-hidden={position === 'hidden'}
                  aria-current={isActive ? 'true' : undefined}
                  aria-label={isActive ? `Open ${image.location}, ${image.moment} photo` : `Show ${image.location}, ${image.moment} photo`}
                  onClick={(event) => isActive ? openLightbox(index, event) : setActiveFeature(index)}
                >
                  <img src={image.src} alt={image.alt} width={image.width} height={image.height} fetchPriority={index === 0 ? 'high' : undefined} style={{ objectPosition: image.position }} />
                  <span className="gallery-featured__open">Open frame <Arrow diagonal /></span>
                </button>;
              })}
            </div>
            <div className="gallery-featured__meta">
              <p><span>{featuredImages[activeFeature].location}</span>{featuredImages[activeFeature].moment}</p>
              <div className="gallery-featured__controls">
                <span className="gallery-featured__count">{String(activeFeature + 1).padStart(2, '0')} / {featuredCount}</span>
                <button type="button" aria-label="Previous featured photo" onClick={() => setActiveFeature((activeFeature - 1 + featuredImages.length) % featuredImages.length)}>Prev</button>
                <button type="button" disabled={reduceMotion} aria-pressed={carouselPaused} onClick={() => setCarouselPaused(!carouselPaused)}>{reduceMotion ? 'Auto off' : carouselPaused ? 'Play' : 'Pause'}</button>
                <button type="button" aria-label="Next featured photo" onClick={() => setActiveFeature((activeFeature + 1) % featuredImages.length)}>Next</button>
              </div>
            </div>
            <span className="gallery-featured__progress" aria-hidden="true"><i key={activeFeature} /></span>
          </div>
        </div>
      </section>

      <section className="gallery-journal" id="journal" data-gallery-journal data-gallery-section aria-labelledby="gallery-journal-heading" tabIndex={-1}>
        <div className="gallery-journal__inner">
          <header className="gallery-journal__header">
            <p className="eyebrow eyebrow--dark" data-gallery-reveal><span />01 / The photo journal</p>
            <h2 id="gallery-journal-heading" data-gallery-reveal>A day at<br /><em>the range.</em></h2>
            <p data-gallery-reveal>There is the safety briefing, the concentration, the first shot—and then the smile when the target comes back.</p>
            <dl data-gallery-reveal><div><dt>{galleryCount}</dt><dd>Real photographs</dd></div><div><dt>{locationCount}</dt><dd>Victorian locations</dd></div></dl>
          </header>

          <div className="gallery-journal__grid">
            {journalImages.map((image, index) => [
              <figure className={`gallery-journal__item gallery-journal__item--${galleryJournalLayouts[index]}`} data-gallery-reveal key={image.src}>
                <button type="button" onClick={(event) => openLightbox(featuredImages.length + index, event)} aria-label={`Open ${image.location}, ${image.moment} photo`}>
                  <img src={image.src} alt={image.alt} width={image.width} height={image.height} loading="lazy" />
                  <span>View full frame <Arrow diagonal /></span>
                </button>
                <figcaption><span>{image.location} / {image.moment}</span><span>{image.number}</span></figcaption>
              </figure>,
              index === 0 ? <aside className="gallery-journal__note" data-gallery-reveal aria-label="Girls With Guns gallery note" key="gallery-note">
                <span>Between the frames</span>
                <p>The nerves fade.<br />The questions start.<br /><em>Then someone takes<br />the first shot.</em></p>
                <small>Come curious / Leave confident</small>
              </aside> : null,
            ])}
          </div>
        </div>
      </section>

      <section className="gallery-invitation" data-gallery-invitation data-gallery-section aria-labelledby="gallery-invitation-heading">
        <div className="gallery-invitation__inner">
          <p className="eyebrow" data-gallery-reveal><span />02 / Your turn</p>
          <h2 id="gallery-invitation-heading" data-gallery-reveal>Your turn.<br /><em>When you’re ready.</em></h2>
          <div className="gallery-invitation__copy" data-gallery-reveal>
            <p>No experience needed. Just bring your curiosity and take the first step.</p>
            <a href="/events#event"><span>View the next shoot</span><Arrow /></a>
          </div>
        </div>
      </section>
    </main>
    <SiteFooter currentPage="gallery" />

    {currentLightboxImage && <div className="gallery-lightbox" ref={lightbox} role="dialog" aria-modal="true" aria-labelledby="gallery-lightbox-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setLightboxIndex(null); }}>
      <h2 id="gallery-lightbox-title" className="visually-hidden">Gallery image viewer</h2>
      <button className="gallery-lightbox__close" ref={closeButton} type="button" onClick={() => setLightboxIndex(null)}>Close <span aria-hidden="true">×</span></button>
      <div className="gallery-lightbox__frame">
        <img key={currentLightboxImage.src} src={currentLightboxImage.src} alt={currentLightboxImage.alt} width={currentLightboxImage.width} height={currentLightboxImage.height} />
      </div>
      <div className="gallery-lightbox__footer">
        <p><strong>{currentLightboxImage.location}</strong><span>{currentLightboxImage.moment}</span></p>
        <span>{currentLightboxImage.number} / {galleryCount}</span>
        <div>
          <button type="button" onClick={() => setLightboxIndex((current) => current === null ? 0 : (current - 1 + galleryImages.length) % galleryImages.length)}>Previous</button>
          <button type="button" onClick={() => setLightboxIndex((current) => current === null ? 0 : (current + 1) % galleryImages.length)}>Next</button>
        </div>
      </div>
    </div>}
  </div>;
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
    <Navigation light={lightHeader} />
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
const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
const currentPage = currentPath === '/events' ? <EventsPage /> : currentPath === '/about' ? <AboutPage /> : currentPath === '/gallery' ? <GalleryPage /> : <App />;
rootContainer.reactRoot.render(currentPage);
