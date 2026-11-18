#!/usr/bin/env python3
"""Cliente mínimo de App Store Connect API (firma ES256 con openssl, sin dependencias)."""
import base64, json, subprocess, sys, time, urllib.request, urllib.error, os
KEY_ID='2XFCR4B4X2'; ISSUER='e5bbe108-ffd9-4ae9-9ab0-4ee9eb7373b1'
KEY=os.path.expanduser(f'~/.appstoreconnect/private_keys/AuthKey_{KEY_ID}.p8')
def b64(b): return base64.urlsafe_b64encode(b).rstrip(b'=').decode()
def token():
    h=b64(json.dumps({'alg':'ES256','kid':KEY_ID,'typ':'JWT'}).encode())
    p=b64(json.dumps({'iss':ISSUER,'iat':int(time.time()),'exp':int(time.time())+900,'aud':'appstoreconnect-v1'}).encode())
    der=subprocess.run(['openssl','dgst','-sha256','-sign',KEY],input=f'{h}.{p}'.encode(),capture_output=True,check=True).stdout
    # DER -> r||s
    i=3 if der[1]&0x80 else 2
    assert der[i]==2; rl=der[i+1]; r=der[i+2:i+2+rl]; j=i+2+rl; assert der[j]==2; sl=der[j+1]; s=der[j+2:j+2+sl]
    r=r.lstrip(b'\0').rjust(32,b'\0'); s=s.lstrip(b'\0').rjust(32,b'\0')
    return f'{h}.{p}.{b64(r+s)}'
def call(method, path, body=None):
    url=path if path.startswith('http') else 'https://api.appstoreconnect.apple.com'+path
    cmd=['curl','-sS','-g','-m','90','-X',method,url,'-H','Authorization: Bearer '+token(),'-H','Content-Type: application/json','-w','\n%{http_code}']
    if body is not None: cmd+=['--data-binary',json.dumps(body)]
    out=subprocess.run(cmd,capture_output=True).stdout.decode()
    t,_,code=out.rpartition('\n')
    try: return int(code), (json.loads(t) if t.strip() else {})
    except Exception: return int(code or 0), {'raw':t[:500]}
if __name__=='__main__':
    m,p=sys.argv[1],sys.argv[2]; b=json.loads(sys.argv[3]) if len(sys.argv)>3 else None
    st,d=call(m,p,b); print(st); print(json.dumps(d,indent=1,ensure_ascii=False)[:6000])
