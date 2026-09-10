import React, { useMemo } from 'react';
import { ServiceConfig } from '../types';
import { Settings, Server, FileCode, Play, Shield, Terminal, AlertCircle } from 'lucide-react';

interface ConfigWizardProps {
  config: ServiceConfig;
  onChange: (config: ServiceConfig) => void;
  onGenerate: () => void;
  loading: boolean;
  darkMode?: boolean;
}

export function ConfigWizard({ config, onChange, onGenerate, loading, darkMode }: ConfigWizardProps) {
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
          Generate Service Package
        </button>
      </div>

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
            <label className={labelClass}>PHP Executable Path</label>
            <input
              type="text"
              value={config.phpPath}
              onChange={(e) => handleChange('phpPath', e.target.value)}
              className={getInputClass('phpPath', true)}
              placeholder="C:\php\php.exe"
            />
            {renderError('phpPath')}
          </div>

          <div>
            <label className={labelClass}>PHP Sync Script Path</label>
            <input
              type="text"
              value={config.scriptPath}
              onChange={(e) => handleChange('scriptPath', e.target.value)}
              className={getInputClass('scriptPath', true)}
              placeholder="C:\whatsapp-sync\daemon.php"
            />
            {renderError('scriptPath')}
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
        <div className={`space-y-4 pt-4 border-t md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
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
        </div>
      </div>
    </div>
  );
}
