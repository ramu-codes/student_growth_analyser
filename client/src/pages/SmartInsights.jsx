import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Dashboard.css';

const SmartInsights = () => {
  const [insightsResult, setInsightsResult] = useState(null);
  const [roadmapResult, setRoadmapResult] = useState(null);
  const [recommendationsResult, setRecommendationsResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAI = async () => {
      try {
        const [resInsights, resRoadmap, resRecommendations] = await Promise.all([
          api.get('/ai/insights'),
          api.get('/ai/roadmap'),
          api.get('/ai/recommendations')
        ]);
        
        setInsightsResult(resInsights.data?.insights || []);
        setRoadmapResult(resRoadmap.data?.roadmap || []);
        setRecommendationsResult(resRecommendations.data?.recommendations || []);
      } catch (error) {
        toast.error('AI Service unavailable — make sure Flask ML server is running on port 8000');
      } finally {
        setLoading(false);
      }
    };
    fetchAI();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Generating AI Insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Smart Insights Engine</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Performance Insights */}
        <div className="metric-card" style={{ gridColumn: 'span 2' }}>
          <h3>📊 Performance Insights</h3>
          {insightsResult && insightsResult.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {insightsResult.map((inc, i) => (
                <div key={i} style={{ 
                  padding: '14px 16px', 
                  background: 'rgba(74, 222, 128, 0.06)',
                  borderLeft: '3px solid var(--success)',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  lineHeight: '1.5'
                }}>
                  {inc}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>Log more marks to generate insights!</p>
          )}
        </div>

        {/* Recommendations */}
        <div className="metric-card">
          <h3>🤖 AI Recommendations</h3>
          {recommendationsResult && recommendationsResult.length > 0 ? (
            <ul style={{ paddingLeft: '18px', marginTop: '12px' }}>
              {recommendationsResult.map((rec, i) => (
                <li key={i} style={{ 
                  marginBottom: '12px', 
                  color: 'var(--text-primary)', 
                  fontSize: '0.9rem', 
                  lineHeight: '1.5' 
                }}>
                  {rec}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>Need more data for recommendations.</p>
          )}
        </div>
        
        {/* Study Roadmap */}
        <div className="metric-card">
          <h3>🗺️ Study Roadmap</h3>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {roadmapResult && roadmapResult.length > 0 ? roadmapResult.map((rm, i) => (
              <div key={i} style={{ 
                padding: '12px 14px', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-primary)',
                transition: 'var(--transition)'
              }}>
                <strong style={{ 
                  color: 'var(--accent-gold)', 
                  display: 'block', 
                  marginBottom: '4px',
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontSize: '1rem'
                }}>
                  {rm.week}
                </strong>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{rm.task}</span>
              </div>
            )) : (
              <p style={{ color: 'var(--text-secondary)' }}>No roadmap available yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartInsights;
