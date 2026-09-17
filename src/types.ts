export interface ServiceConfig {
  serviceName: string;
  displayName: string;
  description: string;
  phpPath: string;
  scriptPath: string;
  workingDirectory: string;
  enableCloudUpload: boolean;
  localPdfPath: string;
  syncRecursive?: boolean;
  excludeExtensions?: string;
  s3Endpoint: string;
  s3Bucket: string;
  s3Region: string;
  s3AccessKey: string;
  s3SecretKey: string;
  s3PublicUrl: string;
  s3PresignedUrl: boolean;
  s3PresignedExpiry: string;
  // S3 Automatic Retry Strategy
  s3MaxRetries?: number;
  s3RetryBackoff?: boolean;
  s3InitialBackoffMs?: number;
  s3BackoffMultiplier?: number;
  logMode: string;
  startMode: string;
  onFailure: string;
  delaySeconds: string;
  dependencies: string;
  generateHealthCheck?: boolean;
  odbcDriver?: string;
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
