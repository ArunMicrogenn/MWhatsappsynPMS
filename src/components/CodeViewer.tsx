import React, { useState } from 'react';
import { GeneratedFiles } from '../types';
import { FileText, Copy, Check, Download, Terminal, Code } from 'lucide-react';

interface CodeViewerProps {
  files: GeneratedFiles | null;
  serviceName: string;
  darkMode?: boolean;
}

export function CodeViewer({ files, serviceName, darkMode }: CodeViewerProps) {
  const [activeTab, setActiveTab] = useState<keyof GeneratedFiles>('winsw.xml');
  const [copied, setCopied] = useState(false);

  if (!files) {
    return (
      <div className={`rounded-2xl border shadow-sm p-12 text-center transition-colors duration-200 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200/80 text-slate-700'}`}>
        <Terminal className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-slate-700'}`}>No Service Files Generated Yet</h3>
        <p className={`text-sm mt-1 max-w-md mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Configure your service settings above and click <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>"Generate Service Package"</span> to create WinSW XML, NSSM batch installer, and PHP daemon scripts.
        </p>
      </div>
    );
  }

  const fileLabels: Record<keyof GeneratedFiles, { name: string; icon: string }> = {
    "winsw.xml": { name: "WinSW XML Config", icon: "📄" },
    "install-service.bat": { name: "NSSM Installer (.bat)", icon: "⚡" },
    "whatsapp-daemon.php": { name: "WhatsApp ODBC Daemon", icon: "🐘" },
    "manage-service.ps1": { name: "PowerShell Manager", icon: "🛡️" },
    "README.md": { name: "Installation Guide", icon: "📖" }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(files[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    Object.entries(files).forEach(([filename, content]) => {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename === 'winsw.xml' ? `${serviceName}.xml` : filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden transition-colors duration-200 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'}`}>
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b gap-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {(Object.keys(files) as Array<keyof GeneratedFiles>).map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3.5 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === key
                  ? darkMode ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-900 text-white shadow-sm'
                  : darkMode ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{fileLabels[key].icon}</span>
              <span>{fileLabels[key].name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleCopy}
            className={`px-3.5 py-2 text-xs font-medium rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              darkMode 
                ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
          <button
            onClick={handleDownloadAll}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Package
          </button>
        </div>
      </div>

      <div className="p-4 bg-slate-950 text-slate-100 overflow-x-auto font-mono text-xs leading-relaxed max-h-[500px]">
        <pre className="p-4 rounded-lg bg-slate-900/80 border border-slate-800/80 overflow-x-auto">
          <code>{files[activeTab]}</code>
        </pre>
      </div>
    </div>
  );
}
