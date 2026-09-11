export interface ServiceConfig {
  serviceName: string;
  displayName: string;
  description: string;
  phpPath: string;
  scriptPath: string;
  workingDirectory: string;
  pdfSourcePath: string;
  pdfDestPath: string;
  logMode: string;
  startMode: string;
  onFailure: string;
  delaySeconds: string;
  dependencies: string;
  generateHealthCheck?: boolean;
}

export interface GeneratedFiles {
  "winsw.xml": string;
  "install-service.bat": string;
  "uninstall-service.bat": string;
  "whatsapp-daemon.php": string;
  "manage-service.ps1": string;
  "README.md": string;
  "health-check.php"?: string;
}
