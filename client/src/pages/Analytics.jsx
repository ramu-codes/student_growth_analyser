import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Bar, Line } from 'react-chartjs-2';
import 'chart.js/auto';
import './Dashboard.css';

const Analytics = () => {
  const [trends, setTrends] = useState(null);
  const [semesterData, setSemesterData] = useState(null);
  const [selectedSem, setSelectedSem] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const [trendsRes, semRes] = await Promise.all([
          api.get('/analysis/trends'),
          api.get('/analysis/semester-breakdown'),
        ]);
        setTrends(trendsRes.data);
        setSemesterData(semRes.data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, []);

  if (loading) return <div className="loading-state">Loading Analytics...</div>;

  if (!trends || !semesterData) return (
    <div className="dashboard-container">
      <div className="metric-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h3>No Performance Data</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Add marks first to see analytics.</p>
      </div>
    </div>
  );

  // --- Chart Configs ---
  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { color: 'rgba(247,244,239,0.5)', font: { size: 11 } }, grid: { color: 'rgba(201,169,110,0.07)' } },
      y: { ticks: { color: 'rgba(247,244,239,0.5)' }, grid: { color: 'rgba(201,169,110,0.07)' }, beginAtZero: true, max: 100 },
    },
    plugins: { legend: { labels: { color: '#F7F4EF', font: { size: 12 } } } },
  };

  // Subject-wise bar chart (filtered by semester)
  const filteredSubjects = selectedSem === 'all'
    ? trends.subjectAverages
    : trends.subjectAverages.filter(s => semesterData.semesters.find(sem => sem.semester === selectedSem)?.subjects?.includes(s.subject));

  const barData = {
    labels: (selectedSem === 'all' ? trends.subjectAverages : getSemSubjects()).map(s => s.subject.length > 15 ? s.subject.slice(0, 15) + '…' : s.subject),
    datasets: [{
      label: 'Average %',
      data: (selectedSem === 'all' ? trends.subjectAverages : getSemSubjects()).map(s => parseFloat(s.average)),
      backgroundColor: (selectedSem === 'all' ? trends.subjectAverages : getSemSubjects()).map(s =>
        parseFloat(s.average) >= 80 ? 'rgba(74, 222, 128, 0.5)' :
          parseFloat(s.average) >= 60 ? 'rgba(201, 169, 110, 0.5)' : 'rgba(248, 113, 113, 0.5)'
      ),
      borderColor: (selectedSem === 'all' ? trends.subjectAverages : getSemSubjects()).map(s =>
        parseFloat(s.average) >= 80 ? '#4ADE80' :
          parseFloat(s.average) >= 60 ? '#C9A96E' : '#F87171'
      ),
      borderWidth: 2,
      borderRadius: 6,
    }]
  };

  function getSemSubjects() {
    const sem = semesterData.semesters.find(s => s.semester === selectedSem);
    if (!sem) return [];
    return sem.subjectDetails;
  }

  // SGPA Trend line chart
  const sgpaLineData = {
    labels: semesterData.semesters.map(s => s.semester),
    datasets: [
      {
        label: 'SGPA',
        data: semesterData.semesters.map(s => s.sgpa),
        borderColor: '#C9A96E',
        backgroundColor: 'rgba(201, 169, 110, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: semesterData.semesters.map((s, i) => {
          if (i === 0) return '#C9A96E';
          return s.sgpa >= semesterData.semesters[i - 1].sgpa ? '#4ADE80' : '#F87171';
        }),
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Semester %',
        data: semesterData.semesters.map(s => s.percentage),
        borderColor: '#60A5FA',
        backgroundColor: 'rgba(96, 165, 250, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        borderDash: [5, 5],
      }
    ]
  };

  const sgpaOpts = {
    ...chartOpts,
    scales: {
      ...chartOpts.scales,
      y: { ...chartOpts.scales.y, max: undefined, beginAtZero: false },
    }
  };

  // Semester change indicators
  const semChanges = semesterData.semesters.map((s, i) => {
    if (i === 0) return { ...s, change: 0, direction: 'start' };
    const diff = (s.percentage - semesterData.semesters[i - 1].percentage).toFixed(1);
    return { ...s, change: diff, direction: diff >= 0 ? 'up' : 'down' };
  });

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Performance Analytics</h1>

      {/* Stats Row */}
      <div className="stats-container">
        <div className="stat-card">
          <h4>Class Rank</h4>
          <h2>{trends.rank} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/ {trends.totalStudents}</span></h2>
        </div>
        <div className="stat-card">
          <h4>Percentile</h4>
          <h2>{trends.percentile}%</h2>
        </div>
        <div className="stat-card">
          <h4>Class Average</h4>
          <h2>{trends.classAverage}%</h2>
        </div>
        <div className="stat-card">
          <h4>Your Overall</h4>
          <h2>{trends.overallPercentage}%</h2>
        </div>
      </div>

      {/* Semester Progress Cards */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--accent-gold)', fontSize: '1.4rem', marginBottom: '1rem' }}>
          Semester Journey
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {semChanges.map((s, i) => (
            <div key={i} className="stat-card" style={{
              borderColor: s.direction === 'up' ? 'rgba(74,222,128,0.3)' : s.direction === 'down' ? 'rgba(248,113,113,0.3)' : 'var(--border-subtle)',
              cursor: 'pointer',
              background: selectedSem === s.semester ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
            }}
              onClick={() => setSelectedSem(selectedSem === s.semester ? 'all' : s.semester)}>
              <h4>{s.semester}</h4>
              <h2 style={{ fontSize: '1.6rem' }}>{s.percentage.toFixed(1)}%</h2>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', marginTop: '0.3rem' }}>
                {s.direction === 'start' && <span style={{ color: 'var(--info)' }}>Baseline</span>}
                {s.direction === 'up' && <span style={{ color: 'var(--success)' }}>▲ +{s.change}%</span>}
                {s.direction === 'down' && <span style={{ color: 'var(--danger)' }}>▼ {s.change}%</span>}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                SGPA: {s.sgpa}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SGPA Trend */}
      <div className="chart-container" style={{ marginBottom: '1.5rem' }}>
        <h3>SGPA & Performance Trend</h3>
        <div style={{ height: '300px' }}>
          <Line data={sgpaLineData} options={sgpaOpts} />
        </div>
      </div>

      {/* Subject Chart with Semester Filter */}
      <div className="chart-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ margin: 0 }}>
            Subject-Wise Performance {selectedSem !== 'all' ? `(${selectedSem})` : '(All Semesters)'}
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedSem('all')}
              style={{
                padding: '0.3rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)',
                background: selectedSem === 'all' ? 'var(--accent-gold)' : 'transparent',
                color: selectedSem === 'all' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}>All</button>
            {semesterData.semesters.map(s => (
              <button key={s.semester}
                onClick={() => setSelectedSem(s.semester)}
                style={{
                  padding: '0.3rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)',
                  background: selectedSem === s.semester ? 'var(--accent-gold)' : 'transparent',
                  color: selectedSem === s.semester ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}>{s.semester}</button>
            ))}
          </div>
        </div>
        <div style={{ height: '350px' }}>
          <Bar data={barData} options={chartOpts} />
        </div>
      </div>

      {/* Semester Detail Table */}
      {selectedSem !== 'all' && (() => {
        const sem = semesterData.semesters.find(s => s.semester === selectedSem);
        if (!sem) return null;
        return (
          <div className="metric-card" style={{ marginTop: '1.5rem' }}>
            <h3>{selectedSem} — Detailed Breakdown</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr>
                    {['Subject', 'Mid', 'End', 'Total', '%', 'Status'].map(h => (
                      <th key={h} style={{
                        textAlign: 'left', padding: '0.7rem 1rem', borderBottom: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                        fontFamily: 'var(--font-body)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sem.subjectDetails.map((s, i) => {
                    const pct = parseFloat(s.average);
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(201,169,110,0.07)' }}>
                        <td style={{ padding: '0.7rem 1rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{s.subject}</td>
                        <td style={{ padding: '0.7rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.midScore ?? '—'}/{s.midMax ?? '—'}</td>
                        <td style={{ padding: '0.7rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.endScore ?? '—'}/{s.endMax ?? '—'}</td>
                        <td style={{ padding: '0.7rem 1rem', color: 'var(--text-primary)', fontWeight: '600' }}>{s.totalScore}/{s.totalMax}</td>
                        <td style={{ padding: '0.7rem 1rem', color: pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--accent-gold)' : 'var(--danger)', fontWeight: '700' }}>
                          {pct.toFixed(1)}%
                        </td>
                        <td style={{ padding: '0.7rem 1rem' }}>
                          <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.7rem', fontWeight: '700',
                            background: pct >= 80 ? 'rgba(74,222,128,0.1)' : pct >= 60 ? 'rgba(201,169,110,0.1)' : 'rgba(248,113,113,0.1)',
                            color: pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--accent-gold)' : 'var(--danger)',
                          }}>
                            {pct >= 80 ? 'EXCELLENT' : pct >= 60 ? 'GOOD' : 'NEEDS WORK'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Marks</div>
                <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', color: 'var(--accent-gold)' }}>{sem.totalScore}/{sem.totalMax}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Percentage</div>
                <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', color: 'var(--accent-gold)' }}>{sem.percentage.toFixed(2)}%</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>SGPA</div>
                <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', color: 'var(--accent-gold)' }}>{sem.sgpa}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Subjects</div>
                <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', color: 'var(--accent-gold)' }}>{sem.subjectCount}</div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Analytics;
