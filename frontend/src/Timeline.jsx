import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { X } from 'lucide-react';
import './index.css';

gsap.registerPlugin(ScrollTrigger);

const EventLabel = ({ event, onClick, isLeft }) => {
  const faction = event.factions && event.factions.length > 0 ? event.factions[0] : '其他';
  let factionClass = 'faction-other';
  if (faction === '蜀') factionClass = 'faction-shu';
  else if (faction === '吴') factionClass = 'faction-wu';
  else if (faction === '魏') factionClass = 'faction-wei';

  return (
    <div className={`event-label-wrapper ${isLeft ? 'left-side' : 'right-side'}`}>
      <div className="event-content" onClick={() => onClick(event)}>
        <div className={`event-title-text serif ${factionClass}`}>
          {event.title}
        </div>
      </div>
      <div className="event-pointer-line"></div>
      <div className="event-track-notch"></div>
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

  useEffect(() => {
    gsap.fromTo(modalRef.current, 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.4, ease: "power2.out" }
    );
    gsap.fromTo(contentRef.current,
      { opacity: 0, y: 30, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.2)", delay: 0.1 }
    );

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleClose = () => {
    gsap.to(modalRef.current, { opacity: 0, duration: 0.3, ease: "power2.in" });
    gsap.to(contentRef.current, { opacity: 0, y: 20, scale: 0.95, duration: 0.3, ease: "power2.in", onComplete: onClose });
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
      <div className="modal-content" ref={contentRef} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>
          <X size={28} />
        </button>
        
        <div className="modal-header">
          <span className="modal-year serif">公元 {event.year} 年</span>
          <h2 className="modal-title serif">{event.title}</h2>
        </div>
        
        <div className="modal-divider"></div>
        
        <div className="modal-body">
          <p className="modal-text serif">{originalText}</p>
        </div>
        
        <div className="modal-footer-link serif" onClick={handleGoToVolume}>
          — 《三国志·{source}》 第 {event.paragraphIndex + 1} 段 →
        </div>
      </div>
    </div>
  );
};

export const Timeline = () => {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventsData, setEventsData] = useState([]);
  const [volumeDataMap, setVolumeDataMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Dynamic data loading
  useEffect(() => {
    const loadData = async () => {
      try {
        const sources = [
          "武帝纪第一",
          "文帝纪第二",
          "明帝纪第三",
          "少帝纪第四",
          "先主传第二",
          "后主传第三",
          "孙破虏讨逆传第一",
          "吴主传第二"
        ];

        const eventsPromises = sources.map(s => fetch(`/data/timeline/${s}_timeline.json`).then(r => r.json()));
        const volumesPromises = sources.map(s => fetch(`/data/volumes/${s}.json`).then(r => r.json()));

        const eventsResults = await Promise.all(eventsPromises);
        const volumesResults = await Promise.all(volumesPromises);

        let allEvents = [];
        eventsResults.forEach(arr => {
          allEvents = allEvents.concat(arr);
        });
        
        // Sort events chronologically
        allEvents.sort((a, b) => a.year - b.year);

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

  const uniqueYears = [...new Set(eventsData.map(e => e.year))].sort((a, b) => a - b);
  const segments = [];

  for (let i = 0; i < uniqueYears.length; i++) {
    const currentYear = uniqueYears[i];
    
    segments.push({
      id: `event-${currentYear}`,
      type: 'event',
      yearMarker: currentYear,
      events: eventsData.filter(e => e.year === currentYear)
    });

    if (i < uniqueYears.length - 1) {
      const nextYear = uniqueYears[i+1];
      if (nextYear > currentYear + 1) {
        segments.push({
          id: `gap-${currentYear + 1}-${nextYear}`,
          type: 'gap',
          yearMarker: currentYear + 1,
        });
      }
    }
  }

  const finalYear = uniqueYears.length > 0 ? uniqueYears[uniqueYears.length - 1] + 1 : 0;

  // GSAP Vertical scroll setup
  useEffect(() => {
    if (loading || eventsData.length === 0) return;

    const timer = setTimeout(() => {
      const labels = gsap.utils.toArray('.event-label-wrapper');
      labels.forEach((label) => {
        gsap.fromTo(label, 
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: label,
              start: "top 90%",
              toggleActions: "play none none reverse"
            }
          }
        );
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [loading, eventsData]);

  if (loading) {
    return (
      <div className="timeline-viewport" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2 className="serif" style={{ color: 'var(--highlight-gold)', opacity: 0.6 }}>载入史料中…</h2>
      </div>
    );
  }

  return (
    <div className="timeline-viewport" ref={viewportRef}>
      <div className="timeline-header">
        <h1 className="timeline-title serif">三国志</h1>
        <p className="timeline-subtitle serif">帝王本纪史料聚合索引</p>
      </div>

      <div className="timeline-track-container" ref={trackRef}>
        <div className="timeline-track-line"></div>

        {segments.map((segment) => {
          if (segment.type === 'event') {
            return (
              <div key={segment.id} className="year-segment">
                <div className="year-marker-center">
                  <span className="year-label bright serif">公元 {segment.yearMarker} 年</span>
                </div>
                <div className="events-column">
                  {segment.events.map((event, idx) => (
                    <EventLabel 
                      key={`${event.paragraphIndex}-${idx}`} 
                      event={event} 
                      onClick={setSelectedEvent} 
                      isLeft={idx % 2 === 0}
                    />
                  ))}
                </div>
              </div>
            );
          } else {
            return (
              <div key={segment.id} className="year-segment gap-segment">
                <div className="year-marker-center">
                  <span className="year-label dim serif">公元 {segment.yearMarker} 年</span>
                </div>
              </div>
            );
          }
        })}

        <div className="year-segment final-segment">
          <div className="year-marker-center">
            <span className="year-label bright serif">公元 {finalYear} 年</span>
          </div>
        </div>
      </div>

      {selectedEvent && (
        <EventModal event={selectedEvent} volumeDataMap={volumeDataMap} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
};
