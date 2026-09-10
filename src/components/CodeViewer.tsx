import React, { useState } from 'react';
import { GeneratedFiles } from '../types';
import { FileText, Copy, Check, Download, Terminal, Code } from 'lucide-react';

interface CodeViewerProps {
  files: GeneratedFiles | null;
  serviceName: string;
}

export function CodeViewer({ files, serviceName }: CodeViewerProps) {
  const [activeTab, setActiveTab] = useState<keyof GeneratedFiles>('winsw.xml');
  const [copied, setCopied] = useState(false);

  if (!files) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center">
        <Terminal className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-700">No Service Files Generated Yet</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Configure your service settings above and click <span className="font-semibold text-slate-700">"Generate Service Package"</span> to create WinSW XML, NSSM batch installer, and PHP daemon scripts.
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
    // Download each file
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
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {(Object.keys(files) as Array<keyof GeneratedFiles>).map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3.5 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
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
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
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
