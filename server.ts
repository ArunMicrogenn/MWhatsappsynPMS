import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// API: Generate wrapper configurations & converted PHP daemon
app.post("/api/generate-wrapper", (req, res) => {
  try {
    const {
      serviceName = "WhatsAppSyncService",
      displayName = "WhatsApp PHP Sync Daemon",
      description = "Background Windows Service for syncing WhatsApp messages and webhooks using PHP ODBC",
      phpPath = "C:\\php\\php.exe",
      scriptPath = "C:\\inetpub\\wwwroot\\whatsapp-sync\\whatsapp-daemon.php",
      workingDirectory = "C:\\inetpub\\wwwroot\\whatsapp-sync",
      logMode = "roll-by-size",
      startMode = "Automatic",
      onFailure = "restart",
      delaySeconds = "10"
    } = req.body;

    // 1. WinSW XML Configuration
    const winswXml = `<service>
  <id>${serviceName}</id>
  <name>${displayName}</name>
  <description>${description}</description>
  <executable>${phpPath}</executable>
  <arguments>${scriptPath}</arguments>
  <log mode="${logMode}">
    <sizeThreshold>10240</sizeThreshold>
    <keepFiles>10</keepFiles>
  </log>
  <workingdirectory>${workingDirectory}</workingdirectory>
  <startmode>${startMode}</startmode>
  <onfailure action="${onFailure}" delay="${delaySeconds}sec"/>
  <resetfailure>1 hour</resetfailure>
  <env name="APP_ENV" value="production" />
  <env name="PHP_CLI_SERVER_WORKERS" value="4" />
</service>`;

    // 2. NSSM Batch Installer
    const nssmBatch = `@echo off
TITLE Install ${displayName} as Windows Service
color 0b
echo ========================================================
echo Installing ${displayName} via NSSM...
echo ========================================================

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Please run this script as Administrator!
    pause
    exit /b 1
)

REM Check if nssm is available
where nssm >nul 2>&1
if %errorLevel% neq 0 (
    echo [WARNING] nssm not found in PATH. Please ensure nssm.exe is in the folder or PATH.
)

nssm install "${serviceName}" "${phpPath}" "${scriptPath}"
nssm set "${serviceName}" AppDirectory "${workingDirectory}"
nssm set "${serviceName}" DisplayName "${displayName}"
nssm set "${serviceName}" Description "${description}"
nssm set "${serviceName}" Start SERVICE_AUTO_START
nssm set "${serviceName}" AppStdout "${workingDirectory}\\logs\\service-stdout.log"
nssm set "${serviceName}" AppStderr "${workingDirectory}\\logs\\service-stderr.log"
nssm set "${serviceName}" AppRotateFiles 1
nssm set "${serviceName}" AppRotateBytes 10485760

echo ========================================================
echo Service "${serviceName}" installed successfully!
echo Starting service now...
net start "${serviceName}"
pause
`;

    // 3. Converted PHP Daemon Script (Adapted from user's script for continuous Windows Service CLI execution)
    const phpDaemonCode = `<?php
/**
 * WhatsApp PHP Sync Daemon for Windows Service
 * Converted from web-refresh script to a robust background CLI loop.
 */

// Disable execution time limit & enable high memory limit for daemon
set_time_limit(0);
ini_set('memory_limit', '1024M');

// Ensure log directory exists
$logDir = __DIR__ . '/logs';
if (!file_exists($logDir)) {
    mkdir($logDir, 0777, true);
}
$logFile = $logDir . '/daemon.log';

function writeLog($message) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[{$timestamp}] {$message}" . PHP_EOL;
    file_put_contents($logFile, $logMessage, FILE_APPEND);
    echo $logMessage;
}

writeLog("=== WhatsApp Sync Windows Service Daemon Started ===");

// Database Configuration
$myServer = "DESKTOP-VDGDM3P";
$myUser = "sa";
$myPass = "mgenn@123";
$myDB = "Whatsapp"; 

$pollInterval = 30; // seconds between sync cycles

while (true) {
    try {
        writeLog("Connecting to SQL Server ODBC ({$myServer} / {$myDB})...");
        $dbhandle = odbc_connect("Driver={SQL Server Native Client 11.0};Server=$myServer;Database=$myDB;", $myUser, $myPass);

        if (!$dbhandle) {
            writeLog("ERROR: ODBC connection failed: " . odbc_errormsg());
            sleep(10);
            continue;
        }

        $today = date('Y-m-d');
        writeLog("Executing sync cycle for date: {$today}");

        // Fetch active companies / hotels
        $smsextra = "select isnull(whatsappBusinessflag,0) as businessflag,
            isnull(IsWhatsapp,0) as whatsappflag,isnull(whatsappaskev,0) as whatsappaskev,isnull(mwhatsapp,0) as mwhatsapp,
            * from usedb where isnull(isactive,0)='1' and isnull(Hotelcode,'')<>''";
        
        $extrastmt = odbc_exec($dbhandle, $smsextra);
        if (!$extrastmt) {
            writeLog("ERROR executing usedb query: " . odbc_errormsg($dbhandle));
            odbc_close($dbhandle);
            sleep($pollInterval);
            continue;
        }

        while ($rowex = odbc_fetch_array($extrastmt)) {
            $myServerin = $rowex['servername'];
            $myDBin = $rowex['dbname'];
            $myUserin = $rowex['userid'];
            $myPassin = $rowex['password'];
            $smsCompany = $rowex['companyname'];
            $smsUsername = $rowex['SMSUsername'] ?? '';
            $whatsapp_access_token = $rowex['whatsapp_access_token'];
            $whatsapp_instance_id = $rowex['whatsapp_instance_id'];
            $Whatsapp_MobileNo = $rowex['Whatsapp_MobileNo'];
            $Whatsapp_hotelcode = $rowex['Hotelcode'];
            $whatsappbusiness = $rowex['businessflag'];
            $whatsappflag = $rowex['whatsappflag'];
            $whatsappaskev = $rowex['whatsappaskev'];
            $mwhatsapp = $rowex['mwhatsapp'];
            $whatsappaskev_token = $rowex['whatsappaskev_token'];

            writeLog("Processing Hotel: {$Whatsapp_hotelcode} ({$smsCompany}) [Biz: {$whatsappbusiness}, Askeva: {$whatsappaskev}, MWhatsApp: {$mwhatsapp}]");

            // Connect to individual hotel DB
            $dbhandlein = odbc_connect("Driver={SQL Server Native Client 11.0};Server=$myServerin;Database=$myDBin;", $myUserin, $myPassin);
            if (!$dbhandlein) {
                writeLog("WARNING: Could not connect to hotel DB {$myDBin} on {$myServerin}");
                continue;
            }

            // 1. AISensy Mode
            if ($whatsappbusiness == "1" && $whatsappflag == "0" && $whatsappaskev == "0" && $mwhatsapp == "0") {
                // Update inactive hotel outbox
                $uqry1 = "Update Outbox set whatsappsmsflg = 1, reason ='In active', notsentflag =1 where msgid in (
                    select msgid from outbox ot 
                    inner join Mas_Hotel mh on ot.HotelCode=mh.HotelCode
                    where CONVERT(varchar(25),datecreated,101)=convert(varchar(25),getdate(),101) and isnull(ot.apiresnotsent,0) = 0
                    and isnull(mh.inactive,0)=1 and isnull(ot.whatsappsmsflg,0) =0 and ot.HotelCode ='" . $Whatsapp_hotelcode . "')";
                @odbc_exec($dbhandlein, $uqry1);

                // Ensure opening balance record for today
                $hotqry = "SELECT DISTINCT m.HotelCode FROM mas_hotel m INNER JOIN whatsappcount_opening w ON m.HotelCode = w.hotel_code WHERE ISNULL(m.HotelCode,'')<>'' AND CAST(w.opdate AS date) < '$today'";
                $hotels = @odbc_exec($dbhandlein, $hotqry);
                if ($hotels) {
                    while ($hotel = odbc_fetch_array($hotels)) {
                        $hotelcode = trim($hotel['HotelCode']);
                        $check_today = "SELECT COUNT(*) AS cnt FROM whatsappcount_opening WHERE hotel_code = '$hotelcode' AND CAST(opdate AS date) = '$today'";
                        $res_check = @odbc_exec($dbhandlein, $check_today);
                        $row_check = $res_check ? odbc_fetch_array($res_check) : null;
                        if ($row_check && $row_check['cnt'] > 0) continue;

                        $qry_latest = "SELECT TOP 1 opbal, clbal, opdate, hotel_code, property_name FROM whatsappcount_opening WHERE hotel_code = '$hotelcode' AND CAST(opdate AS date) < '$today' ORDER BY opdate DESC";
                        $res_latest = @odbc_exec($dbhandlein, $qry_latest);
                        $row_latest = $res_latest ? odbc_fetch_array($res_latest) : null;
                        if (!$row_latest) continue;

                        $opbal = $row_latest['opbal'];
                        $clbal = $row_latest['clbal'];
                        $property_name = $row_latest['property_name'];
                        @odbc_exec($dbhandlein, "INSERT INTO whatsappcount_opening (opbal, clbal, opdate, todate, hotel_code, property_name) VALUES ('$opbal', '$clbal', '$today', '$today', '$hotelcode', '$property_name')");
                    }
                }

                // Process Outbox messages
                $smsobox_WB = "select reason,whatsappsmsflg,ot.HotelCode,* from outbox ot inner join Mas_Hotel mh on ot.HotelCode=mh.HotelCode where CONVERT(varchar(25),datecreated,101)=convert(varchar(25),getdate(),101) and isnull(ot.apiresnotsent,0) = 0 and isnull(mh.inactive,0)=0 and isnull(ot.whatsappsmsflg,0) =0 and ot.HotelCode='" . $Whatsapp_hotelcode . "' order by msgid";
                $outboxstmt_wb = @odbc_exec($dbhandlein, $smsobox_WB);

                if ($outboxstmt_wb) {
                    while ($rowob = odbc_fetch_array($outboxstmt_wb)) {
                        $openqry = "SELECT * FROM whatsappcount_opening WHERE opdate = '".$today."' AND hotel_code = '".$Whatsapp_hotelcode."'";
                        $open = @odbc_exec($dbhandlein, $openqry);
                        $clbal = 0;
                        if ($open) {
                            while ($row = odbc_fetch_array($open)) {
                                $clbal = $row['clbal'];
                            }
                        }

                        $templatename = strtolower($rowob['smstemplateid']);
                        $prefix = substr($rowob['MobileNumber'], 0, 3);
                        $file = $rowob['billno'];
                        $mobnew = ($prefix == '+91') ? preg_replace('/\s+/', '', substr($rowob['MobileNumber'], 1)) : preg_replace('/\s+/', '', $rowob['MobileNumber']);

                        $array = [];
                        $sql1 = "select * from outbox_smsval where msgid='" . $rowob['msgid'] . "' and Variableval <>'99' order by Variableval asc";
                        $res1 = @odbc_exec($dbhandlein, $sql1);
                        if ($res1) {
                            while ($row1 = odbc_fetch_array($res1)) {
                                $val = ($row1['Smsval'] == '') ? ' - ' : ((substr($row1['Smsval'], 0, 10) == '01/01/1900') ? substr($row1['Smsval'], 11, 5) : $row1['Smsval']);
                                array_push($array, "\"$val\"");
                            }
                        }

                        $mediaBlock = '';
                        if ($clbal > 0 && !empty($file)) {
                            $filename = $file;
                            $filepath = "C:/inetpub/ftproot/Whatsapp/$Whatsapp_hotelcode/$filename.pdf";
                            $desdir = "C:/inetpub/wwwroot/whatsappsms/Files/$Whatsapp_hotelcode";
                            $des = "$desdir/$filename.pdf";
                            if (!file_exists($desdir)) {
                                @mkdir($desdir, 0777, true);
                            }
                            if (file_exists($filepath) && !file_exists($des)) {
                                @copy($filepath, $des);
                            }
                            $mediaUrl = "http://164.52.195.176/whatsappsms/Files/$Whatsapp_hotelcode/$filename.pdf&filename=$filename.pdf";
                            $mediaBlock = ', "media": { "url": "' . $mediaUrl . '", "filename": "' . $filename . '.pdf" }';
                        }

                        if ($clbal > 0) {
                            $payload = '{
                                "apiKey": ' . "\"$whatsapp_access_token\"" . ',
                                "campaignName": ' . "\"$templatename\"" . ',
                                "destination": ' . "\"$mobnew\"" . ',
                                "userName": ' . "\"$smsUsername \"" . ',
                                "source": "VBE",
                                "templateParams": [' . implode(",", $array) . ']' . $mediaBlock . ',
                                "tags": [],
                                "attributes": { "attribute_name": "5" }
                            }';

                            $curl = curl_init();
                            curl_setopt_array($curl, array(
                                CURLOPT_URL => 'https://backend.aisensy.com/campaign/t1/api',
                                CURLOPT_RETURNTRANSFER => true,
                                CURLOPT_TIMEOUT => 30,
                                CURLOPT_CUSTOMREQUEST => 'POST',
                                CURLOPT_POSTFIELDS => $payload,
                                CURLOPT_HTTPHEADER => array('Content-Type: application/json'),
                            ));
                            $response = curl_exec($curl);
                            $curlError = curl_error($curl);
                            curl_close($curl);

                            if ($curlError) {
                                writeLog("AISensy Curl Error for msgid {$rowob['msgid']}: {$curlError}");
                                @odbc_exec($dbhandlein, "Update outbox set whatsappsmsflg='1',notsentflag='1',apiresnotsent=1,reason='Timeout/Error',APIPushdatetime='" . $today . "',APIResponsedatetime='" . date('Y-m-d H:i:s') . "' where msgid='" . $rowob['msgid'] . "'");
                            } else {
                                if (trim($response) == 'Success.') {
                                    writeLog("AISensy Sent successfully for msgid {$rowob['msgid']}");
                                    @odbc_exec($dbhandlein, "Update outbox set whatsappsmsflg='1',notsentflag='0',reason='Success.',pmsreason ='Message Sent',APIPushdatetime='" . $today . "',APIResponsedatetime='" . date('Y-m-d H:i:s') . "' where msgid='" . $rowob['msgid'] . "'");
                                    @odbc_exec($dbhandlein, "update whatsappcount_opening set clbal = isnull(clbal,0)-1 where opdate = '".$today."' and hotel_code ='".$Whatsapp_hotelcode."' and isnull(clbal,0) > 0");
                                } else {
                                    $result = json_decode($response, true);
                                    $errReason = isset($result['errorMessage']) ? $result['errorMessage'] : $response;
                                    writeLog("AISensy Failed for msgid {$rowob['msgid']}: {$errReason}");
                                    @odbc_exec($dbhandlein, "Update outbox set whatsappsmsflg='1',notsentflag='1',reason= '".$errReason."',pmsreason ='',APIPushdatetime='" . $today . "',APIResponsedatetime='" . date('Y-m-d H:i:s') . "' where msgid=" . $rowob['msgid']);
                                }
                            }
                        } else {
                            @odbc_exec($dbhandlein, "Update outbox set whatsappsmsflg='1',notsentflag='1',reason='',APIPushdatetime='" . $today . "',pmsreason ='No Credits Available' where msgid='" . $rowob['msgid'] . "'");
                        }
                    }
                }
            }
            // 2. Microgenn WhatsApp Mode
            else if ($whatsappbusiness == "0" && $whatsappflag == "0" && $whatsappaskev == "0" && $mwhatsapp == "1") {
                $smsobox_WB = "select reason,whatsappsmsflg,ot.HotelCode,* from outbox ot inner join Mas_Hotel mh on ot.HotelCode=mh.HotelCode where CONVERT(varchar(25),datecreated,101)=convert(varchar(25),getdate(),101) and isnull(ot.apiresnotsent,0) = 0 and isnull(mh.inactive,0)=0 and isnull(ot.whatsappsmsflg,0) =0 and ot.HotelCode='" . $Whatsapp_hotelcode . "' order by msgid";
                $outboxstmt_wb = @odbc_exec($dbhandlein, $smsobox_WB);

                if ($outboxstmt_wb) {
                    while ($rowob = odbc_fetch_array($outboxstmt_wb)) {
                        $openqry = "SELECT * FROM whatsappcount_opening WHERE opdate = '".$today."' AND hotel_code = '".$Whatsapp_hotelcode."'";
                        $open = @odbc_exec($dbhandlein, $openqry);
                        $clbal = 0;
                        if ($open) {
                            while ($row = odbc_fetch_array($open)) {
                                $clbal = $row['clbal'];
                            }
                        }

                        $templatename = strtolower($rowob['smstemplateid']);
                        $prefix = substr($rowob['MobileNumber'], 0, 3);
                        $mobnew = ($prefix == '+91') ? preg_replace('/\s+/', '', substr($rowob['MobileNumber'], 1)) : preg_replace('/\s+/', '', $rowob['MobileNumber']);

                        $array = [];
                        $sql1 = "select * from outbox_smsval where msgid='" . $rowob['msgid'] . "' and Variableval <>'99' order by Variableval asc";
                        $res1 = @odbc_exec($dbhandlein, $sql1);
                        if ($res1) {
                            while ($row1 = odbc_fetch_array($res1)) {
                                $val = ($row1['Smsval'] == '') ? ' - ' : ((substr($row1['Smsval'], 0, 10) == '01/01/1900') ? substr($row1['Smsval'], 11, 5) : $row1['Smsval']);
                                array_push($array, "\"$val\"");
                            }
                        }

                        if ($clbal > 0) {
                            $payload = '{
                                "apiKey": ' . "\"$whatsapp_access_token\"" . ',
                                "campaignName": ' . "\"$templatename\"" . ',
                                "destination": ' . "\"$mobnew\"" . ',
                                "userName": ' . "\"$smsUsername \"" . ',
                                "source": "PMS",
                                "templateParams": [' . implode(",", $array) . '],
                                "tags": [],
                                "attributes": { "attribute_name": "5" }
                            }';

                            $curl = curl_init();
                            curl_setopt_array($curl, array(
                                CURLOPT_URL => 'https://wa.microgenn.com/api/hms/webhook/send',
                                CURLOPT_RETURNTRANSFER => true,
                                CURLOPT_TIMEOUT => 30,
                                CURLOPT_CUSTOMREQUEST => 'POST',
                                CURLOPT_POSTFIELDS => $payload,
                                CURLOPT_HTTPHEADER => array('Content-Type: application/json'),
                            ));
                            $response = curl_exec($curl);
                            curl_close($curl);

                            $data = json_decode($response, true);
                            if (isset($data['success']) && $data['success'] == true) {
                                $messageId = $data['messageId'] ?? 'Success';
                                writeLog("Microgenn Sent successfully for msgid {$rowob['msgid']}");
                                @odbc_exec($dbhandlein, "Update outbox set whatsappsmsflg='1',notsentflag='0',reason='" . $messageId . "',pmsreason ='Message Sent',APIPushdatetime='" . $today . "',APIResponsedatetime='" . date('Y-m-d H:i:s') . "' where msgid='" . $rowob['msgid'] . "'");
                                @odbc_exec($dbhandlein, "update whatsappcount_opening set clbal = isnull(clbal,0)-1 where opdate = '".$today."' and hotel_code ='".$Whatsapp_hotelcode."' and isnull(clbal,0) > 0");
                            } else {
                                $errRps = $data['errorMessage'] ?? 'Failed';
                                writeLog("Microgenn Failed for msgid {$rowob['msgid']}: {$errRps}");
                                @odbc_exec($dbhandlein, "Update outbox set whatsappsmsflg='1',notsentflag='1',reason= '".$errRps."' ,pmsreason ='',APIPushdatetime='" . $today . "',APIResponsedatetime='" . date('Y-m-d H:i:s') . "' where msgid=" . $rowob['msgid']);
                            }
                        }
                    }
                }
            }
            // 3. Askeva Provider WhatsApp Mode
            else if ($whatsappaskev == "1" && $whatsappflag == "1" && !empty($whatsappaskev_token)) {
                $smsobox_WB = "select reason,whatsappsmsflg,ot.HotelCode,* from outbox ot inner join Mas_Hotel mh on ot.HotelCode=mh.HotelCode where CONVERT(varchar(25),datecreated,101)=convert(varchar(25),getdate(),101) and isnull(ot.apiresnotsent,0) = 0 and isnull(mh.inactive,0)=0 and isnull(ot.whatsappsmsflg,0) =0 and ot.HotelCode='" . $Whatsapp_hotelcode . "' order by msgid";
                $outboxstmt_wb = @odbc_exec($dbhandlein, $smsobox_WB);

                if ($outboxstmt_wb) {
                    while ($rowob = odbc_fetch_array($outboxstmt_wb)) {
                        $openqry = "SELECT * FROM whatsappcount_opening WHERE opdate = '".$today."' AND hotel_code = '".$Whatsapp_hotelcode."'";
                        $open = @odbc_exec($dbhandlein, $openqry);
                        $clbal = 0;
                        if ($open) {
                            while ($row = odbc_fetch_array($open)) {
                                $clbal = $row['clbal'];
                            }
                        }

                        $templatename = strtolower($rowob['smstemplateid']);
                        $prefix = substr($rowob['MobileNumber'], 0, 3);
                        $mobnew = ($prefix == '+91') ? preg_replace('/\s+/', '', substr($rowob['MobileNumber'], 1)) : preg_replace('/\s+/', '', $rowob['MobileNumber']);

                        $array = [];
                        $sql1 = "select * from outbox_smsval where msgid='" . $rowob['msgid'] . "' and Variableval <>'99' order by Variableval asc";
                        $res1 = @odbc_exec($dbhandlein, $sql1);
                        if ($res1) {
                            while ($row1 = odbc_fetch_array($res1)) {
                                $val = ($row1['Smsval'] == '') ? ' - ' : ((substr($row1['Smsval'], 0, 10) == '01/01/1900') ? substr($row1['Smsval'], 11, 5) : $row1['Smsval']);
                                array_push($array, "\"$val\"");
                            }
                        }

                        if ($clbal > 0) {
                            $payload = '{
                                "template": ' . "\"$templatename\"" . ',
                                "mobile": ' . "\"$mobnew\"" . ',
                                "parameters": [' . implode(",", $array) . ']
                            }';

                            $curl = curl_init();
                            curl_setopt_array($curl, array(
                                CURLOPT_URL => 'https://waapi.hotelierhms.com/v1/message/send-message?token=' . $whatsappaskev_token,
                                CURLOPT_RETURNTRANSFER => true,
                                CURLOPT_TIMEOUT => 30,
                                CURLOPT_CUSTOMREQUEST => 'POST',
                                CURLOPT_POSTFIELDS => $payload,
                                CURLOPT_HTTPHEADER => array('Content-Type: application/json'),
                            ));
                            $response = curl_exec($curl);
                            curl_close($curl);

                            $data = json_decode($response, true);
                            if (isset($data['success']) && $data['success'] == true) {
                                writeLog("Askeva Sent successfully for msgid {$rowob['msgid']}");
                                @odbc_exec($dbhandlein, "Update outbox set whatsappsmsflg='1',notsentflag='0',reason='Success',pmsreason ='Message Sent',APIPushdatetime='" . $today . "',APIResponsedatetime='" . date('Y-m-d H:i:s') . "' where msgid='" . $rowob['msgid'] . "'");
                                @odbc_exec($dbhandlein, "update whatsappcount_opening set clbal = isnull(clbal,0)-1 where opdate = '".$today."' and hotel_code ='".$Whatsapp_hotelcode."' and isnull(clbal,0) > 0");
                            } else {
                                $errRps = $data['message'] ?? $response;
                                writeLog("Askeva Failed for msgid {$rowob['msgid']}: {$errRps}");
                                @odbc_exec($dbhandlein, "Update outbox set whatsappsmsflg='1',notsentflag='1',reason= '".$errRps."' ,pmsreason ='',APIPushdatetime='" . $today . "',APIResponsedatetime='" . date('Y-m-d H:i:s') . "' where msgid=" . $rowob['msgid']);
                            }
                        }
                    }
                }
            }

            @odbc_close($dbhandlein);
        }

        @odbc_close($dbhandle);
        writeLog("Sync cycle completed. Sleeping for {$pollInterval}s...");

    } catch (Exception \$e) {
        writeLog("DAEMON EXCEPTION: " . \$e->getMessage());
    }

    sleep($pollInterval);
}
?>`;

    // 4. PowerShell Service Management Script
    const psScript = `# Windows Service Management Helper for ${serviceName}
param (
    [Parameter(Mandatory=\$false)]
    [ValidateSet('status','start','stop','restart','logs','uninstall')]
    [string]\$Action = 'status'
)

$ServiceName = "${serviceName}"

switch (\$Action) {
    'status' {
        Get-Service -Name \$ServiceName -ErrorAction SilentlyContinue
    }
    'start' {
        Start-Service -Name \$ServiceName
        Write-Host "Service \$ServiceName started." -ForegroundColor Green
    }
    'stop' {
        Stop-Service -Name \$ServiceName
        Write-Host "Service \$ServiceName stopped." -ForegroundColor Yellow
    }
    'restart' {
        Restart-Service -Name \$ServiceName
        Write-Host "Service \$ServiceName restarted." -ForegroundColor Cyan
    }
    'logs' {
        Get-Content "${workingDirectory}\\logs\\daemon.log" -Tail 50 -Wait
    }
    'uninstall' {
        Stop-Service -Name \$ServiceName -ErrorAction SilentlyContinue
        nssm remove \$ServiceName confirm
        Write-Host "Service \$ServiceName uninstalled." -ForegroundColor Red
    }
}
`;

    // 5. README Installation Guide
    const readmeGuide = `# WhatsApp PHP Windows Service Installation Guide (ODBC SQL Server)

## Overview
This package wraps your WhatsApp synchronization PHP script into a continuous background Windows Service (daemon). It runs via **WinSW** or **NSSM**, executing your SQL Server ODBC queries every 30 seconds without browser timeouts or Apache/IIS page refresh limits.

## Option A: Using WinSW (Recommended)
1. Download **WinSW.exe** (rename it to \`${serviceName}.exe\`).
2. Place \`${serviceName}.exe\` and \`${serviceName}.xml\` in \`${workingDirectory}\`.
3. Open Command Prompt as **Administrator** and run:
   \`\`\`cmd
   ${serviceName}.exe install
   ${serviceName}.exe start
   \`\`\`

## Option B: Using NSSM (Non-Sucking Service Manager)
1. Download NSSM from \`https://nssm.cc/\` and place \`nssm.exe\` in your PATH.
2. Save and run the generated \`install-service.bat\` script as **Administrator**.

## Managing the Service via PowerShell
- **Check Status**: \`./manage-service.ps1 -Action status\`
- **View Live Logs**: \`./manage-service.ps1 -Action logs\`
- **Restart Service**: \`./manage-service.ps1 -Action restart\`
`;

    res.json({
      success: true,
      files: {
        "winsw.xml": winswXml,
        "install-service.bat": nssmBatch,
        "whatsapp-daemon.php": phpDaemonCode,
        "manage-service.ps1": psScript,
        "README.md": readmeGuide
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: AI Assistant for PHP WhatsApp Sync & Windows Services
app.post("/api/ai-assist", async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({ 
        success: false, 
        error: "GEMINI_API_KEY is not configured. Please set it in AI Studio secrets." 
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `You are an expert Windows systems engineer and PHP developer specializing in running PHP ODBC daemons as robust Windows Services (using WinSW or NSSM) connecting to SQL Server for WhatsApp automation & synchronization units (AISensy, Askeva, Microgenn).`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `Context: ${JSON.stringify(context || {})}\n\nQuestion/Request: ${prompt}` }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.2,
      }
    });

    res.json({ success: true, text: response.text });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Real-time Health Check & Polling Endpoint
app.get("/api/health-check", (req, res) => {
  const serviceState = req.query.state || 'Running';
  
  // Simulate metrics based on state
  const isRunning = serviceState === 'Running';
  const memoryUsageMB = isRunning ? (22 + Math.floor(Math.random() * 8)) : 0;
  const cpuLoadPercent = isRunning ? (1 + Math.random() * 4).toFixed(1) : '0.0';
  
  res.json({
    success: true,
    status: serviceState, // 'Running', 'Stopped', 'Failed', 'Starting'
    metrics: {
      memoryUsageMB,
      cpuLoadPercent: parseFloat(cpuLoadPercent as string),
      odbcConnected: isRunning,
      queuePending: isRunning ? Math.floor(Math.random() * 3) : 0,
      uptimeSeconds: isRunning ? Math.floor(Date.now() / 1000) % 86400 : 0,
      lastPing: new Date().toLocaleTimeString(),
      errorRate: isRunning ? "0.0%" : "N/A"
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WhatsApp Windows Service Generator running on http://localhost:${PORT}`);
  });
}

startServer();
