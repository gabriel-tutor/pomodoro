import { useState, useEffect, useRef, useCallback } from 'react'

type TimerMode = 'work' | 'shortBreak' | 'longBreak'

const WORK_DURATION = 25 * 60 // 25 minutes in seconds
const SHORT_BREAK_DURATION = 5 * 60 // 5 minutes in seconds
const LONG_BREAK_DURATION = 15 * 60 // 15 minutes in seconds

const PomodoroTimer = () => {
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION)
  const [isRunning, setIsRunning] = useState(false)
  const [mode, setMode] = useState<TimerMode>('work')
  const [completedSessions, setCompletedSessions] = useState(0)
  const [totalSessions, setTotalSessions] = useState(0)
  const intervalRef = useRef<number | null>(null)

  const playNotificationSound = useCallback(() => {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }, [])

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false)
    playNotificationSound()
    
    if (mode === 'work') {
      const newCompleted = completedSessions + 1
      setCompletedSessions(newCompleted)
      setTotalSessions(newCompleted)
      
      // Every 4 work sessions, take a long break
      if (newCompleted % 4 === 0) {
        setMode('longBreak')
        setTimeLeft(LONG_BREAK_DURATION)
      } else {
        setMode('shortBreak')
        setTimeLeft(SHORT_BREAK_DURATION)
      }
    } else {
      // Break completed, start work session
      setMode('work')
      setTimeLeft(WORK_DURATION)
    }
  }, [mode, completedSessions, playNotificationSound])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, handleTimerComplete])

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    if (mode === 'work') {
      setTimeLeft(WORK_DURATION)
    } else if (mode === 'shortBreak') {
      setTimeLeft(SHORT_BREAK_DURATION)
    } else {
      setTimeLeft(LONG_BREAK_DURATION)
    }
  }

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false)
    setMode(newMode)
    if (newMode === 'work') {
      setTimeLeft(WORK_DURATION)
    } else if (newMode === 'shortBreak') {
      setTimeLeft(SHORT_BREAK_DURATION)
    } else {
      setTimeLeft(LONG_BREAK_DURATION)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgress = (): number => {
    let totalDuration = WORK_DURATION
    if (mode === 'shortBreak') totalDuration = SHORT_BREAK_DURATION
    if (mode === 'longBreak') totalDuration = LONG_BREAK_DURATION
    return ((totalDuration - timeLeft) / totalDuration) * 100
  }

  const getModeColor = (): string => {
    if (mode === 'work') return 'from-red-500 to-pink-600'
    if (mode === 'shortBreak') return 'from-green-500 to-emerald-600'
    return 'from-blue-500 to-cyan-600'
  }

  const getModeLabel = (): string => {
    if (mode === 'work') return 'Focus Time'
    if (mode === 'shortBreak') return 'Short Break'
    return 'Long Break'
  }

  const circumference = 2 * Math.PI * 120 // radius = 120
  const progress = getProgress()
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 text-shadow">
            Pomodoro Timer
          </h1>
          <p className="text-white/80 text-lg">Stay focused, prevent burnout</p>
        </div>

        {/* Mode Selector */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => switchMode('work')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              mode === 'work'
                ? 'bg-red-500 text-white shadow-lg scale-105'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Work
          </button>
          <button
            onClick={() => switchMode('shortBreak')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              mode === 'shortBreak'
                ? 'bg-green-500 text-white shadow-lg scale-105'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Short Break
          </button>
          <button
            onClick={() => switchMode('longBreak')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              mode === 'longBreak'
                ? 'bg-blue-500 text-white shadow-lg scale-105'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Long Break
          </button>
        </div>

        {/* Timer Display */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <svg className="transform -rotate-90 w-64 h-64 md:w-80 md:h-80">
              {/* Background circle */}
              <circle
                cx="160"
                cy="160"
                r="120"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="12"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="160"
                cy="160"
                r="120"
                stroke={`url(#gradient-${mode})`}
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
              />
              <defs>
                <linearGradient id="gradient-work" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
                <linearGradient id="gradient-shortBreak" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <linearGradient id="gradient-longBreak" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-6xl md:text-7xl font-bold text-white mb-2 text-shadow ${getModeColor().includes('red') ? 'text-red-400' : getModeColor().includes('green') ? 'text-green-400' : 'text-blue-400'}`}>
                {formatTime(timeLeft)}
              </div>
              <div className="text-xl text-white/80 font-medium">
                {getModeLabel()}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={toggleTimer}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              isRunning
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg'
                : `bg-gradient-to-r ${getModeColor()} text-white shadow-lg hover:shadow-xl`
            }`}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={resetTimer}
            className="px-8 py-4 rounded-xl font-bold text-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            Reset
          </button>
        </div>

        {/* Stats */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-1">
                {completedSessions}
              </div>
              <div className="text-white/70 text-sm">Completed Sessions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">
                {Math.floor((completedSessions * WORK_DURATION) / 60)}
              </div>
              <div className="text-white/70 text-sm">Minutes Focused</div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 text-center">
          <p className="text-white/60 text-sm">
            💡 Tip: Take breaks to maintain focus and prevent burnout
          </p>
        </div>
      </div>
    </div>
  )
}

export default PomodoroTimer

