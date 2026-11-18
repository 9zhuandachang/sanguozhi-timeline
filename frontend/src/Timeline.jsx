import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BookOpen, Compass, Sparkles, X } from 'lucide-react';
import './index.css';

gsap.registerPlugin(ScrollTrigger);

const NUM_CN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
function toCnYear(n) {
  if (n <= 1) return '元';
  if (n <= 10) return NUM_CN[n];
  if (n < 20) return '十' + NUM_CN[n - 10];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return NUM_CN[tens] + '十' + (ones ? NUM_CN[ones] : '');
}

function findEra(year, list) {
  for (let i = list.length - 1; i >= 0; i--) {
    if (year >= list[i][1]) {
      return `${list[i][0]}${toCnYear(year - list[i][1] + 1)}年`;
    }
  }
  return null;
}

const HAN_ERAS = [
  ['永寿', 155], ['延熹', 158], ['永康', 167], ['建宁', 168], ['熹平', 172],
  ['光和', 178], ['中平', 184], ['初平', 190], ['兴平', 194], ['建安', 196]
];
const WEI_ERAS = [
  ['黄初', 220], ['太和', 227], ['青龙', 233], ['景初', 237], ['正始', 240],
  ['嘉平', 249], ['正元', 254], ['甘露', 256], ['景元', 260], ['咸熙', 264]
];
const SHU_ERAS = [
  ['章武', 221], ['建兴', 223], ['延熙', 238], ['景耀', 258], ['炎兴', 263]
];
const WU_ERAS = [
  ['黄武', 222], ['黄龙', 229], ['嘉禾', 232], ['赤乌', 238], ['太元', 251],
  ['建兴', 252], ['五凤', 254], ['太平', 256], ['永安', 258], ['元兴', 264], ['甘露', 265]
];

function getHistoricalEraLabel(year) {
  if (year < 220) {
    const han = findEra(year, HAN_ERAS);
    return han ? `东汉 · ${han}` : '';
  }
  if (year >= 265) {
    return `西晋泰始${toCnYear(year - 265 + 1)}年 · 吴${findEra(year, WU_ERAS)}`;
  }
  const parts = [];
  const wei = findEra(year, WEI_ERAS);
  if (wei) parts.push(`魏${wei}`);
  if (year >= 221 && year <= 263) {
    const shu = findEra(year, SHU_ERAS);
    if (shu) parts.push(`蜀${shu}`);
  }
  if (year >= 222) {
    const wu = findEra(year, WU_ERAS);
    if (wu) parts.push(`吴${wu}`);
  }
  return parts.join(' · ');
}

const FACTION_META = {
  '魏': { cls: 'faction-wei', label: '魏' },
  '蜀': { cls: 'faction-shu', label: '蜀' },
  '吴': { cls: 'faction-wu', label: '吴' },
  '其他': { cls: 'faction-other', label: '汉' }
};

const ERA_MILESTONES = [
  { label: '汉末风云', year: 184 },
  { label: '官渡赤壁', year: 200 },
  { label: '三国鼎立', year: 220 },
  { label: '北伐中原', year: 228 },
  { label: '天下归晋', year: 263 }
];

const shortSourceName = (src = '') => src.replace(/(第一|第二|第三|第四)$/, '');

const EventCard = ({ event, excerpt, onClick, isLeft }) => {
  const factionKey = event.factions && event.factions.length > 0 ? event.factions[0] : '其他';
  const meta = FACTION_META[factionKey] || FACTION_META['其他'];
  const importance = event.importance || 1;

  return (
    <div className={`event-item ${isLeft ? 'left-col' : 'right-col'} ${meta.cls} imp-${importance}`}>
      <div className="event-axis-dot" />
      <div className="event-connector" />

      <article className="event-card" onClick={() => onClick(event)}>
        <div className="event-card-meta">
          <span className={`faction-seal serif ${meta.cls}`}>{meta.label}</span>
          {event.character && <span className="event-char serif">{event.character}</span>}
          <span className="meta-dot">·</span>
          <span className="event-source serif">《{shortSourceName(event.source)}》</span>
          {importance === 3 && (
            <span className="major-badge serif">
              <Sparkles size={11} />
              要事
            </span>
          )}
        </div>

        <h3 className="event-card-title serif">{event.title}</h3>

        {excerpt && (
          <p className="event-card-excerpt serif">{excerpt}</p>
        )}
      </article>
    </div>
  );
};

