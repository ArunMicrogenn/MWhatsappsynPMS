import React, { useState, useEffect } from 'react';
import { Activity, Play, Square, RotateCw, Terminal, CheckCircle2, AlertTriangle, Cpu, HardDrive, RefreshCcw, Wifi } from 'lucide-react';

interface ServiceSimulatorProps {
  serviceName: string;
  darkMode?: boolean;
}

interface HealthMetrics {
  memoryUsageMB: number;
  cpuLoadPercent: number;
  odbcConnected: boolean;
  queuePending: number;
  uptimeSeconds: number;
  lastPing: string;
  errorRate: string;
}

export function ServiceSimulator({ serviceName, darkMode }: ServiceSimulatorProps) {
  const [status, setStatus] = useState<'Running' | 'Stopped' | 'Starting' | 'Stopping'>('Running');
  const [metrics, setMetrics] = useState<HealthMetrics>({
    memoryUsageMB: 24,
    cpuLoadPercent: 2.1,
    odbcConnected: true,
    queuePending: 0,
    uptimeSeconds: 120,
    lastPing: new Date().toLocaleTimeString(),
    errorRate: "0.0%"
  });
  const [pollCount, setPollCount] = useState(0);

  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] Service "${serviceName}" initialized successfully.`,
    `[${new Date().toLocaleTimeString()}] Loaded PHP executable C:\\php\\php.exe`,
    `[${new Date().toLocaleTimeString()}] Executing sync daemon loop...`,
    `[${new Date().toLocaleTimeString()}] Connected to WhatsApp Webhook / Queue successfully.`
  ]);

  // Polling effect for health check
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/health-check?state=${status}`);
        const data = await res.json();
        if (data.success) {
          setMetrics(data.metrics);
          setPollCount(c => c + 1);
        }
      } catch (err) {
        console.error("Health check poll failed:", err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [status]);

  useEffect(() => {
    if (status === 'Running') {
      const interval = setInterval(() => {
        const timeStr = new Date().toLocaleTimeString();
        const actions = [
          `[${timeStr}] Sync cycle check: 0 pending messages in queue.`,
          `[${timeStr}] Heartbeat OK. Memory usage: ${metrics.memoryUsageMB} MB.`,
          `[${timeStr}] Polling WhatsApp gateway... Status 200 OK.`
        ];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        setLogs(prev => [...prev.slice(-30), randomAction]);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [status, metrics.memoryUsageMB]);

  const handleStart = () => {
    setStatus('Starting');
    setTimeout(() => {
      setStatus('Running');
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Service "${serviceName}" started by administrator.`]);
    }, 1000);
  };

  const handleStop = () => {
    setStatus('Stopping');
    setTimeout(() => {
      setStatus('Stopped');
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Service "${serviceName}" stopped.`]);
    }, 1000);
  };

  const handleRestart = () => {
    handleStop();
    setTimeout(() => {
      handleStart();
    }, 1500);
  };

  const cardClass = `rounded-2xl border shadow-sm p-6 sm:p-8 transition-colors duration-200 ${
    darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-slate-800'
  }`;

  const subCardClass = `p-4 rounded-xl border flex items-center justify-between ${
    darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200/60'
  }`;

  return (
    <div className="space-y-6">
      {/* Control & Status Card */}
      <div className={cardClass}>
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b mb-6 gap-4 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div>
            <h2 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <Activity className="w-5 h-5 text-emerald-600" />
              Windows Service Control & Simulator
            </h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Simulate service control commands and monitor real-time health telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStart}
              disabled={status === 'Running' || status === 'Starting'}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-white" /> Start
            </button>
            <button
              onClick={handleStop}
              disabled={status === 'Stopped' || status === 'Stopping'}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Square className="w-3.5 h-3.5 fill-white" /> Stop
            </button>
            <button
              onClick={handleRestart}
              className={`px-3.5 py-2 text-white text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-700 hover:bg-slate-800'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" /> Restart
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className={subCardClass}>
            <div>
              <span className={`text-xs font-medium block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Service Name</span>
              <span className={`text-sm font-bold font-mono mt-0.5 block ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{serviceName}</span>
            </div>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
              status === 'Running' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
              status === 'Stopped' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
            }`}>
              {status === 'Running' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {status}
            </span>
          </div>

          <div className={subCardClass}>
            <div>
              <span className={`text-xs font-medium block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Process Runtime</span>
              <span className={`text-sm font-bold font-mono mt-0.5 block ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>PHP CLI (php.exe)</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded font-mono ${darkMode ? 'bg-slate-800 text-slate-300' : 'text-slate-500 bg-slate-200/70'}`}>PID 4820</span>
          </div>

          <div className={subCardClass}>
            <div>
              <span className={`text-xs font-medium block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Recovery Policy</span>
              <span className={`text-sm font-bold mt-0.5 block ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Auto Restart (10s delay)</span>
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">Active</span>
          </div>
        </div>

        {/* Real-time Health Monitoring Widget */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-inner border border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
              <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">Real-Time Health & Telemetry Widget</h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <RefreshCcw className="w-3 h-3 animate-spin text-emerald-400" /> Polled #{pollCount}
              </span>
              <span>&bull; Last Ping: {metrics.lastPing}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs">Memory RSS</span>
                <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-lg font-bold font-mono text-white">
                {metrics.memoryUsageMB} <span className="text-xs text-slate-400 font-normal">MB</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs">CPU Load</span>
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-lg font-bold font-mono text-white">
                {metrics.cpuLoadPercent}%
              </div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs">ODBC SQL Ping</span>
                <Wifi className={`w-3.5 h-3.5 ${metrics.odbcConnected ? 'text-emerald-400' : 'text-rose-400'}`} />
              </div>
              <div className={`text-sm font-bold mt-1 ${metrics.odbcConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                {metrics.odbcConnected ? 'Connected (200ms)' : 'Disconnected'}
              </div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs">Queue / Errors</span>
                <Activity className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-sm font-bold font-mono text-white mt-1">
                {metrics.queuePending} pending ({metrics.errorRate})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Log Stream */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            <Terminal className="w-4 h-4 text-slate-500" /> Live Daemon Log Stream
          </span>
          <button
            onClick={() => setLogs([])}
            className={`text-xs underline cursor-pointer ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Clear logs
          </button>
        </div>
        <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs h-64 overflow-y-auto space-y-1.5 border border-slate-800">
          {logs.map((log, idx) => (
            <div key={idx} className="break-all">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

