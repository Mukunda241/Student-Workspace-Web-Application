import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '../components/MainLayout';
import {
  IcoTrophy, IcoClock, IcoCalendar, IcoBell,
  IcoExternalLink, IcoSearch, IcoX, IcoRefresh, IcoCheck, IcoAlert
} from '../utils/icons';
import '../styles/contests.css';

/* ─────────────────────────────────────────────────────────────
   Contest page now fetches from the backend API.
   The backend stores all contests with IST-corrected times.
───────────────────────────────────────────────────────────── */

const PLATFORMS = ['All','Codeforces','LeetCode','CodeChef','AtCoder','HackerRank','Kaggle'];

/* ── Date helpers ─────────────────────────────────────────── */

// Parse ISO-8601 date string to JS Date (handles Z suffix = UTC)
const parseDate = (d) => {
  if (!d) return null;
  try {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  } catch { return null; }
};

// Format as IST locale string
const fmtIST = (d) => {
  const dt = parseDate(d);
  if (!dt) return '';
  return dt.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }) + ' IST';
};

// Human-readable countdown
const getCountdown = (d) => {
  const dt = parseDate(d);
  if (!dt) return { label: 'TBD', cls: '' };
  const diff = dt.getTime() - Date.now();
  if (diff <= 0) return { label: 'Live Now', cls: 'live' };
  const totalMins = Math.floor(diff / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h < 1)  return { label: `${m}m`,       cls: 'urgent' };
  if (h < 24) return { label: `${h}h ${m}m`, cls: h < 3 ? 'soon' : '' };
  const days = Math.floor(h / 24);
  return { label: `${days}d ${h % 24}h`, cls: '' };
};

// Format duration in minutes to "Xh Ym"
const fmtDuration = (secs) => {
  if (!secs) return '';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
};

// Is a contest in the past?
const isPast = (startISO, endISO) => {
  const end   = parseDate(endISO);
  const start = parseDate(startISO);
  if (end && !isNaN(end.getTime()))   return end.getTime()   < Date.now();
  if (start && !isNaN(start.getTime())) return start.getTime() < Date.now() - 3 * 3600000;
  return false;
};

// CSS class for platform badge
const platClass = (p) => {
  if (!p) return 'plat-default';
  const key = p.toLowerCase().replace(/\s/g, '');
  const map = {
    codeforces:'plat-codeforces', leetcode:'plat-leetcode',
    codechef:'plat-codechef',     atcoder:'plat-atcoder',
    hackerrank:'plat-hackerrank', kaggle:'plat-kaggle',
  };
  return map[key] || 'plat-default';
};

/* ─────────────────────────────────────────────────────────── */

