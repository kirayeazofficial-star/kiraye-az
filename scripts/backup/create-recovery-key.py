"""Owner-operated key setup. Never run on CI and never send the passphrase to GitHub."""
import datetime
import getpass
import hashlib
import json
import pathlib

import pyrage


def create(password, destination):
    if len(password) < 16:
        raise ValueError('password_too_short')
    identity = pyrage.x25519.Identity.generate()
    public = str(identity.to_public())
    encrypted = pyrage.passphrase.encrypt((str(identity)+'\n').encode(), password)
    recovered = pyrage.x25519.Identity.from_str(pyrage.passphrase.decrypt(encrypted, password).decode().strip())
    probe = pyrage.encrypt(b'Kirayeal recovery key check', [identity.to_public()])
    if pyrage.decrypt(probe, [recovered]) != b'Kirayeal recovery key check':
        raise ValueError('recovery_key_roundtrip_failed')
    identity, recovered, password = None, None, None
    stamp = datetime.datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    destination = pathlib.Path(destination)
    destination.mkdir(parents=True, exist_ok=True)
    private = destination/('Kirayeal-berpa-acari-'+stamp+'.key.age')
    with private.open('xb') as output:
        output.write(encrypted)
    result = {'created_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'recipient_public_key': public, 'encrypted_private_key': str(private),
              'encrypted_key_sha256': hashlib.sha256(encrypted).hexdigest(),
              'password_saved': False, 'key_recovery_test_passed': True}
    (destination/('Kirayeal-aciq-acar-'+stamp+'.json')).write_text(json.dumps(result, indent=2), encoding='utf-8')
    return result


if __name__ == '__main__':
    import argparse
    parser=argparse.ArgumentParser()
    parser.add_argument('--destination',type=pathlib.Path,required=True)
    args=parser.parse_args()
    first=getpass.getpass('Bərpa açarının parolu (16+ simvol): ')
    second=getpass.getpass('Təkrar daxil edin: ')
    if first!=second:
        raise SystemExit('Parollar eyni deyil. Açar yaradılmadı.')
    print(json.dumps(create(first,args.destination)))
