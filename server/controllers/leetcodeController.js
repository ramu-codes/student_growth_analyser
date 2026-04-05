const { LeetCode } = require('leetcode-query');
const { formatInTimeZone, fromZonedTime } = require('date-fns-tz');
const { subDays, addDays } = require('date-fns');
const StudentProfile = require('../models/StudentProfile');

const LC_TZ = 'America/Los_Angeles';

const slugDifficultyCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

const RECENT_GQL = `
query ($username: String!, $limit: Int!) {
  recentSubmissionList(username: $username, limit: $limit) {
    title
    titleSlug
    timestamp
    statusDisplay
    lang
  }
}
`;

function parseSubmissionCalendar(raw) {
  if (!raw) return {};
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (typeof parsed === 'string') return JSON.parse(parsed);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function todayKeyLC() {
  return formatInTimeZone(new Date(), LC_TZ, 'yyyy-MM-dd');
}

function tsToKeyLC(sec) {
  const n = Number(sec);
  if (!Number.isFinite(n)) return null;
  return formatInTimeZone(new Date(n * 1000), LC_TZ, 'yyyy-MM-dd');
}

function prevDayKey(dateKey) {
  const anchor = fromZonedTime(`${dateKey}T12:00:00`, LC_TZ);
  return formatInTimeZone(subDays(anchor, 1), LC_TZ, 'yyyy-MM-dd');
}

function addDaysLC(dateKey, delta) {
  const anchor = fromZonedTime(`${dateKey}T12:00:00`, LC_TZ);
  return formatInTimeZone(addDays(anchor, delta), LC_TZ, 'yyyy-MM-dd');
}

function daysBetween(fromKey, toKey) {
  const a = fromZonedTime(`${fromKey}T12:00:00`, LC_TZ).getTime();
  const b = fromZonedTime(`${toKey}T12:00:00`, LC_TZ).getTime();
  return Math.round((b - a) / 86400000);
}

function rangeEndingOn(endKey, nDays) {
  const keys = [];
  let k = endKey;
  for (let i = 0; i < nDays; i++) {
    keys.unshift(k);
    k = prevDayKey(k);
  }
  return keys;
}

function weekAverageEndingOn(calendarMap, endKey) {
  const keys = rangeEndingOn(endKey, 7);
  const sum = keys.reduce((acc, k) => acc + Number(calendarMap[k] || 0), 0);
  return sum / 7;
}

function streakEndingOn(calendarMap, endKey, todayKey) {
  let streak = 0;
  let key = endKey;
  let first = true;
  for (let i = 0; i < 400; i++) {
    const c = Number(calendarMap[key] || 0);
    if (c > 0) {
      streak += 1;
      first = false;
    } else if (first && key === todayKey) {
      /* empty “today” — keep looking backward */
    } else {
      break;
    }
    key = prevDayKey(key);
    first = false;
  }
  return streak;
}

function totalSolvedFromProfile(matched) {
  const qc = matched?.contributions?.questionCount;
  if (qc != null && Number(qc) > 0) return Number(qc);

  const acStats = matched?.submitStats?.acSubmissionNum || [];
  const allRow = acStats.find((x) => x.difficulty === 'All');
  if (allRow && Number(allRow.count) > 0) return Number(allRow.count);

  return ['Easy', 'Medium', 'Hard'].reduce((sum, diff) => {
    const row = acStats.find((x) => x.difficulty === diff);
    return sum + (Number(row?.count) || 0);
  }, 0);
}

function difficultyCountsFromAc(matched) {
  const acStats = matched?.submitStats?.acSubmissionNum || [];
  return {
    easy: Number(acStats.find((x) => x.difficulty === 'Easy')?.count) || 0,
    medium: Number(acStats.find((x) => x.difficulty === 'Medium')?.count) || 0,
    hard: Number(acStats.find((x) => x.difficulty === 'Hard')?.count) || 0,
  };
}

async function resolveDifficulties(leetcode, slugs) {
  const unique = [...new Set(slugs)].slice(0, 50);
  const out = {};
  const now = Date.now();
  
  // Use Promise.all to fetch in parallel
  const results = await Promise.all(unique.map(async (slug) => {
    const hit = slugDifficultyCache.get(slug);
    if (hit && now - hit.t < CACHE_TTL_MS) {
      return { slug, d: hit.d };
    }
    try {
      const prob = await leetcode.problem(slug);
      const d = (prob.difficulty || 'Easy').toLowerCase();
      slugDifficultyCache.set(slug, { d, t: now });
      return { slug, d };
    } catch {
      return { slug, d: null };
    }
  }));

  results.forEach(({ slug, d }) => {
    out[slug] = d;
  });

  return out;
}

function validateDateParam(s) {
  if (!s || typeof s !== 'string') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return s;
}

function relativeDayLabel(selectedKey, todayKey) {
  const diff = daysBetween(todayKey, selectedKey);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === 2) return 'Day after tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < -1) return `${-diff} days ago`;
  if (diff > 2) return `In ${diff} days`;
  return selectedKey;
}

