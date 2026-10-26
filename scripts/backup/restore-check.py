"""Restore ONLY to a new local, temporary PostgreSQL 17 cluster; no source DSN accepted."""
import argparse
import getpass
import hashlib
import json
import os
import pathlib
import re
import secrets
import socket
import subprocess
import tempfile
import tarfile
import urllib.parse

import psycopg
from psycopg import sql
import pyzipper
import pyrage
from core import digest


def run(bin_dir, name, args, env, capture=False):
    suffix = '.exe' if os.name == 'nt' else ''
    process = subprocess.run([str(bin_dir/(name+suffix)), *args], env=env,
                             stdout=subprocess.PIPE if capture else subprocess.DEVNULL,
                             stderr=subprocess.DEVNULL, timeout=600)
    if process.returncode:
        raise RuntimeError('restore_step_failed:' + name)
    return process.stdout if capture else None


def decrypt(archive_file, target, identity_file=None):
    if str(archive_file).endswith('.age'):
        if not identity_file:
            raise RuntimeError('encrypted_recovery_key_required')
        password = getpass.getpass('Bərpa açarının parolu (göstərilmir): ')
        text = pyrage.passphrase.decrypt(identity_file.read_bytes(), password).decode()
        identity = pyrage.x25519.Identity.from_str(text.strip())
        text, password = None, None
        payload = target.parent/'decrypted-payload.tar.gz'
        pyrage.decrypt_file(str(archive_file), str(payload), [identity])
        identity = None
        with tarfile.open(payload) as archive:
            for member in archive.getmembers():
                parts = pathlib.PurePosixPath(member.name).parts
                if not member.isfile() or member.name.startswith(('/', '\\')) or any(p in ('..', '.') or ':' in p or '\\' in p for p in parts):
                    raise RuntimeError('unsafe_archive_path')
                output = target.joinpath(*parts)
                output.parent.mkdir(parents=True, exist_ok=True)
                with archive.extractfile(member) as source, output.open('wb') as destination:
                    import shutil
                    shutil.copyfileobj(source, destination)
        payload.unlink()
        manifest = json.loads((target/'FILE-MANIFEST.json').read_text())
        for name, checksum in manifest.items():
            parts = pathlib.PurePosixPath(name).parts
            if not parts or name.startswith(('/', '\\')) or any(p in ('..', '.') or ':' in p or '\\' in p for p in parts):
                raise RuntimeError('unsafe_archive_path')
            if digest(target.joinpath(*parts)) != checksum:
                raise RuntimeError('archive_checksum_failed')
        return
    password = getpass.getpass('Arxiv parolu (göstərilmir): ').encode('utf-8')
    with pyzipper.AESZipFile(archive_file) as archive:
        archive.setpassword(password)
        manifest = json.loads(archive.read('FILE-MANIFEST.json'))
        expected = {row['path']: row['sha256'] for row in manifest} if isinstance(manifest, list) else manifest
        for name, checksum in expected.items():
            parts = pathlib.PurePosixPath(name).parts
            if not parts or name.startswith(('/', '\\')) or any(p in ('..', '.') or ':' in p or '\\' in p for p in parts):
                raise RuntimeError('unsafe_archive_path')
            output = target.joinpath(*parts)
            output.parent.mkdir(parents=True, exist_ok=True)
            value = hashlib.sha256()
            with archive.open(name) as source, output.open('wb') as destination:
                for chunk in iter(lambda: source.read(1024*1024), b''):
                    value.update(chunk)
                    destination.write(chunk)
            if value.hexdigest() != checksum:
                raise RuntimeError('archive_checksum_failed')
    password = None


