import React, { useState, useEffect, useRef, useContext } from 'react';
import { MdPlayArrow, MdPause, MdRefresh, MdStop } from 'react-icons/md';
import { AuthContext } from '../context/AuthContext';
import { pomodoroService } from '../services/authService';
import '../styles/pomodoro.css';

export const PomodoroTimer = ({ taskId, taskTitle, onComplete, onSessionSaved }) => {
  const { user } = useContext(AuthContext);
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [totalSessions, setTotalSessions] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Format time display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Save work session to backend
  const saveWorkSession = async (workDuration) => {
    if (!user || !user.id) return;
    
    try {
      await pomodoroService.recordWorkSession(user.id, workDuration, true);
      if (onSessionSaved) {
        onSessionSaved();
      }
    } catch (err) {
      console.error('Failed to save Pomodoro session:', err);
    }
  };

  // Start/Pause timer
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timer finished
            playNotification();
            
            if (isWorkSession) {
              // Switch to break - save the work session
              saveWorkSession(workMinutes);
              setIsWorkSession(false);
              setTotalSessions((s) => s + 1);
              setTimeRemaining(breakMinutes * 60);
              
              if (onComplete) {
                onComplete(workMinutes);
              }
            } else {
              // Switch back to work
              setIsWorkSession(true);
              setTimeRemaining(workMinutes * 60);
            }
            
            return breakMinutes * 60 || workMinutes * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, isWorkSession, workMinutes, breakMinutes, onComplete]);

  const playNotification = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    
    oscillator.frequency.value = isWorkSession ? 800 : 600;
    oscillator.type = 'sine';
    
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsWorkSession(true);
    setTimeRemaining(workMinutes * 60);
    setTotalSessions(0);
  };

  const handleStop = () => {
    setIsActive(false);
    setIsWorkSession(true);
    setTimeRemaining(workMinutes * 60);
  };

  const progressPercentage = isWorkSession
    ? ((workMinutes * 60 - timeRemaining) / (workMinutes * 60)) * 100
    : ((breakMinutes * 60 - timeRemaining) / (breakMinutes * 60)) * 100;

  return (
    <div className="pomodoro-timer">
      <div className={`timer-display ${isWorkSession ? 'work' : 'break'}`}>
        <div className="timer-label">
          {isWorkSession ? '⏱️ Focus Time' : '☕ Break Time'}
        </div>
        <div className="timer-value">{formatTime(timeRemaining)}</div>
        <div className="sessions-count">Sessions: {totalSessions}</div>
      </div>

      <div className="timer-progress">
        <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
      </div>

      <div className="timer-controls">
        <button
          className="control-btn play-btn"
          onClick={() => setIsActive(!isActive)}
          title={isActive ? 'Pause' : 'Start'}
        >
          {isActive ? <MdPause size={24} /> : <MdPlayArrow size={24} />}
        </button>
        <button
          className="control-btn reset-btn"
          onClick={handleReset}
          title="Reset"
        >
          <MdRefresh size={24} />
        </button>
        <button
          className="control-btn stop-btn"
          onClick={handleStop}
          title="Stop"
        >
          <MdStop size={24} />
        </button>
      </div>

      {taskTitle && (
        <div className="timer-task">
          <strong>Task:</strong> {taskTitle}
        </div>
      )}

      <div className="timer-settings">
        <div className="setting">
          <label>Work</label>
          <input
            type="number"
            min="1"
            max="60"
            value={workMinutes}
            onChange={(e) => {
              setWorkMinutes(Number(e.target.value));
              if (!isActive && isWorkSession) {
                setTimeRemaining(Number(e.target.value) * 60);
              }
            }}
            disabled={isActive}
          />
        </div>
        <div className="setting">
          <label>Break</label>
          <input
            type="number"
            min="1"
            max="30"
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(Number(e.target.value))}
            disabled={isActive}
          />
        </div>
      </div>
    </div>
  );
};
