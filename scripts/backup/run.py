"""Run outside the website host. Configuration comes only from a secret environment value.

Never print configuration, SQL output, provider response bodies or subprocess stderr.
"""
import datetime as dt
import email.message
import json
import os
import pathlib
import shutil
import smtplib
import ssl
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request

import psycopg
from psycopg import sql

from core import BackupError, Drive, OWNER, digest, encrypt_for_recipient

ROOT = pathlib.Path(__file__).resolve().parents[2]
CA = pathlib.Path(__file__).with_name('supabase-root-2021.crt')


def command(args, env=None, output=None, timeout=900):
    try:
        result = subprocess.run(args, env=env, stdout=output or subprocess.PIPE,
                                stderr=subprocess.PIPE, timeout=timeout, check=False)
        if result.returncode:
            raise BackupError('backup_command_failed')
        return result.stdout
    except (OSError, subprocess.TimeoutExpired):
        raise BackupError('backup_command_failed') from None


def tool(name):
    suffix = '.exe' if os.name == 'nt' else ''
    return str(pathlib.Path(os.environ.get('PG_BIN', '/usr/lib/postgresql/17/bin')) / (name + suffix))


def source(config):
    db = config['database']
    return dict(host=db['host'], port=int(db['port']), user=db['user'], password=db['password'],
                dbname=db.get('name', 'postgres'), sslmode='verify-full', sslrootcert=str(CA),
                connect_timeout=20, application_name='kirayeal-cloud-backup')