def check(directory, private, bin_dir):
    archives = list(directory.rglob('database.dump'))
    if len(archives) != 1:
        raise RuntimeError('one_database_archive_required')
    backup = archives[0].parent
    metadata = json.loads((backup/'BACKUP-MANIFEST.json').read_text(encoding='utf-8-sig'))
    listing = (backup/'archive-contents.txt').read_text(encoding='utf-8-sig')
    omitted = [line for line in listing.splitlines() if not line.startswith(';') and re.search(r'supabase_vault|\bvault\b|pg_cron|\bcron\b', line)]
    filtered = '\n'.join('; omitted platform extension: '+line if line in omitted else line for line in listing.splitlines())
    (private/'restore-list.txt').write_text(filtered, encoding='utf-8')
    # GRANTED BY source operators are not accounts on this independent test cluster.
    roles = (backup/'roles.sql').read_text(encoding='utf-8-sig')
    roles = re.sub(r' GRANTED BY (?:"(?:[^"]|"")*"|[A-Za-z_]\w*)(?=;)', '', roles)
    (private/'test-roles.sql').write_text(roles, encoding='utf-8')
    password = secrets.token_urlsafe(48)
    pwfile = private/'temporary-cluster-password'
    pwfile.write_text(password+'\n', encoding='utf-8')
    pwfile.chmod(0o600)
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    env = {**os.environ, 'PGHOST': '127.0.0.1', 'PGPORT': str(port),
           'PGUSER': 'kirayeal_restore_operator', 'PGPASSWORD': password, 'PGDATABASE': 'postgres'}
    env.pop('KIRAYE_BACKUP_CONFIG', None)
    version = run(bin_dir, 'pg_restore', ['--version'], env, True).decode()
    if not re.search(r'PostgreSQL\) 17\.', version):
        raise RuntimeError('postgresql_17_required')
    cluster = private/'cluster'
    started = False
    try:
        run(bin_dir, 'initdb', ['-D', str(cluster), '-U', 'kirayeal_restore_operator',
                              '--encoding=UTF8', '--locale=C', '--auth=scram-sha-256', '--pwfile='+str(pwfile)], env)
        pwfile.unlink()
        with (cluster/'postgresql.conf').open('a', encoding='utf-8') as file:
            file.write("\nlisten_addresses='127.0.0.1'\nport="+str(port)+"\nlog_min_error_statement=panic\nlog_error_verbosity=terse\nlog_connections=off\n")
        run(bin_dir, 'pg_ctl', ['-D', str(cluster), '-l', str(private/'postgresql.log'), 'start', '-w', '-t', '30'], env)
        started = True
        run(bin_dir, 'psql', ['-X', '-w', '-v', 'ON_ERROR_STOP=1', '-f', str(private/'test-roles.sql')], env)
        run(bin_dir, 'psql', ['-X', '-w', '-v', 'ON_ERROR_STOP=1', '-c', 'ALTER DATABASE postgres OWNER TO postgres'], env)
        run(bin_dir, 'pg_restore', ['-w', '--exit-on-error', '--dbname=postgres',
                                  '--use-list='+str(private/'restore-list.txt'), str(archives[0])], env)
        counts = {}
        # No remote hostname can be supplied: restoration is always loopback-only.
        with psycopg.connect(host='127.0.0.1', port=port, user='kirayeal_restore_operator', password=password, dbname='postgres') as client:
            for table, expected in metadata['counts'].items():
                schema, name = table.split('.', 1)
                if schema in ('cron', 'vault'):
                    continue
                count = client.execute(sql.SQL('SELECT count(*) FROM {}.{}').format(sql.Identifier(schema), sql.Identifier(name))).fetchone()[0]
                if str(count) != str(expected):
                    raise RuntimeError('restored_counts_differ')
                counts[table] = count
            for query in [
                'SELECT count(*) FROM public.listings l LEFT JOIN public.profiles p ON p.id=l.owner_id WHERE p.id IS NULL',
                'SELECT count(*) FROM public.profiles p LEFT JOIN auth.users u ON u.id=p.id WHERE u.id IS NULL',
                'SELECT count(*) FROM auth.identities i LEFT JOIN auth.users u ON u.id=i.user_id WHERE u.id IS NULL']:
                if client.execute(query).fetchone()[0] != 0:
                    raise RuntimeError('restored_account_relation_invalid')
            images = [url for row in client.execute('SELECT images FROM public.listings').fetchall() for url in (row[0] or [])]
        objects = json.loads((backup/'storage-files-manifest.json').read_text(encoding='utf-8-sig'))
        saved = set()
        for item in objects:
            file = backup/'storage-files'/item['file']
            value = digest(file)
            if value != item['sha256']:
                raise RuntimeError('restored_photo_hash_mismatch')
            saved.add((item.get('bucket', item.get('bucket_id')), item['name']))
        for url in images:
            path = urllib.parse.unquote(urllib.parse.urlsplit(url).path)
            marker = '/storage/v1/object/public/'
            if marker not in path:
                raise RuntimeError('external_listing_photo_not_in_storage_backup')
            bucket, name = path.split(marker, 1)[1].split('/', 1)
            if (bucket, name) not in saved:
                raise RuntimeError('listing_photo_missing_from_backup')
        return {'ok': True, 'restored_counts': counts, 'photos_verified': len(objects),
                'listing_photo_relations_verified': len(images), 'account_relations_verified': True,
                'temporary_platform_omissions': ['Vault', 'pg_cron'],
                'full_auth_api_storage_platform_tested': False, 'source_database_modified': False}
    finally:
        if started:
            run(bin_dir, 'pg_ctl', ['-D', str(cluster), 'stop', '-m', 'fast', '-w'], env)
        password = None
        env['PGPASSWORD'] = ''


def main():
    parser = argparse.ArgumentParser(description='Ayrıca müvəqqəti PostgreSQL17 bərpa sınağı')
    parser.add_argument('--archive', type=pathlib.Path)
    parser.add_argument('--directory', type=pathlib.Path)
    parser.add_argument('--identity-key', type=pathlib.Path)
    parser.add_argument('--pg-bin', type=pathlib.Path, required=True)
    args = parser.parse_args()
    if bool(args.archive) == bool(args.directory):
        parser.error('Choose --archive or --directory')
    os.umask(0o077)
    try:
        with tempfile.TemporaryDirectory(prefix='kirayeal-restore-') as temp:
            private = pathlib.Path(temp)
            directory = args.directory
            if args.archive:
                directory = private/'decrypted'
                directory.mkdir()
                decrypt(args.archive, directory, args.identity_key)
            result = check(directory, private, args.pg_bin)
        print(json.dumps(result))
        return 0
    except Exception:
        print(json.dumps({'ok': False, 'error': 'isolated_restore_failed', 'source_database_modified': False}))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
