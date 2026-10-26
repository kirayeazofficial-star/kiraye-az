"""Install as a restricted, read-only SSH forced command. Only stdout is archive data.

Do not install the private CI key as a general shell login. This script never changes app data.
"""
import io
import os
import pathlib
import subprocess
import sys
import tarfile

os.umask(0o077)
home = pathlib.Path('/home/kiraytfg')


def allowed(info):
    parts = pathlib.PurePosixPath(info.name).parts
    if any(p in ('.git', '.next', 'node_modules', '.ssh', 'core') or p.startswith('core.') for p in parts):
        return None
    return info


try:
    with tarfile.open(fileobj=sys.stdout.buffer, mode='w|gz') as archive:
        archive.add(home / 'kirayeal', arcname='application', filter=allowed)
        for name in ('public_html/.htaccess', 'nodevenv/kirayeal/22/bin/activate'):
            archive.add(home / name, arcname='server-settings/' + name, filter=allowed)
        cron = subprocess.run(['crontab', '-l'], capture_output=True, check=False)
        content = cron.stdout if cron.returncode == 0 else b'# no user crontab\n'
        item = tarfile.TarInfo('server-settings/crontab.txt')
        item.size, item.mode = len(content), 0o600
        archive.addfile(item, io.BytesIO(content))
except Exception:
    sys.exit(1)