export const Contests = () => {
  const [contests,  setContests]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [platform,  setPlatform]  = useState('All');
  const [search,    setSearch]    = useState('');
  const [reminded,  setReminded]  = useState(new Set());
  const [lastSync,  setLastSync]  = useState(() => localStorage.getItem('contestLastSync') || '');

  /* ── Load cached contests from localStorage on mount ── */
  useEffect(() => {
    const cached = localStorage.getItem('contestData');
    if (cached) {
      try { setContests(JSON.parse(cached)); } catch (_) {}
    }
    // Auto-sync if never synced or last sync > 4 hours ago
    const last = localStorage.getItem('contestLastSync');
    const fourHours = 4 * 60 * 60 * 1000;
    if (!last || Date.now() - new Date(last).getTime() > fourHours) {
      fetchContests();
    }
  }, []);

  /* ── Fetch from BACKEND API ── */
  const fetchContests = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch from backend which has IST-corrected times
      const res = await fetch('http://localhost:8082/api/contests/upcoming', {
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Backend returned ${res.status}`);
      }

      const data = await res.json();
      processAndStore(data);
    } catch (err) {
      console.error('Contest fetch error:', err);
      setError(`Could not load contests from backend: ${err.message}. Showing cached data if available.`);
    } finally {
      setLoading(false);
    }
  }, []);

  const processAndStore = (contests) => {
    const now = new Date().toISOString();
    const mapped = contests
      .map(c => ({
        id:          c.id,
        name:        c.contestName || 'Unknown Contest',
        platform:    c.platform || 'Unknown',
        startTime:   c.startTime,   // Already IST from backend
        endTime:     c.endTime,      // Already IST from backend
        duration:    c.endTime && c.startTime ? Math.floor((new Date(c.endTime) - new Date(c.startTime)) / 1000) : (c.duration || 0),
        url:         c.url || '',
      }))
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    setContests(mapped);
    localStorage.setItem('contestData', JSON.stringify(mapped));
    localStorage.setItem('contestLastSync', now);
    setLastSync(now);
    setError('');
  };

  const toggleRemind = (id) =>
    setReminded(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  /* ── Filter ── */
  const filtered = contests.filter(c => {
    const mp = platform === 'All' ||
      (c.platform || '').toLowerCase().replace(/\s/g,'') === platform.toLowerCase().replace(/\s/g,'');
    const ms = !search.trim() ||
      (c.name || '').toLowerCase().includes(search.toLowerCase());
    return mp && ms;
  });

  const upcoming = filtered.filter(c => !isPast(c.startTime, c.endTime));
  const past     = filtered.filter(c =>  isPast(c.startTime, c.endTime));
  const next     = upcoming[0];
  const { label: nextLabel } = next ? getCountdown(next.startTime) : { label: '—' };

  /* ── Cards ── */
  const UpcomingCard = ({ c }) => {
    const { label, cls } = getCountdown(c.startTime);
    const isLive = cls === 'live';
    return (
      <div className={`contest-card${isLive ? ' live-now' : ''}`}>
        <div className="contest-card-top">
          <div className="contest-card-name">{c.name}</div>
          <span className={`platform-badge ${platClass(c.platform)}`}>
            {c.platform}
          </span>
        </div>

        <div className="contest-time-block">
          {isLive ? (
            <div className="live-indicator"><IcoClock size={13} /> Live Right Now!</div>
          ) : (
            <>
              <div className="contest-time-row">
                <IcoClock size={13} />
                Starts in:&nbsp;
                <strong style={{ color: cls === 'urgent' || cls === 'soon' ? 'var(--red-600)' : 'var(--brand-600)' }}>
                  {label}
                </strong>
              </div>
              {c.startTime && (
                <div className="contest-time-row">
                  <IcoCalendar size={13} />
                  {/* startTime is UTC from clist.by — fmtIST converts correctly */}
                  {fmtIST(c.startTime)}
                </div>
              )}
            </>
          )}
          {c.duration > 0 && (
            <div className="contest-dur">
              <IcoClock size={12} /> Duration: {fmtDuration(c.duration)}
            </div>
          )}
        </div>

        <div className="contest-footer">
          <button
            className={`btn btn-sm ${reminded.has(c.id) ? 'btn-remind reminded' : 'btn-secondary'}`}
            onClick={() => toggleRemind(c.id)}
          >
            {reminded.has(c.id)
              ? <><IcoCheck size={12} /> Reminded</>
              : <><IcoBell size={12} /> Remind me</>}
          </button>
          {c.url && (
            <a href={c.url} target="_blank" rel="noopener noreferrer"
              className="btn btn-sm btn-primary">
              <IcoExternalLink size={12} /> Register
            </a>
          )}
        </div>
      </div>
    );
  };

  const PastCard = ({ c }) => (
    <div className="contest-card contest-card-past">
      <div className="contest-card-top">
        <div className="contest-card-name">{c.name}</div>
        <span className={`platform-badge ${platClass(c.platform)}`}>{c.platform}</span>
      </div>
      <div className="contest-time-block">
        {c.startTime && (
          <div className="contest-time-row">
            <IcoCalendar size={13} />{fmtIST(c.startTime)}
          </div>
        )}
        {c.duration > 0 && (
          <div className="contest-dur"><IcoClock size={12} /> {fmtDuration(c.duration)}</div>
        )}
      </div>
      <div className="contest-footer">
        <span className="badge badge-done" style={{ fontSize: '.72rem', padding: '3px 10px' }}>
          <IcoCheck size={11} /> Completed
        </span>
        {c.url && (
          <a href={c.url} target="_blank" rel="noopener noreferrer"
            className="btn btn-sm btn-secondary" style={{ fontSize: '.73rem' }}>
            <IcoExternalLink size={12} /> View
          </a>
        )}
      </div>
    </div>
  );

  return (
    <MainLayout pageTitle="Contests">
      <div className="contests-wrap">

        {/* ── Next contest banner ── */}
        {next && (
          <div className="contests-banner">
            <div className="contests-banner-left">
              <h3>Next: {next.name}</h3>
              <p>{next.platform} · {fmtIST(next.startTime)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="contests-countdown">{nextLabel}</div>
              <div className="contests-countdown-lbl">until start</div>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="error-msg" style={{ marginBottom: '1rem', alignItems: 'flex-start' }}>
            <IcoAlert size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 160, maxWidth: 280 }}>
            <IcoSearch size={14} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-3)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search contests…" style={{ paddingLeft: 30 }} />
          </div>

          {lastSync && (
            <span style={{ fontSize: '.72rem', color: 'var(--txt-3)', whiteSpace: 'nowrap' }}>
              Synced {new Date(lastSync).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          <button className="btn btn-primary btn-sm" onClick={fetchContests} disabled={loading}
            style={{ marginLeft: 'auto' }}>
            <IcoRefresh size={13} /> {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {/* ── Platform filter chips ── */}
        <div className="platform-filters">
          {PLATFORMS.map(p => (
            <button key={p}
              className={`chip-btn${platform === p ? ' active' : ''}`}
              onClick={() => setPlatform(p)}
              style={{ fontSize: '.75rem', padding: '4px 13px' }}>
              {p}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /> Loading contests from clist.by…</div>
        ) : filtered.length === 0 && contests.length === 0 ? (
          <div className="contest-empty">
            <IcoTrophy size={52} />
            <h3>No contests found</h3>
            <p style={{ marginBottom: '1.25rem' }}>
              Click Refresh to load upcoming contests from Codeforces, LeetCode, CodeChef and more.
            </p>
            <button className="btn btn-primary" onClick={fetchContests} disabled={loading}>
              <IcoRefresh size={14} /> {loading ? 'Loading…' : 'Load Contests'}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="contest-empty">
            <IcoSearch size={40} />
            <h3>No matching contests</h3>
            <p>Try selecting "All" platforms or clearing the search.</p>
          </div>
        ) : (
          <>
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <>
                <div className="section-label">
                  <IcoTrophy size={14} /> Upcoming ({upcoming.length})
                </div>
                <div className="contests-grid">
                  {upcoming.map(c => <UpcomingCard key={c.id} c={c} />)}
                </div>
              </>
            )}

            {/* Past */}
            {past.length > 0 && (
              <>
                <div className="section-label" style={{ marginTop: '1.5rem' }}>
                  <IcoClock size={14} /> Past Contests ({past.length})
                </div>
                <div className="contests-grid">
                  {past.slice(0, 20).map(c => <PastCard key={c.id} c={c} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Contests;
