import React from 'react';
import { ServiceConfig } from '../types';
import { Settings, Server, FileCode, Play, Shield, Terminal } from 'lucide-react';

interface ConfigWizardProps {
  config: ServiceConfig;
  onChange: (config: ServiceConfig) => void;
  onGenerate: () => void;
  loading: boolean;
}

export function ConfigWizard({ config, onChange, onGenerate, loading }: ConfigWizardProps) {
  const handleChange = (field: keyof ServiceConfig, value: string) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            Windows Service & PHP Daemon Configurator
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Configure parameters to wrap your PHP WhatsApp sync script into a robust Windows Service.
          </p>
        </div>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-500" /> Service Identification
          </h3>
          
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Service ID (no spaces)</label>
            <input
              type="text"
              value={config.serviceName}
              onChange={(e) => handleChange('serviceName', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              placeholder="WhatsAppSyncService"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Display Name</label>
            <input
              type="text"
              value={config.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              placeholder="WhatsApp PHP Sync Daemon"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <input
              type="text"
              value={config.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              placeholder="Background service for WhatsApp webhook and queue synchronization"
            />
          </div>
        </div>

        {/* Executable & Paths */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FileCode className="w-4 h-4 text-slate-500" /> Paths & Runtimes
          </h3>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">PHP Executable Path</label>
            <input
              type="text"
              value={config.phpPath}
              onChange={(e) => handleChange('phpPath', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              placeholder="C:\php\php.exe"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">PHP Sync Script Path</label>
            <input
              type="text"
              value={config.scriptPath}
              onChange={(e) => handleChange('scriptPath', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              placeholder="C:\inetpub\wwwroot\whatsapp-sync\daemon.php"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Working Directory</label>
            <input
              type="text"
              value={config.workingDirectory}
              onChange={(e) => handleChange('workingDirectory', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              placeholder="C:\inetpub\wwwroot\whatsapp-sync"
            />
          </div>
        </div>

        {/* Behavior & Recovery */}
        <div className="space-y-4 pt-4 border-t border-slate-100 md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Startup Type</label>
            <select
              value={config.startMode}
              onChange={(e) => handleChange('startMode', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            >
              <option value="Automatic">Automatic (Start on Boot)</option>
              <option value="Manual">Manual</option>
              <option value="Delayed">Automatic (Delayed Start)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">On Failure Recovery</label>
            <select
              value={config.onFailure}
              onChange={(e) => handleChange('onFailure', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            >
              <option value="restart">Restart Service Automatically</option>
              <option value="reboot">Reboot Machine</option>
              <option value="none">Take No Action</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Restart Delay (Seconds)</label>
            <input
              type="number"
              value={config.delaySeconds}
              onChange={(e) => handleChange('delaySeconds', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              placeholder="10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
