// Google Apps Script, owned by kirayeal.az@gmail.com. No secrets belong in this source.
// Script Properties: GITHUB_ACTIONS_TOKEN (this repo, Actions read/write), BACKUP_FOLDER_ID.
const BACKUP_OWNER = 'kirayeal.az@gmail.com';
const BACKUP_REPO = 'kirayeazofficial-star/kiraye-az';
const BACKUP_APP = 'kirayeal-disaster-backup-v1';

function ownerOnly() {
  if (Session.getEffectiveUser().getEmail().toLowerCase() !== BACKUP_OWNER) throw new Error('wrong_owner');
}
function alertOnce(key, message) {
  const properties = PropertiesService.getScriptProperties();
  const alerts = JSON.parse(properties.getProperty('RECENT_ALERTS') || '{}');
  if (alerts[key]) return;
  MailApp.sendEmail(BACKUP_OWNER, 'kirayeal.az — ehtiyat xəbərdarlığı', message);
  alerts[key] = Date.now();
  const recent = Object.entries(alerts).sort((a,b) => b[1]-a[1]).slice(0,64);
  properties.setProperty('RECENT_ALERTS', JSON.stringify(Object.fromEntries(recent)));
}
function github(path, options) {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_ACTIONS_TOKEN');
  if (!token) throw new Error('missing_github_actions_token');
  return UrlFetchApp.fetch('https://api.github.com/repos/' + BACKUP_REPO + '/' + path, {
    method: options && options.method || 'get', muteHttpExceptions: true,
    headers: {Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json'},
    contentType: 'application/json', payload: options && options.payload
  });
}
function requestDailyBackup() {
  ownerOnly();
  try {
    const response = github('actions/workflows/disaster-backup.yml/dispatches', {
      method: 'post', payload: JSON.stringify({ref: 'main', inputs: {reason: 'daily-google-clock', expected_commit: ''}})
    });
    if (response.getResponseCode() !== 204) throw new Error('dispatch_failed');
    PropertiesService.getScriptProperties().setProperty('LAST_DISPATCH', new Date().toISOString());
  } catch (error) {
    alertOnce('dispatch-' + new Date().toISOString().slice(0, 10), 'Gündəlik ehtiyat işi başlaya bilmədi. GitHub girişini və avtomatik işi yoxlayın. Əvvəlki ehtiyatlar saxlanılıb.');
    throw new Error('backup_dispatch_failed');
  }
}
function checkBackupHealth() {
  ownerOnly();
  const properties = PropertiesService.getScriptProperties();
  try {
    const runsResponse = github('actions/workflows/disaster-backup.yml/runs?event=workflow_dispatch&per_page=10');
    if (runsResponse.getResponseCode() !== 200) throw new Error('run_status_unavailable');
    const runs = JSON.parse(runsResponse.getContentText()).workflow_runs || [];
    const recentFailure = runs.find(run => ['failure', 'cancelled', 'timed_out', 'action_required'].includes(run.conclusion));
    if (recentFailure && Date.now() - Date.parse(recentFailure.created_at) < 86400000) {
      alertOnce('run-' + recentFailure.id, 'Ehtiyat işi uğursuz oldu: ' + recentFailure.html_url + '\nƏvvəlki nüsxələr saxlanılıb.');
    }
    const folder = properties.getProperty('BACKUP_FOLDER_ID');
    if (!folder || !/^[A-Za-z0-9_-]+$/.test(folder)) throw new Error('missing_backup_folder');
    const q = "'" + folder + "' in parents and trashed=false and properties has { key='app' and value='" + BACKUP_APP + "' } and properties has { key='kind' and value='backup' } and properties has { key='status' and value='verified' }";
    const response = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files?q=' + encodeURIComponent(q) + '&orderBy=createdTime%20desc&pageSize=1&fields=files(id,createdTime)', {
      headers: {Authorization: 'Bearer ' + ScriptApp.getOAuthToken()}, muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) throw new Error('drive_status_unavailable');
    const files = JSON.parse(response.getContentText()).files || [];
    if (!files.length || Date.now() - Date.parse(files[0].createdTime) > 30 * 3600000) {
      alertOnce('stale-' + new Date().toISOString().slice(0, 10), 'Google Drive-da son 30 saat ərzində yoxlanmış yeni ehtiyat yoxdur. Kompüterdən və hostinqdən asılı olmayan avtomatik işi yoxlayın.');
    } else properties.setProperty('LAST_VERIFIED_BACKUP', files[0].createdTime);
  } catch (error) {
    alertOnce('monitor-' + new Date().toISOString().slice(0, 10), 'Ehtiyat nəzarəti nəticəni yoxlaya bilmədi. Google/GitHub icazələrini yoxlayın. Bu, ehtiyatın uğurlu olması kimi qəbul edilmir.');
    throw new Error('backup_monitor_failed');
  }
}
function installBackupTriggers() {
  ownerOnly();
  // Delete only this project's two known triggers, preserving other automation.
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (['requestDailyBackup', 'checkBackupHealth'].includes(trigger.getHandlerFunction())) ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger('requestDailyBackup').timeBased().everyDays(1).atHour(3).nearMinute(17).inTimezone('Asia/Baku').create();
  ScriptApp.newTrigger('checkBackupHealth').timeBased().everyHours(1).create();
}
function testBackupAlert() {
  ownerOnly();
  MailApp.sendEmail(BACKUP_OWNER, 'kirayeal.az — ehtiyat bildirişi sınağı', 'Bu, yalnız sahibə göndərilən sınaqdır. Məktubun faktiki çatdığını təsdiqləyin. Avtomatik ehtiyatın öz nəticəsi ayrıca yoxlanmalıdır.');
}
