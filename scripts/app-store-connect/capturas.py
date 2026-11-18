import json,os,hashlib,subprocess,glob
from asc import call
x=json.load(open('ids.json')); loc=x['verLoc']['es-MX']
st,d=call('GET',f'/v1/appStoreVersionLocalizations/{loc}/appScreenshotSets')
sets={s['attributes']['screenshotDisplayType']:s['id'] for s in d['data']}
if 'APP_IPHONE_67' in sets: sid=sets['APP_IPHONE_67']
else:
    st,d=call('POST','/v1/appScreenshotSets',{'data':{'type':'appScreenshotSets','attributes':{'screenshotDisplayType':'APP_IPHONE_67'},'relationships':{'appStoreVersionLocalization':{'data':{'type':'appStoreVersionLocalizations','id':loc}}}}})
    print('set',st,'' if st<300 else json.dumps(d)[:300]); sid=d['data']['id']
st,d=call('GET',f'/v1/appScreenshotSets/{sid}/appScreenshots'); already={s['attributes']['fileName'] for s in d['data']}
for f in sorted(glob.glob('/Users/reynavazquez/Projects/super-conciencia/store-assets/screenshots-ios/*.png')):
    name=os.path.basename(f)
    if name in already: print('ya',name); continue
    data=open(f,'rb').read()
    st,d=call('POST','/v1/appScreenshots',{'data':{'type':'appScreenshots','attributes':{'fileName':name,'fileSize':len(data)},'relationships':{'appScreenshotSet':{'data':{'type':'appScreenshotSets','id':sid}}}}})
    if st>=300: print('ERR reserva',name,st,json.dumps(d)[:300]); continue
    aid=d['data']['id']
    for op in d['data']['attributes']['uploadOperations']:
        cmd=['curl','-sS','-m','120','-X',op['method'],op['url'],'--data-binary','@-','-o','/dev/null','-w','%{http_code}']
        for h in op['requestHeaders']: cmd+=['-H',f"{h['name']}: {h['value']}"]
        r=subprocess.run(cmd,input=data[op['offset']:op['offset']+op['length']],capture_output=True).stdout.decode()
        if not r.startswith('2'): print('ERR subida',name,r)
    st,d=call('PATCH',f'/v1/appScreenshots/{aid}',{'data':{'type':'appScreenshots','id':aid,'attributes':{'uploaded':True,'sourceFileChecksum':hashlib.md5(data).hexdigest()}}})
    print(name,st,'' if st<300 else json.dumps(d)[:300])
