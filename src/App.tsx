import React, { useState, useEffect } from 'react';
import { ServiceConfig, GeneratedFiles } from './types';
import { ConfigWizard } from './components/ConfigWizard';
import { CodeViewer } from './components/CodeViewer';
import { ServiceSimulator } from './components/ServiceSimulator';
import { AiCopilot } from './components/AiCopilot';
import { MessageSquare, Settings, Activity, Bot, Terminal, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'config' | 'simulator' | 'copilot'>('config');
  const [config, setConfig] = useState<ServiceConfig>({
    serviceName: 'WhatsAppSyncService',
    displayName: 'WhatsApp PHP Sync Daemon',
    description: 'Background Windows Service for syncing WhatsApp webhooks and queues using PHP CLI',
    phpPath: 'C:\\php\\php.exe',
    scriptPath: 'C:\\inetpub\\wwwroot\\whatsapp-sync\\daemon.php',
    workingDirectory: 'C:\\inetpub\\wwwroot\\whatsapp-sync',
    logMode: 'roll-by-size',
    startMode: 'Automatic',
    onFailure: 'restart',
    delaySeconds: '10'
  });

  const [files, setFiles] = useState<GeneratedFiles | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-wrapper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setFiles(data.files);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Generate on initial mount
  useEffect(() => {
    handleGenerate();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">WhatsApp PHP Windows Service Suite</h1>
              <p className="text-xs text-slate-500">Transform PHP WhatsApp sync daemons into enterprise Windows Services</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('config')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'config' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-emerald-600" />
              Config & Generator
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'simulator' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              Service Simulator
            </button>
            <button
              onClick={() => setActiveTab('copilot')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'copilot' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-emerald-600" />
              AI Copilot
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === 'config' && (
          <div className="space-y-8">
            <ConfigWizard
              config={config}
              onChange={setConfig}
              onGenerate={handleGenerate}
              loading={loading}
            />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Generated Deployment Artifacts</h3>
                <span className="text-xs text-slate-500 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> WinSW & NSSM Ready
                </span>
              </div>
              <CodeViewer files={files} serviceName={config.serviceName} />
            </div>
          </div>
        )}

        {activeTab === 'simulator' && (
          <ServiceSimulator serviceName={config.serviceName} />
        )}

        {activeTab === 'copilot' && (
          <AiCopilot serviceName={config.serviceName} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        WhatsApp PHP Windows Service Suite &bull; Built for robust background daemon execution
      </footer>
    </div>
  );
}
