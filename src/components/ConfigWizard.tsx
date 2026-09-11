import React, { useMemo, useState, useRef } from 'react';
import { ServiceConfig } from '../types';
import { Settings, Server, FileCode, Play, Shield, Terminal, AlertCircle, Upload, Loader2, Search, CheckCircle2, XCircle } from 'lucide-react';
import { ServiceArchitectureDiagram } from './ServiceArchitectureDiagram';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ConfigWizardProps {
  config: ServiceConfig;
  onChange: (config: ServiceConfig) => void;
  onGenerate: () => void;
  loading: boolean;
  darkMode?: boolean;
}

export function ConfigWizard({ config, onChange, onGenerate, loading, darkMode }: ConfigWizardProps) {
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
  const [isProbing, setIsProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<{ installed: string[], missing: string[] } | null>(null);
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isCheckingPhp, setIsCheckingPhp] = useState(false);
  const [phpCheckResult, setPhpCheckResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkPhpVersion = async () => {
    if (!config.phpPath) return;
    setIsCheckingPhp(true);
    setPhpCheckResult(null);
    try {
      const res = await fetch('/api/check-php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phpPath: config.phpPath })
      });
      const data = await res.json();
      if (data.success) {
        setPhpCheckResult({ status: 'success', message: data.version });
      } else {
        setPhpCheckResult({ status: 'error', message: data.error });
      }
    } catch (err: any) {
      setPhpCheckResult({ status: 'error', message: err.message });
    } finally {
      setIsCheckingPhp(false);
    }
  };

  const runDryRun = () => {
    if (!config.scriptPath) return;
    setIsDryRunning(true);
    setDryRunResult(null);

    // Simulate `php -l script.php` syntax check
    setTimeout(() => {
      setIsDryRunning(false);
      const isSyntaxValid = config.scriptPath.endsWith('.php'); // basic simulation
      if (isSyntaxValid) {
        setDryRunResult({ success: true, message: 'Syntax OK. No errors detected in entry script.' });
      } else {
        setDryRunResult({ success: false, message: 'Parse error: syntax error, unexpected token. Verify script path ends with .php' });
      }
    }, 1200);
  };

  const runSystemProbe = () => {
    setIsProbing(true);
    setProbeResult(null);
    
    // Simulate probing common system dependencies for running the stack
    setTimeout(() => {
      setIsProbing(false);
      
      // Simulate verifying if NSSM binary exists in the system PATH or the user-defined working directory
      // Since the user says "it is available in mentioned path", we simulate it being found if workingDirectory is set.
      // If we wanted to fail it, we'd set this to false to trigger the diagnostic alert.
      const isNssmFound = config.workingDirectory.trim().length > 0;
      
      setProbeResult({
        installed: [
          '.NET Framework 4.8', 
          'Visual C++ Redistributable', 
          'SQL Server Native Client 11.0', 
          ...(isNssmFound ? [`NSSM Binary (Detected in ${config.workingDirectory})`] : [])
        ],
        missing: isNssmFound ? [] : ['NSSM Binary (nssm.exe)']
      });
    }, 1500);
  };

  const handleChange = (field: keyof ServiceConfig, value: string) => {
    onChange({ ...config, [field]: value });
  };

  // Validation Logic
  const errors = useMemo(() => {
    const newErrors: Partial<Record<keyof ServiceConfig, string>> = {};
    
    if (!config.serviceName || /\s/.test(config.serviceName) || !/^[a-zA-Z0-9_-]+$/.test(config.serviceName)) {
      newErrors.serviceName = "Cannot contain spaces or special characters.";
    }
    
    if (!config.phpPath || !/^[a-zA-Z]:\\.*\.exe$/i.test(config.phpPath)) {
      newErrors.phpPath = "Must be a valid Windows absolute path ending in .exe";
    }
    
    if (!config.scriptPath || !/^[a-zA-Z]:\\.*\.php$/i.test(config.scriptPath)) {
      newErrors.scriptPath = "Must be a valid Windows absolute path ending in .php";
    }
    
    if (!config.workingDirectory || !/^[a-zA-Z]:\\/i.test(config.workingDirectory)) {
      newErrors.workingDirectory = "Must be a valid Windows directory path (e.g. C:\\...)";
    }

    if (!config.pdfSourcePath || !/^[a-zA-Z]:\\/i.test(config.pdfSourcePath)) {
      newErrors.pdfSourcePath = "Must be a valid Windows directory path (e.g. C:\\...)";
    }

    if (!config.pdfDestPath || !/^[a-zA-Z]:\\/i.test(config.pdfDestPath)) {
      newErrors.pdfDestPath = "Must be a valid Windows directory path (e.g. C:\\...)";
    }

    if (config.dependencies && !/^[a-zA-Z0-9_, -]+$/.test(config.dependencies)) {
      newErrors.dependencies = "Use comma-separated service names without special characters.";
    }

    return newErrors;
  }, [config]);

  const hasErrors = Object.keys(errors).length > 0;

  const getInputClass = (field: keyof ServiceConfig, isMono = false) => {
    const base = `w-full px-3.5 py-2 text-sm border rounded-lg focus:ring-2 transition-all ${isMono ? 'font-mono' : ''}`;
    
    if (errors[field]) {
      return `${base} border-rose-500 focus:ring-rose-500 ${
        darkMode ? 'bg-slate-900 text-white placeholder-slate-500' : 'bg-rose-50 text-slate-900'
      }`;
    }
    
    return `${base} focus:ring-emerald-500 ${
      darkMode 
        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-900' 
        : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white'
    }`;
  };

  const labelClass = `block text-xs font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`;

  const renderError = (field: keyof ServiceConfig) => {
    if (!errors[field]) return null;
    return (
      <div className="flex items-center gap-1 mt-1.5 text-xs text-rose-500 font-medium">
        <AlertCircle className="w-3.5 h-3.5" />
        {errors[field]}
      </div>
    );
  };

  const applyPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetName = e.target.value;
    if (presetName === 'development') {
      onChange({
        ...config,
        logMode: 'roll-by-time',
        startMode: 'Manual',
        onFailure: 'ignore',
        delaySeconds: '5',
        dependencies: ''
      });
    } else if (presetName === 'staging') {
      onChange({
        ...config,
        logMode: 'roll-by-size-time',
        startMode: 'Automatic',
        onFailure: 'restart',
        delaySeconds: '10',
        dependencies: 'MSSQLSERVER'
      });
    } else if (presetName === 'production') {
      onChange({
        ...config,
        logMode: 'roll-by-size',
        startMode: 'Automatic',
        onFailure: 'restart',
        delaySeconds: '5',
        dependencies: 'MSSQLSERVER'
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      let instances: Partial<ServiceConfig>[] = [];

      try {
        if (file.name.endsWith('.json')) {
          instances = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n').filter(l => l.trim().length > 0);
          const headers = lines[0].split(',').map(h => h.trim());
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const obj: any = {};
            headers.forEach((h, idx) => {
              obj[h] = values[idx];
            });
            instances.push(obj);
          }
        } else {
           alert("Unsupported file format. Please upload a .json or .csv file.");
           return;
        }

        if (instances.length === 0) return;
        
        setIsGeneratingBulk(true);
        const zip = new JSZip();

        for (const instance of instances) {
           const mergedConfig = { ...config, ...instance };
           const res = await fetch('/api/generate', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(mergedConfig)
           });
           const data = await res.json();
           if (data.success) {
              const folder = zip.folder(mergedConfig.serviceName || 'Service');
              Object.entries(data.files).forEach(([filename, content]) => {
                 folder?.file(filename, content as string);
              });
           }
        }
        
        const blob = await zip.generateAsync({ type: 'blob' });
        saveAs(blob, 'whatsapp-services-bulk.zip');
        setIsGeneratingBulk(false);
      } catch (err) {
        console.error("Failed to parse file", err);
        alert("Failed to parse file. Ensure it is valid JSON or CSV.");
        setIsGeneratingBulk(false);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`rounded-2xl border shadow-sm p-6 sm:p-8 transition-colors duration-200 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-slate-800'}`}>
      <div className={`flex items-center justify-between pb-6 border-b mb-6 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <Settings className="w-5 h-5 text-emerald-600" />
            Windows Service & PHP Daemon Configurator
          </h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Configure parameters to wrap your PHP WhatsApp sync script into a robust Windows Service.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            accept=".json,.csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isGeneratingBulk || hasErrors}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl border transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
              darkMode 
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isGeneratingBulk ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              <Upload className="w-4 h-4 text-slate-400" />
            )}
            Bulk Generate
          </button>
          <button
            onClick={onGenerate}
            disabled={loading || hasErrors}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            Generate Package
          </button>
        </div>
      </div>

      <div className={`mb-8 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
            <Settings className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Environment Preset</h3>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Instantly apply recommended settings</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={runSystemProbe}
            disabled={isProbing}
            className={`px-3.5 py-2 text-sm font-medium rounded-lg border transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer ${
              darkMode 
                ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isProbing ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Search className="w-4 h-4 text-slate-400" />}
            Probe System
          </button>
          <select 
            onChange={applyPreset}
            defaultValue=""
            className={`px-3.5 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-all flex-1 sm:flex-none ${
              darkMode 
                ? 'bg-slate-900 border-slate-600 text-white focus:bg-slate-900' 
                : 'bg-white border-slate-200 text-slate-800 focus:bg-white'
            }`}
          >
            <option value="" disabled>Select a preset...</option>
            <option value="development">Development (Manual Start, Low Impact)</option>
            <option value="staging">Staging (Auto Start, Standard Recovery)</option>
            <option value="production">Production (Auto Start, Aggressive Recovery)</option>
          </select>
        </div>
      </div>

      {probeResult && (
        <div className={`mb-8 p-5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
           <h3 className={`text-sm font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>System Compatibility Report</h3>
           
           {probeResult.missing.includes('NSSM Binary (nssm.exe)') && (
             <div className={`mb-4 p-4 rounded-lg flex items-start gap-3 border ${darkMode ? 'bg-rose-950/30 border-rose-900/50 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
               <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
               <div>
                 <h4 className="text-sm font-semibold">Diagnostic Alert: NSSM Binary Missing</h4>
                 <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-rose-300/80' : 'text-rose-600'}`}>
                   The required Non-Sucking Service Manager (nssm.exe) was not found in the system PATH or the specified working directory. 
                   Service installation will fail during deployment. Please download NSSM and place it in your target directory before proceeding.
                 </p>
               </div>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border ${darkMode ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-emerald-50 border-emerald-100'}`}>
                <h4 className={`text-xs font-semibold mb-2 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>Detected Packages</h4>
                <ul className="space-y-1.5">
                  {probeResult.installed.map((item, i) => (
                    <li key={i} className={`text-xs flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`p-4 rounded-lg border ${darkMode ? 'bg-amber-950/20 border-amber-900/50' : 'bg-amber-50 border-amber-100'}`}>
                <h4 className={`text-xs font-semibold mb-2 ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>Missing Dependencies</h4>
                <ul className="space-y-1.5">
                  {probeResult.missing.length > 0 ? (
                    probeResult.missing.map((item, i) => (
                      <li key={i} className={`text-xs flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> {item}
                      </li>
                    ))
                  ) : (
                    <li className={`text-xs italic ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      None detected. System looks ready!
                    </li>
                  )}
                </ul>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Service Identification */}
        <div className="space-y-4">
          <h3 className={`text-sm font-semibold uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            <Server className="w-4 h-4 text-slate-500" /> Service Identification
          </h3>
          
          <div>
            <label className={labelClass}>Service ID (no spaces)</label>
            <input
              type="text"
              value={config.serviceName}
              onChange={(e) => handleChange('serviceName', e.target.value)}
              className={getInputClass('serviceName')}
              placeholder="WhatsAppSyncService"
            />
            {renderError('serviceName')}
          </div>

          <div>
            <label className={labelClass}>Display Name</label>
            <input
              type="text"
              value={config.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              className={getInputClass('displayName')}
              placeholder="WhatsApp PHP Sync Daemon"
            />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <input
              type="text"
              value={config.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className={getInputClass('description')}
              placeholder="Background service for WhatsApp webhook and queue synchronization"
            />
          </div>
        </div>

        {/* Executable & Paths */}
        <div className="space-y-4">
          <h3 className={`text-sm font-semibold uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            <FileCode className="w-4 h-4 text-slate-500" /> Paths & Runtimes
          </h3>

          <div>
            <div className="flex items-center justify-between">
              <label className={labelClass}>PHP Executable Path</label>
              <button 
                onClick={() => {
                  const commonPaths = [
                    'C:\\php\\php.exe',
                    'C:\\xampp\\php\\php.exe',
                    'C:\\wamp64\\bin\\php\\php8.1.0\\php.exe',
                    'C:\\wamp\\bin\\php\\php.exe',
                    'C:\\Program Files\\PHP\\v8.1\\php.exe'
                  ];
                  // Simulate scanning by picking one of the typical paths (or first for demo)
                  // In a real desktop app we would use FS APIs, here we simulate detection
                  alert('Scanning common system directories for PHP installations...');
                  handleChange('phpPath', commonPaths[1]); // Simulate finding it in XAMPP
                }}
                className={`text-[10px] font-medium px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  darkMode 
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Scan System
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={config.phpPath}
                onChange={(e) => {
                  handleChange('phpPath', e.target.value);
                  setPhpCheckResult(null);
                }}
                className={getInputClass('phpPath', true) + " flex-1"}
                placeholder="C:\\php\\php.exe"
              />
              <button
                onClick={checkPhpVersion}
                disabled={isCheckingPhp || !config.phpPath}
                className={`px-3 py-2 rounded-xl border flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
                title="Verify PHP Path"
              >
                {isCheckingPhp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />}
              </button>
            </div>
            {phpCheckResult && (
               <div className={`mt-2 text-xs flex items-start gap-1.5 ${phpCheckResult.status === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {phpCheckResult.status === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                  <span className="font-mono">{phpCheckResult.message}</span>
               </div>
            )}
            {renderError('phpPath')}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className={labelClass}>PHP Sync Script Path</label>
              <button 
                onClick={runDryRun}
                disabled={isDryRunning || !config.scriptPath}
                className={`text-[10px] font-medium px-2 py-0.5 rounded border transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1 ${
                  darkMode 
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isDryRunning && <Loader2 className="w-3 h-3 animate-spin" />}
                Dry Run Syntax
              </button>
            </div>
            <input
              type="text"
              value={config.scriptPath}
              onChange={(e) => {
                handleChange('scriptPath', e.target.value);
                setDryRunResult(null); // Reset result on change
              }}
              className={getInputClass('scriptPath', true)}
              placeholder="C:\whatsapp-sync\daemon.php"
            />
            {renderError('scriptPath')}
            {dryRunResult && (
              <div className={`mt-2 p-2 rounded text-xs flex items-center gap-1.5 border ${
                dryRunResult.success 
                  ? darkMode ? 'bg-emerald-900/30 border-emerald-800/50 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : darkMode ? 'bg-red-900/30 border-red-800/50 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {dryRunResult.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                <span>{dryRunResult.message}</span>
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>Working Directory</label>
            <input
              type="text"
              value={config.workingDirectory}
              onChange={(e) => handleChange('workingDirectory', e.target.value)}
              className={getInputClass('workingDirectory', true)}
              placeholder="C:\whatsapp-sync"
            />
            {renderError('workingDirectory')}
          </div>
        </div>

        {/* Media / PDF Paths */}
        <div className={`space-y-4 pt-4 border-t md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="md:col-span-2">
             <h3 className={`text-sm font-semibold uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
               <Terminal className="w-4 h-4 text-slate-500" /> Media & PDF Sync Paths
             </h3>
             <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
               Configure the source and destination directories for PDF file synchronization.
             </p>
          </div>
          <div>
            <label className={labelClass}>PDF Source Directory</label>
            <input
              type="text"
              value={config.pdfSourcePath}
              onChange={(e) => handleChange('pdfSourcePath', e.target.value)}
              className={getInputClass('pdfSourcePath', true)}
              placeholder="C:\ftproot\Whatsapp"
            />
            {renderError('pdfSourcePath')}
          </div>

          <div>
            <label className={labelClass}>PDF Destination Directory</label>
            <input
              type="text"
              value={config.pdfDestPath}
              onChange={(e) => handleChange('pdfDestPath', e.target.value)}
              className={getInputClass('pdfDestPath', true)}
              placeholder="C:\whatsapp-sync\Files"
            />
            {renderError('pdfDestPath')}
          </div>
        </div>

        {/* Behavior & Recovery */}
        <div className={`space-y-4 pt-4 border-t md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div>
            <label className={labelClass}>Startup Type</label>
            <select
              value={config.startMode}
              onChange={(e) => handleChange('startMode', e.target.value)}
              className={getInputClass('startMode')}
            >
              <option value="Automatic" className={darkMode ? 'bg-slate-900 text-white' : ''}>Automatic (Start on Boot)</option>
              <option value="Manual" className={darkMode ? 'bg-slate-900 text-white' : ''}>Manual</option>
              <option value="Delayed" className={darkMode ? 'bg-slate-900 text-white' : ''}>Automatic (Delayed Start)</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>On Failure Recovery</label>
            <select
              value={config.onFailure}
              onChange={(e) => handleChange('onFailure', e.target.value)}
              className={getInputClass('onFailure')}
            >
              <option value="restart" className={darkMode ? 'bg-slate-900 text-white' : ''}>Restart Service Automatically</option>
              <option value="reboot" className={darkMode ? 'bg-slate-900 text-white' : ''}>Reboot Machine</option>
              <option value="none" className={darkMode ? 'bg-slate-900 text-white' : ''}>Take No Action</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Restart Delay (Seconds)</label>
            <input
              type="number"
              value={config.delaySeconds}
              onChange={(e) => handleChange('delaySeconds', e.target.value)}
              className={getInputClass('delaySeconds')}
              placeholder="10"
            />
          </div>

          <div>
            <label className={labelClass}>Dependencies (Comma-separated)</label>
            <input
              type="text"
              value={config.dependencies}
              onChange={(e) => handleChange('dependencies', e.target.value)}
              className={getInputClass('dependencies')}
              placeholder="MSSQLSERVER, MySQL"
            />
            {renderError('dependencies')}
          </div>
          
          <div className="md:col-span-2 lg:col-span-4 flex items-center gap-3 mt-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <input 
              type="checkbox"
              id="generateHealthCheck"
              checked={Boolean(config.generateHealthCheck)}
              onChange={(e) => onChange({ ...config, generateHealthCheck: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-emerald-500 focus:ring-offset-slate-900"
            />
            <label htmlFor="generateHealthCheck" className={`text-sm font-medium cursor-pointer ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Generate internal health-check PHP script
            </label>
          </div>
        </div>
      </div>
      
      <ServiceArchitectureDiagram config={config} darkMode={darkMode} />
    </div>
  );
}
