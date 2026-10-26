"""Backup encryption, Google Drive verification and guarded retention. No secret logging."""
import hashlib
import json
import pathlib
import secrets
import ssl
import io
import tarfile
import urllib.error
import urllib.parse
import urllib.request

import pyzipper
import pyrage

APP = 'kirayeal-disaster-backup-v1'
OWNER = 'kirayeal.az@gmail.com'


class BackupError(Exception):
    """Only fixed, non-secret error codes may cross the runner boundary."""


def digest(file, algorithm='sha256'):
    value = hashlib.new(algorithm)
    with open(file, 'rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(chunk)
    return value.hexdigest()


def encrypt(stage, output, password, memory_files=None):
    if not isinstance(password, str) or len(password) < 16:
        raise BackupError('encryption_password_invalid')
    stage = pathlib.Path(stage)
    files = sorted(p for p in stage.rglob('*') if p.is_file())
    manifest = {p.relative_to(stage).as_posix(): digest(p) for p in files}
    memory_files = memory_files or {}
    for name, content in memory_files.items():
        if pathlib.PurePosixPath(name).is_absolute() or '..' in pathlib.PurePosixPath(name).parts:
            raise BackupError('unsafe_archive_path')
        manifest[name] = hashlib.sha256(content).hexdigest()
    encoded = password.encode('utf-8')
    with pyzipper.AESZipFile(output, 'w', compression=pyzipper.ZIP_DEFLATED,
                            encryption=pyzipper.WZ_AES) as archive:
        archive.setpassword(encoded)
        archive.setencryption(pyzipper.WZ_AES, nbits=256)
        for file in files:
            archive.write(file, file.relative_to(stage).as_posix())
        for name, content in memory_files.items():
            archive.writestr(name, content)
        archive.writestr('FILE-MANIFEST.json', json.dumps(manifest, indent=2))
    with pyzipper.AESZipFile(output) as archive:
        archive.setpassword(encoded)
        if not all(i.flag_bits & 1 and i.wz_aes_strength == 3 for i in archive.infolist()):
            raise BackupError('archive_not_fully_encrypted')
        for name, expected in manifest.items():
            actual = hashlib.sha256()
            with archive.open(name) as stream:
                for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                    actual.update(chunk)
            if actual.hexdigest() != expected:
                raise BackupError('encrypted_archive_hash_mismatch')
        # Also check the internal manifest and reject a genuinely different password.
        if json.loads(archive.read('FILE-MANIFEST.json')) != manifest:
            raise BackupError('encrypted_manifest_mismatch')
    try:
        with pyzipper.AESZipFile(output) as archive:
            archive.setpassword(secrets.token_bytes(32))
            archive.read('FILE-MANIFEST.json')
    except (RuntimeError, ValueError):
        return {'files': len(manifest) + 1, 'sha256': digest(output),
                'bytes': pathlib.Path(output).stat().st_size, 'verified': True}
    raise BackupError('wrong_archive_password_accepted')


def retention_candidates(files, folder_id, daily=30, recent=10):
    """Keep at least 30 different UTC dates plus the 10 latest verified copies."""
    managed = [f for f in files if not f.get('trashed')
               and folder_id in f.get('parents', [])
               and f.get('appProperties', {}).get('app') == APP
               and f.get('appProperties', {}).get('status') == 'verified'
               and f.get('name', '').startswith('Kirayeal-') and f.get('name', '').endswith(('.zip', '.tar.gz.age'))]
    managed.sort(key=lambda f: f.get('createdTime', ''), reverse=True)
    keep = {f['id'] for f in managed[:recent]}
    days = set()
    for file in managed:
        day = file.get('createdTime', '')[:10]
        if day and day not in days and len(days) < daily:
            days.add(day)
            keep.add(file['id'])
    return [f['id'] for f in managed if f['id'] not in keep]


def encrypt_for_recipient(stage, output, public_key, memory_files=None):
    """Streaming age encryption: no decryption key or archive password on the worker."""
    try:
        recipient = pyrage.x25519.Recipient.from_str(public_key)
    except Exception:
        raise BackupError('invalid_public_recovery_key') from None
    stage, output = pathlib.Path(stage), pathlib.Path(output)
    files = sorted(p for p in stage.rglob('*') if p.is_file())
    manifest = {p.relative_to(stage).as_posix(): digest(p) for p in files}
    memory_files = memory_files or {}
    manifest.update({name: hashlib.sha256(content).hexdigest() for name, content in memory_files.items()})
    payload = output.with_name('temporary-payload.tar.gz')
    try:
        with tarfile.open(payload, 'w:gz') as archive:
            for file in files:
                archive.add(file, arcname=file.relative_to(stage).as_posix(), recursive=False)
            for name, content in {**memory_files, 'FILE-MANIFEST.json': json.dumps(manifest, indent=2).encode()}.items():
                if pathlib.PurePosixPath(name).is_absolute() or '..' in pathlib.PurePosixPath(name).parts:
                    raise BackupError('unsafe_archive_path')
                item = tarfile.TarInfo(name)
                item.size, item.mode = len(content), 0o600
                archive.addfile(item, io.BytesIO(content))
        # All source files and the tar stream are read before sealing; owner-only recovery tests
        # establish decryption. Public-key-only workers cannot honestly claim a restore test.
        with tarfile.open(payload) as archive:
            for name, expected in manifest.items():
                actual = hashlib.sha256()
                with archive.extractfile(name) as source:
                    for chunk in iter(lambda: source.read(1024*1024), b''):
                        actual.update(chunk)
                if actual.hexdigest() != expected:
                    raise BackupError('payload_hash_mismatch')
        pyrage.encrypt_file(str(payload), str(output), [recipient])
    finally:
        payload.unlink(missing_ok=True)
    return {'files': len(manifest)+1, 'sha256': digest(output), 'bytes': output.stat().st_size,
            'source_manifest_verified': True, 'restore_test_this_copy': False, 'encryption': 'age-X25519'}


class Drive:
    def __init__(self, config):
        form = urllib.parse.urlencode({
            'client_id': config['client_id'], 'client_secret': config['client_secret'],
            'refresh_token': config['refresh_token'], 'grant_type': 'refresh_token'}).encode()
        self.token = self.request('https://oauth2.googleapis.com/token', form,
                                  headers={'Content-Type': 'application/x-www-form-urlencoded'})['access_token']
        user = self.api('about', query={'fields': 'user(emailAddress)'})['user']
        if user.get('emailAddress', '').lower() != OWNER:
            raise BackupError('wrong_google_account')
        self.folder = config.get('folder_id')
        if not self.folder:
            matches = self.api('files', query={
                'q': "trashed=false and mimeType='application/vnd.google-apps.folder' and "
                     "appProperties has { key='app' and value='" + APP + "' }",
                'fields': 'files(id)', 'pageSize': '100'})['files']
            if len(matches) > 1:
                raise BackupError('ambiguous_backup_folder')
            self.folder = matches[0]['id'] if matches else self.api('files', data={
                'name': 'Kirayeal ehtiyat', 'mimeType': 'application/vnd.google-apps.folder',
                'appProperties': {'app': APP}})['id']
        folder = self.api('files/' + self.folder, query={
            'fields': 'id,trashed,mimeType,owners(emailAddress),capabilities(canAddChildren)'})
        if folder.get('trashed') or folder.get('mimeType') != 'application/vnd.google-apps.folder' \
                or not any(o.get('emailAddress', '').lower() == OWNER for o in folder.get('owners', [])) \
                or not folder.get('capabilities', {}).get('canAddChildren'):
            raise BackupError('invalid_backup_folder')
        permissions = self.api('files/' + self.folder + '/permissions',
                               query={'fields': 'permissions(type)'})['permissions']
        if any(p.get('type') in ('anyone', 'domain') for p in permissions):
            raise BackupError('backup_folder_is_public')

    def request(self, url, data=None, method=None, headers=None, raw=False):
        request_headers = dict(headers or {})
        if hasattr(self, 'token'):
            request_headers['Authorization'] = 'Bearer ' + self.token
        request = urllib.request.Request(url, data=data, method=method, headers=request_headers)
        try:
            with urllib.request.urlopen(request, timeout=120, context=ssl.create_default_context()) as response:
                return response.read() if raw else json.load(response)
        except (urllib.error.URLError, ValueError, KeyError):
            raise BackupError('google_request_failed') from None

    def api(self, path, data=None, method=None, query=None, raw=False):
        url = 'https://www.googleapis.com/drive/v3/' + path
        if query:
            url += '?' + urllib.parse.urlencode(query)
        return self.request(url, None if data is None else json.dumps(data).encode(),
                            method, {'Content-Type': 'application/json'}, raw)

    def upload(self, file, verified, kind='backup'):
        file = pathlib.Path(file)
        if kind not in ('backup', 'recovery_key'):
            raise BackupError('invalid_upload_kind')
        marker = {'app': APP, 'kind': kind, 'status': 'pending', 'sha256': verified['sha256']}
        metadata = {'name': file.name, 'parents': [self.folder],
                    'appProperties': marker, 'properties': marker}
        request = urllib.request.Request(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id',
            data=json.dumps(metadata).encode(), headers={
                'Authorization': 'Bearer ' + self.token, 'Content-Type': 'application/json',
                'X-Upload-Content-Type': 'application/octet-stream',
                'X-Upload-Content-Length': str(file.stat().st_size)}, method='POST')
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                session = response.headers['Location']
            parsed = urllib.parse.urlsplit(session)
            if parsed.scheme != 'https' or parsed.hostname != 'www.googleapis.com':
                raise BackupError('unexpected_upload_host')
            with file.open('rb') as stream:
                created = self.request(session, stream, method='PUT', headers={
                    'Content-Type': 'application/octet-stream', 'Content-Length': str(file.stat().st_size)})
        except urllib.error.URLError:
            raise BackupError('drive_upload_failed') from None
        file_id = created['id']
        remote = self.api('files/' + file_id, query={'fields': 'id,size,sha256Checksum,createdTime,webViewLink'})
        if int(remote.get('size', -1)) != verified['bytes']:
            raise BackupError('drive_size_mismatch')
        if remote.get('sha256Checksum'):
            if remote['sha256Checksum'] != verified['sha256']:
                raise BackupError('drive_checksum_mismatch')
        else:
            # Google does not always return SHA-256; verify by downloading the encrypted copy.
            payload = self.api('files/' + file_id, query={'alt': 'media'}, raw=True)
            if hashlib.sha256(payload).hexdigest() != verified['sha256']:
                raise BackupError('drive_download_hash_mismatch')
        marker = {'app': APP, 'kind': kind, 'status': 'verified', 'sha256': verified['sha256']}
        self.api('files/' + file_id, data={'appProperties': marker, 'properties': marker}, method='PATCH')
        return {**remote, 'folder_id': self.folder, 'sha256_verified': True}

    def retain(self):
        files, page = [], None
        while True:
            query = {'q': "'" + self.folder + "' in parents and trashed=false",
                     'fields': 'nextPageToken,files(id,name,parents,appProperties,createdTime,trashed)',
                     'pageSize': '1000'}
            if page:
                query['pageToken'] = page
            data = self.api('files', query=query)
            files.extend(data['files'])
            page = data.get('nextPageToken')
            if not page:
                break
        candidates = retention_candidates(files, self.folder)
        for file_id in candidates:
            # Move only this application's verified copies to Trash; never hard-delete.
            self.api('files/' + file_id, data={'trashed': True}, method='PATCH')
        return len(candidates)
