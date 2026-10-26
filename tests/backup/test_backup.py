import datetime
import json
import os
import pathlib
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts' / 'backup'))
import core
import pyzipper
import pyrage


class BackupTests(unittest.TestCase):
    def test_cloud_encryption_needs_only_public_key_and_detects_corruption(self):
        with tempfile.TemporaryDirectory() as temp:
            import tarfile
            directory=pathlib.Path(temp)
            stage=directory/'stage'
            stage.mkdir()
            (stage/'data').write_bytes(b'isolated database contents')
            owner=pyrage.x25519.Identity.generate()
            output=directory/'Kirayeal-test.tar.gz.age'
            result=core.encrypt_for_recipient(stage, output, str(owner.to_public()), {'auth-config.json':b'{"smtp_secret":"test-only"}'})
            self.assertFalse(result['restore_test_this_copy'])
            self.assertEqual('age-X25519',result['encryption'])
            self.assertNotIn(b'isolated database contents',output.read_bytes())
            self.assertNotIn(str(owner).encode(),output.read_bytes())
            plain=directory/'restored.tar.gz'
            pyrage.decrypt_file(str(output),str(plain),[owner])
            with tarfile.open(plain) as archive:
                self.assertEqual(b'isolated database contents',archive.extractfile('data').read())
            corrupt=bytearray(output.read_bytes());corrupt[-1]^=1;output.write_bytes(corrupt)
            with self.assertRaises(Exception):pyrage.decrypt_file(str(output),str(plain),[owner])

    def test_every_file_encrypted_and_recoverable_and_wrong_password_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = pathlib.Path(temp)
            stage = directory / 'input'
            stage.mkdir()
            expected = os.urandom(32768)
            (stage / 'photo.bin').write_bytes(expected)
            password = 'Only-for-this-isolated-test-12345'
            output = directory / 'backup.zip'
            result = core.encrypt(stage, output, password, {'auth-config.json': b'{"secret":"test-only"}'})
            self.assertTrue(result['verified'])
            self.assertEqual(result['sha256'], core.digest(output))
            self.assertNotIn(password.encode(), output.read_bytes())
            with pyzipper.AESZipFile(output) as archive:
                archive.setpassword(password.encode())
                self.assertEqual(expected, archive.read('photo.bin'))
                self.assertEqual({'secret': 'test-only'}, json.loads(archive.read('auth-config.json')))
                self.assertTrue(all(i.wz_aes_strength == 3 and i.flag_bits & 1 for i in archive.infolist()))
                with self.assertRaises(RuntimeError):
                    archive.setpassword(b'wrong-password')
                    archive.read('photo.bin')

    def test_archive_corruption_is_detected(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = pathlib.Path(temp)
            stage = directory / 'input'
            stage.mkdir()
            (stage / 'data').write_bytes(os.urandom(4096))
            output = directory / 'backup.zip'
            password = 'Only-an-isolated-test-secret'
            core.encrypt(stage, output, password)
            with pyzipper.AESZipFile(output) as archive:
                info = archive.getinfo('data')
                offset = info.header_offset
            raw = bytearray(output.read_bytes())
            name_length = int.from_bytes(raw[offset+26:offset+28], 'little')
            extra_length = int.from_bytes(raw[offset+28:offset+30], 'little')
            raw[offset+30+name_length+extra_length+40] ^= 1
            output.write_bytes(raw)
            with pyzipper.AESZipFile(output) as archive:
                archive.setpassword(password.encode())
                with self.assertRaises(Exception):
                    archive.read('data')

    def record(self, number, day, folder='owned-folder', app=core.APP, status='verified'):
        return {'id': str(number), 'name': 'Kirayeal-' + str(number) + '.zip', 'parents': [folder],
                'appProperties': {'app': app, 'status': status}, 'createdTime': day + 'T05:00:00Z'}

    def test_retention_preserves_dates_and_never_touches_other_files(self):
        now = datetime.date(2026, 10, 26)
        files = [self.record(i, str(now-datetime.timedelta(days=i))) for i in range(40)]
        files.extend([self.record('outside', '2020-01-01', folder='another-folder'),
                      self.record('manual', '2020-01-01', app='not-this-application'),
                      self.record('incomplete', '2020-01-01', status='pending')])
        deleted = core.retention_candidates(files, 'owned-folder')
        self.assertEqual(set(map(str, range(30, 40))), set(deleted))

    def test_many_deployments_do_not_remove_old_daily_copies(self):
        now = datetime.date(2026, 10, 26)
        files = [self.record(i, str(now-datetime.timedelta(days=i))) for i in range(30)]
        files.extend(self.record('deployment-'+str(i), str(now)) for i in range(100))
        candidates = core.retention_candidates(files, 'owned-folder')
        self.assertTrue(all(str(i) not in candidates for i in range(30)))

    def test_wrong_google_account_cannot_create_folder_or_upload(self):
        def request(instance, url, *args, **kwargs):
            return {'access_token': 'isolated-fake-token'} if 'oauth2' in url else {'user': {'emailAddress': 'someone-else@example.invalid'}}
        with patch.object(core.Drive, 'request', request):
            with self.assertRaisesRegex(core.BackupError, 'wrong_google_account'):
                core.Drive({'client_id': 'test', 'client_secret': 'test', 'refresh_token': 'test'})

    def test_missing_configuration_is_failure_without_logging_secrets(self):
        env = {**os.environ, 'KIRAYE_BACKUP_CONFIG': json.dumps({'private': 'DoNotLogThisSecret'})}
        result = subprocess.run([sys.executable, str(ROOT/'scripts/backup/run.py')], env=env, capture_output=True, text=True)
        self.assertEqual(1, result.returncode)
        self.assertNotIn('DoNotLogThisSecret', result.stdout + result.stderr)
        self.assertEqual('configuration', json.loads(result.stdout)['stage'])


if __name__ == '__main__':
    unittest.main()
