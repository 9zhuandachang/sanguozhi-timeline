import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { ArrowLeft } from 'lucide-react';
import { GalleryBackground } from './GalleryBackground';
import './index.css';

export const VolumePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { volumeName } = useParams();
  const containerRef = useRef(null);

  const [volumeData, setVolumeData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Get the highlight paragraph index from URL query params
  const searchParams = new URLSearchParams(location.search);
  const initialHighlight = searchParams.get('p') ? parseInt(searchParams.get('p')) : null;
  
  // Track which paragraph is currently highlighted
  const [activeIndex, setActiveIndex] = useState(initialHighlight);

  // Dynamic data loading
  useEffect(() => {
    const loadVolume = async () => {
      try {
        const name = decodeURIComponent(volumeName);
        const res = await fetch(`/data/volumes/${name}.json`);
        const data = await res.json();
        setVolumeData(data);
      } catch (err) {
        console.error('Failed to load volume:', err);
      } finally {
        setLoading(false);
      }
    };
    loadVolume();
  }, [volumeName]);

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: "power2.out" }
    );
  }, [loading]);

  // Scroll to the highlighted paragraph after data loads
  useEffect(() => {
    if (loading || !volumeData || initialHighlight === null) return;
    setTimeout(() => {
      const el = document.getElementById(`para-${initialHighlight}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 800);
  }, [loading, volumeData, initialHighlight]);

  if (loading || !volumeData) {
    return (
      <>
        <GalleryBackground />
        <div className="volume-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <h2 className="serif" style={{ color: 'var(--highlight-gold)', opacity: 0.6 }}>载入原文中…</h2>
        </div>
      </>
    );
  }

  return (
    <>
      <GalleryBackground />
      <div className="volume-page" ref={containerRef}>
        <button className="volume-back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          <span className="serif">返回时间轴</span>
        </button>

        <div className="volume-container">
          <div className="volume-header">
            <h1 className="volume-title serif">{volumeData.volume}</h1>
            <div className="volume-divider"></div>
            <p className="volume-source serif">《三国志》</p>
          </div>

          <div className="volume-body">
            {volumeData.content.map((paragraph, index) => (
              <p
                key={index}
                id={`para-${index}`}
                className={`volume-paragraph serif ${activeIndex === index ? 'highlighted' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
