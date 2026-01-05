import React, { useState, useEffect, useRef } from "react";

export default function ImageCarousel({ slides, autoRotateInterval = 5000 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);

  // Reset the auto-rotation timer
  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, autoRotateInterval);
  };

  // Auto-rotation effect
  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [slides.length, autoRotateInterval]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? slides.length - 1 : prevIndex - 1
    );
    resetTimer();
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    resetTimer();
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    resetTimer();
  };

  if (!slides || slides.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#a0a0a0'
      }}>
        No slides available
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '600px',
      backgroundColor: '#1e1e1e',
      border: '1px solid #333',
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Slide Content with smooth transition */}
      {slides.map((slide, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 20px 60px 20px',
            opacity: index === currentIndex ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out',
            pointerEvents: index === currentIndex ? 'auto' : 'none'
          }}
        >
          {slide.content}
        </div>
      ))}

      {/* Left Arrow */}
      <button
        onClick={goToPrevious}
        style={{
          position: 'absolute',
          left: '30px',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#0696D7',
          fontSize: '72px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          zIndex: 10,
          padding: '0',
          lineHeight: '1',
          textShadow: '0 0 10px rgba(0, 0, 0, 0.8)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.transform = 'translateY(-50%) translateX(-5px) scale(1.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#0696D7';
          e.currentTarget.style.transform = 'translateY(-50%) translateX(0) scale(1)';
        }}
      >
        ‹
      </button>

      {/* Right Arrow */}
      <button
        onClick={goToNext}
        style={{
          position: 'absolute',
          right: '30px',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#0696D7',
          fontSize: '72px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          zIndex: 10,
          padding: '0',
          lineHeight: '1',
          textShadow: '0 0 10px rgba(0, 0, 0, 0.8)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.transform = 'translateY(-50%) translateX(5px) scale(1.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#0696D7';
          e.currentTarget.style.transform = 'translateY(-50%) translateX(0) scale(1)';
        }}
      >
        ›
      </button>

      {/* Indicator Dots */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '10px',
        zIndex: 10
      }}>
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              border: '2px solid #0696D7',
              backgroundColor: index === currentIndex ? '#0696D7' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.3s',
              padding: 0,
              outline: 'none'
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide Label (optional) */}
      {slides[currentIndex].label && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '8px 16px',
          borderRadius: '4px',
          color: '#fff',
          fontSize: '14px',
          fontWeight: '500',
          zIndex: 10
        }}>
          {slides[currentIndex].label}
        </div>
      )}
    </div>
  );
}
