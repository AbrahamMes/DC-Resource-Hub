import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>Building Display App</h1>
        <p style={{ fontSize: '18px', color: '#a0a0a0' }}>
          Manage your ACC project data, assets, issues, and commissioning reports
        </p>
      </div>

      {/* Quick Links Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {/* Issues Card */}
        <Link to="/issues" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: '#1e1e1e',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            height: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#0696D7';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔧</div>
            <h3 style={{ color: '#fff', marginBottom: '8px', fontSize: '20px' }}>Issues</h3>
            <p style={{ color: '#a0a0a0', fontSize: '14px', lineHeight: '1.5' }}>
              View and track project issues from Autodesk Construction Cloud
            </p>
          </div>
        </Link>

        {/* Assets Card */}
        <Link to="/assets" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: '#1e1e1e',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            height: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#0696D7';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
            <h3 style={{ color: '#fff', marginBottom: '8px', fontSize: '20px' }}>Assets</h3>
            <p style={{ color: '#a0a0a0', fontSize: '14px', lineHeight: '1.5' }}>
              Manage project assets with filtering and synchronization
            </p>
          </div>
        </Link>

        {/* Buildings Card */}
        <Link to="/buildings" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: '#1e1e1e',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            height: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#0696D7';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏢</div>
            <h3 style={{ color: '#fff', marginBottom: '8px', fontSize: '20px' }}>Buildings</h3>
            <p style={{ color: '#a0a0a0', fontSize: '14px', lineHeight: '1.5' }}>
              View building layouts and location-specific information
            </p>
          </div>
        </Link>

        {/* Schedules Card */}
        <Link to="/schedules" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: '#1e1e1e',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            height: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#0696D7';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📅</div>
            <h3 style={{ color: '#fff', marginBottom: '8px', fontSize: '20px' }}>Schedules</h3>
            <p style={{ color: '#a0a0a0', fontSize: '14px', lineHeight: '1.5' }}>
              Access project schedules and timeline documents
            </p>
          </div>
        </Link>

        {/* Contacts Card */}
        <Link to="/contacts" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: '#1e1e1e',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            height: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#0696D7';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
            <h3 style={{ color: '#fff', marginBottom: '8px', fontSize: '20px' }}>Contacts</h3>
            <p style={{ color: '#a0a0a0', fontSize: '14px', lineHeight: '1.5' }}>
              Find contact information for project team members
            </p>
          </div>
        </Link>

        {/* Commissioning Card */}
        <Link to="/commissioning" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: '#1e1e1e',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            height: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#0696D7';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
            <h3 style={{ color: '#fff', marginBottom: '8px', fontSize: '20px' }}>Commissioning</h3>
            <p style={{ color: '#a0a0a0', fontSize: '14px', lineHeight: '1.5' }}>
              Submit and track commissioning reports and logs
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