def database(config, stage):
    params = source(config)
    env = {**os.environ, 'PGHOST': params['host'], 'PGPORT': str(params['port']),
           'PGUSER': params['user'], 'PGPASSWORD': params['password'], 'PGDATABASE': params['dbname'],
           'PGSSLMODE': 'verify-full', 'PGSSLROOTCERT': str(CA), 'PGCONNECT_TIMEOUT': '20'}
    # The child database tools do not need cloud/OAuth/archive credentials.
    env.pop('KIRAYE_BACKUP_CONFIG', None)
    with psycopg.connect(**params, autocommit=True) as client:
        client.execute('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
        server_major = int(client.execute('SHOW server_version_num').fetchone()[0]) // 10000
        version = command([tool('pg_dump'), '--version']).decode()
        import re
        if int(re.search(r'PostgreSQL\) (\d+)', version)[1]) != server_major:
            raise BackupError('postgresql_major_version_mismatch')
        snapshot = client.execute('SELECT pg_export_snapshot()').fetchone()[0]
        tables = client.execute("""SELECT n.nspname,c.relname FROM pg_class c
            JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN ('r','p')
            AND n.nspname NOT IN ('pg_catalog','information_schema')
            AND n.nspname NOT LIKE 'pg_toast%%' ORDER BY 1,2""").fetchall()
        counts = {}
        for schema, table in tables:
            counts[schema + '.' + table] = client.execute(
                sql.SQL('SELECT count(*) FROM {}.{}').format(sql.Identifier(schema), sql.Identifier(table))).fetchone()[0]
        buckets = client.execute('SELECT id,name,public FROM storage.buckets ORDER BY id').fetchall()
        objects = client.execute('SELECT id,bucket_id,name,version FROM storage.objects ORDER BY bucket_id,name').fetchall()
        command([tool('pg_dump'), '-w', '--format=custom', '--lock-wait-timeout=20000',
                 '--snapshot=' + snapshot, '--file=' + str(stage / 'database.dump')], env)
        client.rollback()
    command([tool('pg_dumpall'), '-w', '--roles-only', '--no-role-passwords',
             '--file=' + str(stage / 'roles.sql')], env)
    contents = command([tool('pg_restore'), '--list', str(stage / 'database.dump')], env)
    (stage / 'archive-contents.txt').write_bytes(contents)
    command([tool('pg_restore'), '--file=' + os.devnull, str(stage / 'database.dump')], env)
    inventory = {'buckets': [dict(zip(('id', 'name', 'public'), row)) for row in buckets],
                 'objects': [dict(zip(('id', 'bucket_id', 'name', 'version'), map(str, row))) for row in objects]}
    (stage / 'storage-inventory.json').write_text(json.dumps(inventory, indent=2), encoding='utf-8')
    (stage / 'record-counts.json').write_text(json.dumps(counts, indent=2), encoding='utf-8')
    return inventory, counts, server_major


def supabase_request(config, endpoint):
    ref = config['supabase']['project_ref']
    request = urllib.request.Request('https://api.supabase.com/v1/projects/' + ref + '/' + endpoint,
                                     headers={'Authorization': 'Bearer ' + config['supabase']['read_token']})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.load(response)


def pictures(config, inventory, stage):
    directory = stage / 'storage-files'
    directory.mkdir()
    ref = config['supabase']['project_ref']
    # Secret is used only in memory to retrieve private and archived objects too.
    keys = supabase_request(config, 'api-keys?reveal=true')
    key = next((k.get('api_key') for k in keys if k.get('type') == 'secret' and k.get('api_key')), None)
    if not key:
        key = next((k.get('api_key') for k in keys if k.get('name') == 'service_role'), None)
    if not key:
        raise BackupError('storage_service_credential_unavailable')
    buckets = {b['id']: b for b in inventory['buckets']}
    manifest = []
    for item in inventory['objects']:
        bucket, name = item['bucket_id'], item['name']
        encoded = '/'.join(urllib.parse.quote(p, safe='') for p in [bucket, *name.split('/')])
        mode = 'public' if buckets[bucket]['public'] else 'authenticated'
        url = 'https://' + ref + '.supabase.co/storage/v1/object/' + mode + '/' + encoded
        headers = {'apikey': key}
        if not key.startswith('sb_secret_'):
            headers['Authorization'] = 'Bearer ' + key
        import hashlib
        filename = hashlib.sha256((bucket + '/' + name).encode()).hexdigest()
        target = directory / filename
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=120) as response, target.open('wb') as output:
            shutil.copyfileobj(response, output)
        manifest.append({**item, 'file': filename, 'bytes': target.stat().st_size, 'sha256': digest(target)})
    keys, key = None, None
    # Never claim a consistent snapshot if the object inventory changed while files were copied.
    with psycopg.connect(**source(config)) as client:
        current = client.execute('SELECT id,bucket_id,name,version FROM storage.objects ORDER BY bucket_id,name').fetchall()
    actual = [dict(zip(('id', 'bucket_id', 'name', 'version'), map(str, row))) for row in current]
    if actual != inventory['objects']:
        raise BackupError('storage_changed_during_backup_retry_needed')
    (stage / 'storage-files-manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    return len(manifest)


def host_snapshot(config, stage, private):
    ssh = config['server']
    key, known = private / 'backup-readonly-key', private / 'known_hosts'
    key.write_text(ssh['readonly_key'], encoding='utf-8')
    known.write_text(ssh['known_hosts'], encoding='utf-8')
    key.chmod(0o600)
    known.chmod(0o600)
    with (stage / 'server-source-and-settings.tar.gz').open('wb') as output:
        command(['ssh', '-F', os.devnull, '-i', str(key), '-p', str(int(ssh.get('port', 22))),
                 '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes',
                 '-o', 'UserKnownHostsFile=' + str(known), '-o', 'ConnectTimeout=20',
                 ssh['user'] + '@' + ssh['host'], 'kirayeal-backup-export'], output=output)
    import tarfile
    with tarfile.open(stage / 'server-source-and-settings.tar.gz') as archive:
        names = archive.getnames()
        if 'application/app.js' not in names or 'server-settings/public_html/.htaccess' not in names:
            raise BackupError('server_settings_snapshot_incomplete')
        member = archive.getmember('application/DEPLOYED-RELEASE.json')
        if member.size > 16384:
            raise BackupError('invalid_deployed_release_metadata')
        return json.load(archive.extractfile(member))


def notify(config, stage):
    smtp = config['notification']
    message = email.message.EmailMessage()
    message['From'] = smtp['sender']
    message['To'] = OWNER
    message['Subject'] = 'kirayeal.az — ehtiyat alınmadı'
    message.set_content('Avtomatik ehtiyat uğursuz oldu. Mərhələ: ' + stage +
                        '\nƏvvəlki nüsxələr silinməyib. GitHub Actions jurnalını yoxlayın.\n' +
                        'https://github.com/kirayeazofficial-star/kiraye-az/actions')
    with smtplib.SMTP_SSL(smtp['host'], 465, context=ssl.create_default_context(), timeout=30) as connection:
        connection.login(smtp['user'], smtp['password'])
        connection.send_message(message)


def main():
    config, step = None, 'configuration'
    try:
        config = json.loads(os.environ.pop('KIRAYE_BACKUP_CONFIG'))
        for section, fields in {'database': ['host', 'port', 'user', 'password'],
                                'supabase': ['project_ref', 'read_token'],
                                'drive': ['client_id', 'client_secret', 'refresh_token'],
                                'server': ['host', 'user', 'readonly_key', 'known_hosts']}.items():
            if not all(config[section].get(field) for field in fields):
                raise BackupError('missing_configuration')
        if not config.get('recipient_public_key', '').startswith('age1'):
            raise BackupError('missing_public_recovery_key')
        if 'encryption_password' in config or 'identity_private_key' in config:
            raise BackupError('decryption_secret_must_not_be_on_cloud_worker')
        os.umask(0o077)
        with tempfile.TemporaryDirectory(prefix='kirayeal-backup-') as temp:
            private = pathlib.Path(temp)
            stage = private / 'payload'
            stage.mkdir(mode=0o700)
            step = 'google_identity'
            drive = Drive(config['drive'])
            step = 'postgresql_database'
            inventory, counts, major = database(config, stage)
            step = 'all_storage_files'
            photo_count = pictures(config, inventory, stage)
            step = 'server_settings'
            deployed = host_snapshot(config, stage, private)
            step = 'source_code'
            import re
            commit = deployed.get('commit', '')
            expected = os.environ.get('KIRAYE_BACKUP_DEPLOY_COMMIT', '')
            if not re.fullmatch(r'[a-f0-9]{40}', commit) or (expected and expected != commit):
                raise BackupError('deployed_source_commit_mismatch')
            command(['git', '-C', str(ROOT), 'archive', '--format=tar.gz',
                     '--output=' + str(stage / 'source-code.tar.gz'), commit])
            checkout = command(['git', '-C', str(ROOT), 'rev-parse', 'HEAD']).decode().strip()
            shutil.copyfile(ROOT / 'docs' / 'DISASTER-RECOVERY.md', stage / 'BERPA-TELIMATI.md')
            step = 'auth_settings'
            # Auth/provider secrets go straight from memory into the encrypted archive.
            # No raw API keys or OAuth refresh credentials are included in the payload.
            auth = json.dumps(supabase_request(config, 'config/auth'), ensure_ascii=False).encode()
            manifest = {'created_at': dt.datetime.now(dt.timezone.utc).isoformat(),
                        'database_major': major, 'counts': counts, 'photos': photo_count,
                        'source_checkout': checkout, 'deployed_release': deployed, 'restore_test_this_copy': False,
                        'database_archive_read_verified': True, 'auth_settings_encrypted': True,
                        'api_keys_exported': False, 'ssh_private_key_exported': False,
                        'registrar_account_verified': False, 'payments_enabled_by_backup': False}
            (stage / 'BACKUP-MANIFEST.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
            step = 'encryption'
            archive = private / ('Kirayeal-' + dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '.tar.gz.age')
            verified = encrypt_for_recipient(stage, archive, config['recipient_public_key'], {'auth-config.json': auth})
            auth = None
            step = 'drive_upload_verification'
            remote = drive.upload(archive, verified)
            step = 'retention'
            trashed = drive.retain()
            # Only non-secret, remotely verified metadata reaches Actions logs.
            print(json.dumps({'ok': True, 'drive': remote, 'sha256': verified['sha256'],
                              'previous_copies_moved_to_trash': trashed,
                              'counts': counts, 'photos': photo_count}))
    except Exception:
        delivered = False
        if config:
            try:
                notify(config, step)
                delivered = True
            except Exception:
                pass
        print(json.dumps({'ok': False, 'stage': step, 'failure_email_sent': delivered,
                          'note': 'No source records were modified; previous backups remain.'}))
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
