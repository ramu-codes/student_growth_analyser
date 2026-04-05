import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { FiDownload, FiShare2, FiCopy, FiCheck } from 'react-icons/fi';
import './LeetcodeWinningCard3D.css';

const LeetcodeWinningCard3D = ({ data, username, avatarUrl, loading }) => {
  const cardRef = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const [copying, setCopying] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current || window.innerWidth < 768) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -12;
    const rY = ((x - centerX) / centerX) * 12;

    setRotateX(rX);
    setRotateY(rY);
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    // Reset rotation for clean capture
    setRotateX(0);
    setRotateY(0);

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 3, // High quality
        useCORS: true,
        logging: false,
        borderRadius: 24,
      });
      
      const link = document.createElement('a');
      link.download = `LeetCode_Winner_${username}_${date}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const handleShare = async () => {
     const shareData = {
      title: 'My LeetCode Progress',
      text: `I've solved ${totalSolved} problems on LeetCode! Streak: ${streak} days. Check my progress on Student Growth Analytics!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        setCopying(true);
        setTimeout(() => setCopying(false), 2000);
      } catch (err) {
        console.error('Clipboard copy failed', err);
      }
    }
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  if (loading && !data) {
    return (
      <div className="card-3d-scene">
        <div className="card-3d card-3d--loading">
          <div className="card-3d__shimmer" />
          <span>Crunching LeetCode data...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    date,
    relativeLabel,
    isFuture,
    totalSolved,
    calendarSubmissions,
    prevDaySubmissions,
    acceptedBreakdown,
    acceptedTotal,
    easySolved,
    mediumSolved,
    hardSolved,
    streak,
  } = data;

  const delta = calendarSubmissions - prevDaySubmissions;
  const deltaText = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : '±0';
  const deltaColor = delta > 0 ? 'var(--red-bright)' : delta < 0 ? 'var(--gray-muted)' : 'var(--white)';

  return (
    <div className="card-3d-scene">
      <div
        ref={cardRef}
        className={`card-3d ${isHovered ? 'card-3d--active' : ''}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        }}
      >
        <div className="card-3d__glare" />
        
        {/* Header: User & Date */}
        <div className="card-3d__header">
          <div className="card-3d__user">
            {avatarUrl ? (
              <img src={avatarUrl} alt={username} className="card-3d__avatar" />
            ) : (
              <div className="card-3d__avatar-placeholder">{username?.charAt(0).toUpperCase()}</div>
            )}
            <div className="card-3d__user-info">
              <span className="card-3d__username">@{username}</span>
              <span className="card-3d__date">{relativeLabel} • {date}</span>
            </div>
          </div>
          <div className="card-3d__badge">LEETCODE</div>
        </div>

        {/* Main Stat: Total Solved */}
        <div className="card-3d__main">
          <div className="card-3d__stat-group">
            <span className="card-3d__label">TOTAL SOLVED</span>
            <h2 className="card-3d__value card-3d__value--lg">{totalSolved}</h2>
          </div>
          <div className="card-3d__streak">
            <span className="card-3d__label">STREAK</span>
            <span className="card-3d__value">{streak}d</span>
          </div>
        </div>

        {/* Submissions Section */}
        <div className="card-3d__submission">
          <div className="card-3d__stat-box">
            <span className="card-3d__label">SUBMISSIONS</span>
            <div className="card-3d__flex">
              <span className="card-3d__value">{calendarSubmissions}</span>
              <span className="card-3d__delta" style={{ color: deltaColor }}>
                ({deltaText} vs yesterday)
              </span>
            </div>
          </div>
        </div>

        {/* Difficulty Breakthrough */}
        <div className="card-3d__breakdown">
          <div className="card-3d__difficulty">
            <span className="card-3d__diff-label card-3d__diff-label--easy">EASY</span>
            <span className="card-3d__diff-value">{acceptedBreakdown?.easy || 0}</span>
          </div>
          <div className="card-3d__difficulty">
            <span className="card-3d__diff-label card-3d__diff-label--medium">MEDIUM</span>
            <span className="card-3d__diff-value">{acceptedBreakdown?.medium || 0}</span>
          </div>
          <div className="card-3d__difficulty">
            <span className="card-3d__diff-label card-3d__diff-label--hard">HARD</span>
            <span className="card-3d__diff-value">{acceptedBreakdown?.hard || 0}</span>
          </div>
        </div>

        <div className="card-3d__footer">
          <div className="card-3d__profile-split">
             <span className="card-3d__split-item">E: {easySolved}</span>
             <span className="card-3d__split-item">M: {mediumSolved}</span>
             <span className="card-3d__split-item">H: {hardSolved}</span>
          </div>
          <div className="card-3d__tag">STUDENT GROWTH ANALYTICS</div>
        </div>

        {/* Action Bar (Not visible in download) */}
        <div className="card-3d__actions" data-html2canvas-ignore>
          <button onClick={handleDownload} className="card-3d__btn" title="Download Image">
            <FiDownload /> Download
          </button>
          <button onClick={handleShare} className="card-3d__btn card-3d__btn--share" title="Share Content">
            {copying ? <><FiCheck /> Copied</> : <><FiShare2 /> Share</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeetcodeWinningCard3D;