const EventModal = ({ event, volumeDataMap, onClose }) => {
  const modalRef = useRef(null);
  const contentRef = useRef(null);
  const navigate = useNavigate();

  const source = event.source || '武帝纪第一';
  const volumeData = volumeDataMap[source];
  const originalText = volumeData ? volumeData.content[event.paragraphIndex] : '';
  const factionKey = event.factions && event.factions.length > 0 ? event.factions[0] : '其他';
  const meta = FACTION_META[factionKey] || FACTION_META['其他'];
  const eraText = getHistoricalEraLabel(event.year);

  useEffect(() => {
    gsap.fromTo(
      modalRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.28, ease: 'power2.out' }
    );
    gsap.fromTo(
      contentRef.current,
      { opacity: 0, y: 20, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power3.out' }
    );

    const onKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleClose = () => {
    gsap.to(modalRef.current, { opacity: 0, duration: 0.22, ease: 'power2.in' });
    gsap.to(contentRef.current, {
      opacity: 0,
      y: 14,
      scale: 0.97,
      duration: 0.22,
      ease: 'power2.in',
      onComplete: onClose
    });
  };

  const handleGoToVolume = () => {
    ScrollTrigger.getAll().forEach(t => t.kill());
    document.body.style.overflow = 'auto';
    document.body.style.position = '';
    document.body.style.top = '';
    window.scrollTo(0, 0);
    navigate(`/volume/${encodeURIComponent(source)}?p=${event.paragraphIndex}`);
  };

  return (
    <div className="modal-overlay" ref={modalRef} onClick={handleClose}>
      <div className={`modal-content ${meta.cls}`} ref={contentRef} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose} aria-label="关闭">
          <X size={22} />
        </button>

        <div className="modal-header">
          <div className="modal-meta-row">
            <span className={`faction-seal serif ${meta.cls}`}>{meta.label}</span>
            {event.character && <span className="modal-char serif">{event.character}</span>}
            <span className="meta-dot">·</span>
            <span className="modal-year serif">公元 {event.year} 年</span>
            {eraText && (
              <>
                <span className="meta-dot">·</span>
                <span className="modal-era serif">{eraText}</span>
              </>
            )}
          </div>
          <h2 className="modal-title serif">{event.title}</h2>
        </div>

        <div className="modal-divider" />

        <div className="modal-body">
          <p className="modal-text serif">{originalText}</p>
        </div>

        <div className="modal-footer-bar">
          <span className="modal-source-note serif">
            出自陈寿《三国志·{source}》第 {event.paragraphIndex + 1} 段
          </span>
          <button className="modal-goto-btn serif" onClick={handleGoToVolume}>
            <BookOpen size={16} />
            <span>展卷精读全文</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const Timeline = () => {
  const viewportRef = useRef(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventsData, setEventsData] = useState([]);
  const [volumeDataMap, setVolumeDataMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeFaction, setActiveFaction] = useState('ALL');

  useEffect(() => {
    const loadData = async () => {
      try {
        const sources = [
          '武帝纪第一',
          '文帝纪第二',
          '明帝纪第三',
          '少帝纪第四',
          '先主传第二',
          '后主传第三',
          '孙破虏讨逆传第一',
          '吴主传第二'
        ];

        const eventsPromises = sources.map(s => fetch(`/data/timeline/${s}_timeline.json`).then(r => r.json()));
        const volumesPromises = sources.map(s => fetch(`/data/volumes/${s}.json`).then(r => r.json()));

        const [eventsResults, volumesResults] = await Promise.all([
          Promise.all(eventsPromises),
          Promise.all(volumesPromises)
        ]);

        let allEvents = [];
        eventsResults.forEach(arr => {
          allEvents = allEvents.concat(arr);
        });

        allEvents.sort((a, b) => a.year - b.year || b.importance - a.importance);

        const volMap = {};
        sources.forEach((s, idx) => {
          volMap[s] = volumesResults[idx];
        });

        setEventsData(allEvents);
        setVolumeDataMap(volMap);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const factionCounts = useMemo(() => {
    const counts = { ALL: eventsData.length, '魏': 0, '蜀': 0, '吴': 0 };
    eventsData.forEach(e => {
      const f = e.factions?.[0];
      if (counts[f] !== undefined) counts[f] += 1;
    });
    return counts;
  }, [eventsData]);

  const filteredEvents = useMemo(() => {
    if (activeFaction === 'ALL') return eventsData;
    return eventsData.filter(e => e.factions && e.factions.includes(activeFaction));
  }, [eventsData, activeFaction]);

  const yearGroups = useMemo(() => {
    const map = new Map();
    filteredEvents.forEach(ev => {
      if (!map.has(ev.year)) map.set(ev.year, []);
      map.get(ev.year).push(ev);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, events]) => ({
        year,
        eraLabel: getHistoricalEraLabel(year),
        events
      }));
  }, [filteredEvents]);

  useEffect(() => {
    if (loading || yearGroups.length === 0) return;

    const ctx = gsap.context(() => {
      const segments = gsap.utils.toArray('.year-block');
      segments.forEach((seg) => {
        gsap.fromTo(
          seg,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: seg,
              start: 'top 92%',
              toggleActions: 'play none none none'
            }
          }
        );
      });
    }, viewportRef);

    return () => ctx.revert();
  }, [loading, activeFaction, yearGroups.length]);

  const scrollToMilestone = (targetYear) => {
    if (yearGroups.length === 0) return;
    let closest = yearGroups[0].year;
    let minDiff = Math.abs(closest - targetYear);
    for (const g of yearGroups) {
      const diff = Math.abs(g.year - targetYear);
      if (diff < minDiff) {
        minDiff = diff;
        closest = g.year;
      }
    }
    const el = document.getElementById(`year-${closest}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="timeline-viewport loading-screen">
        <div className="loading-emblem serif">三国志</div>
        <p className="loading-sub serif">正在校勘八卷本纪史料…</p>
      </div>
    );
  }

  let runningIndex = 0;

  return (
    <div className="timeline-viewport" ref={viewportRef}>
      <header className="timeline-hero">
        <div className="hero-ornament serif">〔 陈寿撰 · 帝王本纪编年长卷 〕</div>
        <h1 className="timeline-title serif">三国志</h1>
        <p className="timeline-subtitle serif">
          自汉桓帝永寿元年（155）至晋武帝泰始元年（265） · 共辑录 {eventsData.length} 则本纪史事
        </p>
      </header>

      <nav className="timeline-toolbar" aria-label="时间轴筛选与导览">
        <div className="toolbar-group faction-filters">
          {[
            { key: 'ALL', label: '全史总览', cls: 'all' },
            { key: '魏', label: '曹魏本纪', cls: 'faction-wei' },
            { key: '蜀', label: '蜀汉二主', cls: 'faction-shu' },
            { key: '吴', label: '东吴孙氏', cls: 'faction-wu' }
          ].map(item => (
            <button
              key={item.key}
              className={`filter-pill serif ${item.cls} ${activeFaction === item.key ? 'active' : ''}`}
              onClick={() => setActiveFaction(item.key)}
            >
              {item.key !== 'ALL' && <span className={`pill-dot ${item.cls}`} />}
              <span>{item.label}</span>
              <span className="pill-count">{factionCounts[item.key]}</span>
            </button>
          ))}
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group era-jumps">
          <span className="jump-icon" title="时代快速跳转">
            <Compass size={14} />
          </span>
          {ERA_MILESTONES.map(ms => (
            <button
              key={ms.year}
              className="era-jump-btn serif"
              onClick={() => scrollToMilestone(ms.year)}
            >
              {ms.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="timeline-track-container">
        <div className="timeline-track-line" />

        {yearGroups.map((group) => (
          <section key={group.year} id={`year-${group.year}`} className="year-block">
            <div className="year-plaque">
              <div className="year-plaque-inner">
                <span className="year-ad serif">公元 {group.year} 年</span>
                {group.eraLabel && (
                  <span className="year-era serif">{group.eraLabel}</span>
                )}
              </div>
            </div>

            <div className="events-grid">
              {group.events.map((event, idx) => {
                const isLeft = runningIndex % 2 === 0;
                runningIndex += 1;
                const vol = volumeDataMap[event.source];
                const rawPara = vol?.content?.[event.paragraphIndex] || '';
                const excerpt = rawPara.length > 54 ? `${rawPara.slice(0, 54)}…` : rawPara;

                return (
                  <EventCard
                    key={`${event.source}-${event.paragraphIndex}-${idx}`}
                    event={event}
                    excerpt={excerpt}
                    onClick={setSelectedEvent}
                    isLeft={isLeft}
                  />
                );
              })}
            </div>
          </section>
        ))}

        <div className="timeline-terminus">
          <span className="terminus-mark serif">卷终 · 三国归晋</span>
        </div>
      </main>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          volumeDataMap={volumeDataMap}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};
