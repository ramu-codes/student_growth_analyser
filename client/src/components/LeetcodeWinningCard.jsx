import React from 'react';
import './LeetcodeWinningCard.css';

const LeetcodeWinningCard = ({ data, username, avatarUrl, loading }) => {
  if (loading && !data) {
    return (
      <div className="wc-scene">
        <div className="wc wc--loading">Loading card…</div>
      </div>
    );
  }
  if (!data) return null;

  const {
    date,
    relativeLabel,
    isFuture,
    totalSolved,
    streak,
    weekAvg,
    vsWeekAvgPercent,
    momentum,
    calendarSubmissions,
    acceptedBreakdown,
    acceptedTotal,
    easySolved,
    mediumSolved,
    hardSolved,
    ranking,
    activeDaysInWeek,
  } = data;

  const tone = isFuture ? 'wc--future' : momentum === 'up' ? 'wc--up' : momentum === 'down' ? 'wc--down' : '';

  return (
    <div className="wc-scene">
      <div className={`wc ${tone} ${loading ? 'wc--busy' : ''}`}>
        {loading && <div className="wc__shimmer" aria-hidden />}
        <header className="wc__top">
          <div>
            <p className="wc__eyebrow">Winning card</p>
            <h2 className="wc__title">{relativeLabel}</h2>
            <p className="wc__date">{date} · Pacific (LeetCode)</p>
          </div>
          {avatarUrl ? (
            <img className="wc__avatar-img" src={avatarUrl} alt="" width={44} height={44} />
          ) : (
            <div className="wc__avatar-fallback" aria-hidden>
              {String(username || '?')
                .slice(0, 1)
                .toUpperCase()}
            </div>
          )}
        </header>

        {isFuture && (
          <p className="wc__banner">No LeetCode activity yet — plan your session for this day.</p>
        )}

        <div className="wc__hero">
          <div className="wc__stat wc__stat--primary">
            <span className="wc__stat-k">Total solved</span>
            <span className="wc__stat-v">{totalSolved}</span>
            <span className="wc__stat-h">from LeetCode profile</span>
          </div>
          <div className="wc__stat">
            <span className="wc__stat-k">Streak</span>
            <span className="wc__stat-v">{streak}d</span>
            <span className="wc__stat-h">to this calendar day</span>
          </div>
          <div className="wc__stat">
            <span className="wc__stat-k">7-day avg</span>
            <span className="wc__stat-v">{weekAvg}</span>
            <span className="wc__stat-h">subs / day · week ending {date}</span>
          </div>
        </div>

        <section className="wc__day" aria-label="Selected day">
          <h3 className="wc__sec-title">This day</h3>
          <div className="wc__day-grid">
            <div>
              <span className="wc__mini-k">Submissions</span>
              <span className="wc__mini-v">{calendarSubmissions}</span>
            </div>
            <div>
              <span className="wc__mini-k">Accepted (recent)</span>
              <span className="wc__mini-v">{acceptedTotal}</span>
            </div>
            <div>
              <span className="wc__mini-k">vs 7d avg</span>
              <span className={`wc__mini-v wc__mini-v--${momentum === 'flat' ? 'flat' : momentum}`}>
                {vsWeekAvgPercent > 0 ? '+' : ''}
                {vsWeekAvgPercent}%
              </span>
            </div>
            <div>
              <span className="wc__mini-k">Active week days</span>
              <span className="wc__mini-v">{activeDaysInWeek}/7</span>
            </div>
          </div>
          <div className="wc__emh">
            <span>E {acceptedBreakdown?.easy ?? 0}</span>
            <span>M {acceptedBreakdown?.medium ?? 0}</span>
            <span>H {acceptedBreakdown?.hard ?? 0}</span>
          </div>
        </section>

        <section className="wc__profile" aria-label="Profile totals">
          <h3 className="wc__sec-title">Profile split</h3>
          <div className="wc__split">
            <span className="wc__split-e">{easySolved} easy</span>
            <span className="wc__split-m">{mediumSolved} med</span>
            <span className="wc__split-h">{hardSolved} hard</span>
          </div>
          {ranking != null && <p className="wc__rank">Global rank #{ranking}</p>}
        </section>
      </div>
    </div>
  );
};

export default LeetcodeWinningCard;