// @route GET /api/leetcode/stats?date=YYYY-MM-DD
// @access Private
const getLeetcodeStats = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    const username = (profile?.leetcodeUsername || '').trim();
    if (!username) {
      return res.status(400).json({
        message: 'Add your LeetCode username in Profile to load stats.',
        needsUsername: true,
      });
    }

    const todayKey = todayKeyLC();
    const dateParam = validateDateParam(req.query.date);
    const selectedDate = dateParam || todayKey;

    const leetcode = new LeetCode();
    // Fetch both in parallel with a timeout to prevent hanging
    const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('LeetCode API timeout')), ms));
    
    let userProfile, gqlRes;
    try {
      [userProfile, gqlRes] = await Promise.race([
        Promise.all([
          leetcode.user(username),
          leetcode.graphql({
            query: RECENT_GQL,
            variables: { username, limit: 120 },
          })
        ]),
        timeout(12000) // 12-second timeout
      ]);
    } catch (error) {
      if (error.message === 'LeetCode API timeout') {
         return res.status(504).json({ message: 'LeetCode API is taking too long. Please try again.' });
      }
      throw error;
    }

    const matched = userProfile?.matchedUser;

    if (!matched) {
      return res.status(404).json({
        message: `LeetCode user "${username}" was not found.`,
        needsUsername: false,
      });
    }

    const calendarMap = parseSubmissionCalendar(matched.submissionCalendar);
    const recent = gqlRes?.data?.recentSubmissionList || [];
    const accepted = recent.filter((s) => s.statusDisplay === 'Accepted');

    const slugs = accepted.map((s) => s.titleSlug).filter(Boolean);
    const diffMap = slugs.length ? await resolveDifficulties(leetcode, slugs) : {};

    const byDateDifficulty = {};
    for (const sub of accepted) {
      const day = tsToKeyLC(sub.timestamp);
      if (!day) continue;
      if (!byDateDifficulty[day]) {
        byDateDifficulty[day] = { easy: 0, medium: 0, hard: 0, acceptedCount: 0 };
      }
      const diff = diffMap[sub.titleSlug];
      byDateDifficulty[day].acceptedCount += 1;
      if (diff === 'easy') byDateDifficulty[day].easy += 1;
      else if (diff === 'medium') byDateDifficulty[day].medium += 1;
      else if (diff === 'hard') byDateDifficulty[day].hard += 1;
    }

    const totalSolved = totalSolvedFromProfile(matched);
    const { easy: easySolved, medium: mediumSolved, hard: hardSolved } = difficultyCountsFromAc(matched);

    const streak = streakEndingOn(calendarMap, todayKey, todayKey);
    const streakAsOfSelected = streakEndingOn(calendarMap, selectedDate, todayKey);

    const last30Keys = rangeEndingOn(todayKey, 30);
    const weekAvgGlobal = weekAverageEndingOn(calendarMap, todayKey);
    const weekAvgRounded = Math.round(weekAvgGlobal * 10) / 10;

    const dailyWithCompare = last30Keys.map((date) => {
      const subs = Number(calendarMap[date] || 0);
      const weekAvgForDay = weekAverageEndingOn(calendarMap, date);
      const vsAvg =
        weekAvgForDay > 0 ? ((subs - weekAvgForDay) / weekAvgForDay) * 100 : subs > 0 ? 100 : 0;
      return {
        date,
        submissions: subs,
        vsWeekAvgPercent: Math.round(vsAvg * 10) / 10,
        momentum: subs > weekAvgForDay ? 'up' : subs < weekAvgForDay ? 'down' : 'flat',
      };
    });

    const last14Keys = rangeEndingOn(todayKey, 14);
    const difficultySeries = last14Keys.map((date) => ({
      date,
      easy: byDateDifficulty[date]?.easy || 0,
      medium: byDateDifficulty[date]?.medium || 0,
      hard: byDateDifficulty[date]?.hard || 0,
      acceptedInWindow: byDateDifficulty[date]?.acceptedCount || 0,
    }));

    const isFuture = selectedDate > todayKey;
    const daySubs = isFuture ? 0 : Number(calendarMap[selectedDate] || 0);
    const bucket = byDateDifficulty[selectedDate] || { easy: 0, medium: 0, hard: 0, acceptedCount: 0 };
    const weekAvgSelected = weekAverageEndingOn(calendarMap, selectedDate);
    const weekAvgSelRounded = Math.round(weekAvgSelected * 10) / 10;
    const vsSel =
      weekAvgSelected > 0
        ? Math.round(((daySubs - weekAvgSelected) / weekAvgSelected) * 1000) / 10
        : daySubs > 0
          ? 100
          : 0;
    const momentumSel =
      daySubs > weekAvgSelected ? 'up' : daySubs < weekAvgSelected ? 'down' : 'flat';

    const activeDaysInWeek = rangeEndingOn(selectedDate, 7).filter((k) => Number(calendarMap[k] || 0) > 0).length;

    const pastKeys = [];
    let pk = prevDayKey(todayKey);
    for (let i = 0; i < 45; i++) {
      pastKeys.push(pk);
      pk = prevDayKey(pk);
    }
    const futureKeys = [];
    let fk = addDaysLC(todayKey, 1);
    for (let i = 0; i < 21; i++) {
      futureKeys.push(fk);
      fk = addDaysLC(fk, 1);
    }

    res.json({
      username: matched.username,
      realName: matched.profile?.realName || '',
      avatar: matched.profile?.userAvatar || '',
      ranking: matched.profile?.ranking ?? null,
      reputation: matched.profile?.reputation ?? null,
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      streak,
      submissionCalendarDaily: dailyWithCompare,
      difficultyByDay: difficultySeries,
      weekAverageSubmissions: weekAvgRounded,
      timezone: LC_TZ,
      todayKey,
      selectedDate,
      isFuture,
      relativeLabel: relativeDayLabel(selectedDate, todayKey),
      today: {
        date: todayKey,
        calendarSubmissions: Number(calendarMap[todayKey] || 0),
        acceptedEasy: byDateDifficulty[todayKey]?.easy || 0,
        acceptedMedium: byDateDifficulty[todayKey]?.medium || 0,
        acceptedHard: byDateDifficulty[todayKey]?.hard || 0,
        acceptedTotal: byDateDifficulty[todayKey]?.acceptedCount || 0,
      },
      winningCard: {
        username: matched.username,
        date: selectedDate,
        relativeLabel: relativeDayLabel(selectedDate, todayKey),
        isFuture,
        hasLeetcodeData: !isFuture,
        totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        streak: streakAsOfSelected,
        calendarSubmissions: daySubs,
        prevDaySubmissions: Number(calendarMap[prevDayKey(selectedDate)] || 0),
        acceptedBreakdown: {
          easy: isFuture ? 0 : bucket.easy,
          medium: isFuture ? 0 : bucket.medium,
          hard: isFuture ? 0 : bucket.hard,
        },
        acceptedTotal: isFuture ? 0 : bucket.acceptedCount,
        weekAvg: weekAvgSelRounded,
        vsWeekAvgPercent: vsSel,
        momentum: momentumSel,
        ranking: matched.profile?.ranking ?? null,
        activeDaysInWeek,
      },
      note:
        'Dates use LeetCode’s calendar (Pacific Time). Total solved matches profile question count when available. Easy/Medium/Hard for a day use up to 100 recent accepted submissions.',
      dateNavigation: {
        todayKey,
        pastDays: pastKeys.map((k) => ({ key: k, label: relativeDayLabel(k, todayKey) })),
        futureDays: futureKeys.map((k) => ({ key: k, label: relativeDayLabel(k, todayKey) })),
      },
    });
  } catch (err) {
    console.error('LeetCode stats error:', err.message);
    res.status(502).json({
      message: err.message || 'Failed to load LeetCode data. Try again later.',
    });
  }
};

module.exports = { getLeetcodeStats };
