import React from "react";
import ImageCarousel from "../components/ImageCarousel";
import TopIssuesSlide from "../components/TopIssuesSlide";

export default function Home() {
  // Define carousel slides
  const slides = [
    {
      label: "Project Schedule",
      content: (
        <img
          src="/src/assets/TXESchedule_20251210.jpg"
          alt="Project Schedule"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
        />
      )
    },
    {
      label: "Top 3 Issues",
      content: <TopIssuesSlide />
    },
    {
      label: "Placeholder 1",
      content: (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          color: '#a0a0a0'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏗️</div>
          <h3 style={{ color: '#fff', marginBottom: '8px' }}>Coming Soon</h3>
          <p>Additional content will be displayed here</p>
        </div>
      )
    },
    {
      label: "Placeholder 2",
      content: (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          color: '#a0a0a0'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ color: '#fff', marginBottom: '8px' }}>Coming Soon</h3>
          <p>Additional content will be displayed here</p>
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>Building Display App</h1>
        <p style={{ fontSize: '18px', color: '#a0a0a0' }}>
          Manage your ACC project data, assets, issues, and commissioning reports
        </p>
      </div>

      {/* Image Carousel */}
      <ImageCarousel slides={slides} autoRotateInterval={5000} />
    </div>
  );
}
