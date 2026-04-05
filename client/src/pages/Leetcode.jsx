import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { setupCharts } from '../services/chartConfig.js';
import LeetcodeWinningCard3D from '../components/LeetcodeWinningCard3D.jsx';
import './Leetcode.css';

setupCharts();

const chartScales = {
  x: { ticks: { color: 'rgba(247,244,239,0.5)', maxRotation: 45, minRotation: 0 } },
  y: { ticks: { color: 'rgba(247,244,239,0.5)' }, grid: { color: 'rgba(201,169,110,0.07)' } },
};

const Leetcode = () => {
  const [data, setData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [cardLoading, setCardLoading] = useState(false);
  const [dateError, setDateError] = useState('');
  const [pastVisible, setPastVisible] = useState(10);
  const [futureVisible, setFutureVisible] = useState(8);

  const fetchStats = useCallback(async (date) => {
    const params = date ? { date } : {};
    const { data: res } = await api.get('/leetcode/stats', { params });
    return res;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetchStats(null);
        if (cancelled) return;
        setData(res);
        setSelectedDate(res.selectedDate || res.todayKey);
        setErr('');
        setDateError('');
      } catch (e) {
        if (!cancelled) {
          setData(null);
          setErr(e.response?.data?.message || 'Could not load LeetCode stats.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchStats]);

  useEffect(() => {
    if (!selectedDate || loading || err) return;
    if (selectedDate === data?.selectedDate) return;

    let cancelled = false;
    (async () => {
      try {
        setCardLoading(true);
        setDateError('');
        const res = await fetchStats(selectedDate);
        if (cancelled) return;
        setData(res);
      } catch (e) {
        if (!cancelled) setDateError(e.response?.data?.message || 'Could not load that date.');
      } finally {
        if (!cancelled) setCardLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, fetchStats, loading, err, data?.selectedDate]);

  const lineData = useMemo(() => {
    if (!data?.submissionCalendarDaily?.length) return null;
    const rows = data.submissionCalendarDaily;
    return {
      labels: rows.map((r) => r.date.slice(5)),
      datasets: [
        {
          label: 'Submissions (calendar)',
          data: rows.map((r) => r.submissions),
          borderColor: '#C9A96E',
          backgroundColor: 'rgba(201, 169, 110, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 2,
        },
        {
          label: '7-day avg (rolling)',
          data: rows.map((r) => {
            const idx = rows.findIndex((x) => x.date === r.date);
            if (idx < 0) return 0;
            const slice = rows.slice(Math.max(0, idx - 6), idx + 1);
            const sum = slice.reduce((a, x) => a + x.submissions, 0);
            return Math.round((sum / slice.length) * 10) / 10;
          }),
          borderColor: 'rgba(96, 165, 250, 0.7)',
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
        },
      ],
    };
  }, [data]);

  const compareData = useMemo(() => {
    if (!data?.submissionCalendarDaily?.length) return null;
    const last7 = data.submissionCalendarDaily.slice(-7);
    return {
      labels: last7.map((r) => r.date.slice(5)),
      datasets: [
        {
          label: '% vs 7d avg (end that day)',
          data: last7.map((r) => r.vsWeekAvgPercent),
          backgroundColor: last7.map((r) =>
            r.momentum === 'up' ? 'rgba(74, 222, 128, 0.55)' : r.momentum === 'down' ? 'rgba(248, 113, 113, 0.5)' : 'rgba(201, 169, 110, 0.35)'
          ),
          borderColor: last7.map((r) =>
            r.momentum === 'up' ? '#4ADE80' : r.momentum === 'down' ? '#F87171' : '#C9A96E'
          ),
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    };
  }, [data]);

  const stackedDiff = useMemo(() => {
    if (!data?.difficultyByDay?.length) return null;
    const rows = data.difficultyByDay;
    return {
      labels: rows.map((r) => r.date.slice(5)),
      datasets: [
        {
          label: 'Easy AC',
          data: rows.map((r) => r.easy),
          backgroundColor: 'rgba(74, 222, 128, 0.65)',
          borderRadius: 4,
        },
        {
          label: 'Medium AC',
          data: rows.map((r) => r.medium),
          backgroundColor: 'rgba(251, 191, 36, 0.65)',
          borderRadius: 4,
        },
        {
          label: 'Hard AC',
          data: rows.map((r) => r.hard),
          backgroundColor: 'rgba(248, 113, 113, 0.6)',
          borderRadius: 4,
        },
      ],
    };
  }, [data]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      ...chartScales,
      x: { ...chartScales.x, stacked: true },
      y: { ...chartScales.y, stacked: true, beginAtZero: true },
    },
    plugins: { legend: { labels: { color: '#F7F4EF' } } },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: chartScales,
    plugins: { legend: { labels: { color: '#F7F4EF' } } },
  };

  const compareOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      ...chartScales,
      y: {
        ...chartScales.y,
        title: { display: true, text: '% vs 7d avg', color: 'rgba(247,244,239,0.45)' },
      },
    },
    plugins: { legend: { labels: { color: '#F7F4EF' } } },
  };

  const nav = data?.dateNavigation;
  const todayKey = data?.todayKey;

  if (loading) {
    return (
      <div className="leetcode-page dashboard-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Syncing LeetCode analytics...</p>
        </div>
      </div>
    );
  }

  if (err && !data) {
    return (
      <div className="leetcode-page dashboard-container">
        <h1 className="leetcode-title">LeetCode analytics</h1>
        <div className="leetcode-card leetcode-card--error">
          <p>{err}</p>
          {(err.includes('Profile') || err.includes('username')) && (
            <Link to="/profile" className="leetcode-link-btn">
              Open profile
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="leetcode-page dashboard-container">
      <header className="leetcode-header">
        <div>
          <h1 className="leetcode-title">LeetCode analytics</h1>
          <p className="leetcode-sub">
            Stats align with LeetCode’s calendar (Pacific). Total solved comes from your LeetCode profile; daily E/M/H use recent accepted submissions.
          </p>
        </div>
        {data?.avatar && (
          <img src={data.avatar} alt="" className="leetcode-avatar" width={56} height={56} />
        )}
      </header>

      <section className="leetcode-win-wrap">
        <h2 className="leetcode-section-title">Winning card</h2>
        <p className="leetcode-hint">Pick a day — today, upcoming, or earlier. Use “Show more” for a longer list.</p>

        {dateError && (
          <p className="lc-date-err" role="alert">
            {dateError}
          </p>
        )}

        {nav && todayKey && (
          <div className="lc-dates">
            <div className="lc-dates__row">
              <span className="lc-dates__label">Today</span>
              <div className="lc-dates__chips">
                <button
                  type="button"
                  className={`lc-chip ${selectedDate === todayKey ? 'lc-chip--on' : ''}`}
                  onClick={() => setSelectedDate(todayKey)}
                >
                  Today
                </button>
              </div>
            </div>
            <div className="lc-dates__row">
              <span className="lc-dates__label">Earlier</span>
              <div className="lc-dates__chips">
                {nav.pastDays.slice(0, pastVisible).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    className={`lc-chip ${selectedDate === key ? 'lc-chip--on' : ''}`}
                    onClick={() => setSelectedDate(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {pastVisible < nav.pastDays.length && (
                <button type="button" className="lc-dates__more" onClick={() => setPastVisible((n) => n + 10)}>
                  More past
                </button>
              )}
            </div>
            <div className="lc-dates__row lc-dates__row--future">
              <span className="lc-dates__label">Upcoming</span>
              <div className="lc-dates__chips">
                {nav.futureDays.slice(0, futureVisible).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    className={`lc-chip ${selectedDate === key ? 'lc-chip--on' : ''}`}
                    onClick={() => setSelectedDate(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {futureVisible < nav.futureDays.length && (
                <button type="button" className="lc-dates__more" onClick={() => setFutureVisible((n) => n + 7)}>
                  More future
                </button>
              )}
            </div>
          </div>
        )}

        <LeetcodeWinningCard3D
          data={data?.winningCard}
          username={data?.username}
          avatarUrl={data?.avatar}
          loading={cardLoading}
        />
      </section>

      <div className="leetcode-stat-grid">
        <div className="leetcode-stat">
          <span className="leetcode-stat-label">Total solved</span>
          <span className="leetcode-stat-val">{data.totalSolved}</span>
        </div>
        <div className="leetcode-stat">
          <span className="leetcode-stat-label">Easy</span>
          <span className="leetcode-stat-val leetcode-e">{data.easySolved}</span>
        </div>
        <div className="leetcode-stat">
          <span className="leetcode-stat-label">Medium</span>
          <span className="leetcode-stat-val leetcode-m">{data.mediumSolved}</span>
        </div>
        <div className="leetcode-stat">
          <span className="leetcode-stat-label">Hard</span>
          <span className="leetcode-stat-val leetcode-h">{data.hardSolved}</span>
        </div>
        <div className="leetcode-stat">
          <span className="leetcode-stat-label">Streak</span>
          <span className="leetcode-stat-val">{data.streak} days</span>
        </div>
        <div className="leetcode-stat">
          <span className="leetcode-stat-label">7d avg (subs)</span>
          <span className="leetcode-stat-val">{data.weekAverageSubmissions}</span>
        </div>
      </div>

      <div className="leetcode-grid">
        <div className="leetcode-card chart-tall">
          <h3>30-day submission pulse</h3>
          <div className="leetcode-chart">
            {lineData ? <Line data={lineData} options={lineOptions} /> : <p className="leetcode-empty">No calendar data.</p>}
          </div>
        </div>
        <div className="leetcode-card chart-tall">
          <h3>7-day momentum vs weekly average</h3>
          <div className="leetcode-chart">
            {compareData ? <Bar data={compareData} options={compareOptions} /> : <p className="leetcode-empty">Not enough data.</p>}
          </div>
        </div>
        <div className="leetcode-card chart-tall leetcode-card--wide">
          <h3>Accepted by difficulty (recent window)</h3>
          <p className="leetcode-note-inline">{data.note}</p>
          <div className="leetcode-chart">
            {stackedDiff ? <Bar data={stackedDiff} options={chartOptions} /> : <p className="leetcode-empty">No recent accepted submissions.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leetcode;
