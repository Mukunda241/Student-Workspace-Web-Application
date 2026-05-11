import React, { useState, useEffect, useRef } from 'react';
import { IcoTimer, IcoPlay, IcoPause, IcoRefresh, IcoStop } from '../utils/icons';
import api from '../services/api';
import '../styles/pomodoro.css';

const CIRCUMFERENCE = 2 * Math.PI * 50; // r=50

const PomodoroTimer = ({ taskTitle }) => {
  const [workMins,  setWorkMins]  = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [isWork,    setIsWork]    = useState(true);
  const [isActive,  setIsActive]  = useState(false);
  const [timeLeft,  setTimeLeft]  = useState(25 * 60);
  const [sessions,  setSessions]  = useState(0);
  const interval = useRef(null);

  const total    = isWork ? workMins * 60 : breakMins * 60;
  const progress = (total - timeLeft) / total;
  const dash     = CIRCUMFERENCE - progress * CIRCUMFERENCE;
  const stroke   = isWork ? 'var(--brand-500)' : 'var(--green-500)';
  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  useEffect(() => {
    if (isActive) {
      interval.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval.current);
            if (isWork) setSessions(s => s + 1);
            setIsWork(w => !w);
            setIsActive(false);
            return isWork ? breakMins * 60 : workMins * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval.current);
    }
    return () => clearInterval(interval.current);
  }, [isActive, isWork, workMins, breakMins]);

  const reset = () => { setIsActive(false); setTimeLeft(isWork ? workMins * 60 : breakMins * 60); };
  const stop  = () => { setIsActive(false); setIsWork(true); setTimeLeft(workMins * 60); };

  return (
    <div className="pomo-widget">
      <div className="pomo-top">
        <h3><IcoTimer size={15} />{taskTitle ? taskTitle.slice(0, 18) : 'Pomodoro'}</h3>
        <div className="pomo-type-switch">
          <button className={isWork ? 'active' : ''} onClick={() => { setIsWork(true); stop(); }}>Work</button>
          <button className={!isWork ? 'active' : ''} onClick={() => { setIsWork(false); stop(); }}>Break</button>
        </div>
      </div>

      <div className="pomo-ring-area">
        <div className="pomo-ring">
          <svg width="120" height="120" viewBox="0 0 120 120" style={{transform:'rotate(-90deg)'}}>
            <circle className="pomo-ring-bg" cx="60" cy="60" r="50" />
            <circle className="pomo-ring-fill" cx="60" cy="60" r="50"
              style={{ stroke, strokeDasharray: CIRCUMFERENCE, strokeDashoffset: dash }} />
          </svg>
          <div className="pomo-time-center">{fmt(timeLeft)}</div>
        </div>
        <div className="pomo-status-lbl">{isWork ? '🎯 Focus' : '☕ Break'} · Session {sessions + 1}</div>
      </div>

      <div className="pomo-controls">
        {!isActive
          ? <button className="btn btn-primary btn-sm" onClick={() => setIsActive(true)}><IcoPlay size={13} /> Start</button>
          : <button className="btn btn-secondary btn-sm" onClick={() => setIsActive(false)}><IcoPause size={13} /> Pause</button>
        }
        <button className="btn btn-secondary btn-sm" onClick={reset}><IcoRefresh size={13} /> Reset</button>
        <button className="btn btn-ghost btn-sm" onClick={stop}><IcoStop size={13} /> Stop</button>
      </div>

      <div className="pomo-settings">
        <div className="pomo-setting">
          <label>Work (min)</label>
          <input type="number" min="1" max="90" value={workMins}
            onChange={e => { setWorkMins(+e.target.value); if (!isActive && isWork) setTimeLeft(+e.target.value*60); }} />
        </div>
        <div className="pomo-setting">
          <label>Break (min)</label>
          <input type="number" min="1" max="30" value={breakMins}
            onChange={e => { setBreakMins(+e.target.value); if (!isActive && !isWork) setTimeLeft(+e.target.value*60); }} />
        </div>
      </div>

      {sessions > 0 && <div className="pomo-done-count">✅ {sessions} session{sessions>1?'s':''} completed</div>}
    </div>
  );
};

export default PomodoroTimer;
