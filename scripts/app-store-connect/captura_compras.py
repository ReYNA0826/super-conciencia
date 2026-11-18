"""Sube la captura de la pantalla de planes como «review screenshot» de las 4 suscripciones y del encuentro."""
import json,hashlib,subprocess,time
from asc import call
x=json.load(open('ids.json'))
F='/Users/reynavazquez/Projects/super-conciencia/store-assets/screenshots-ios/revision-planes.png'
data=open(F,'rb').read()
def subir(tipo,rel,reltype,rid,nombre):
    st,d=call('POST',f'/v1/{tipo}',{'data':{'type':tipo,'attributes':{'fileName':'planes.png','fileSize':len(data)},'relationships':{rel:{'data':{'type':reltype,'id':rid}}}}})
    if st>=300: print('ERR reserva',nombre,st,json.dumps(d)[:300]); return
    aid=d['data']['id']
    for op in d['data']['attributes']['uploadOperations']:
        cmd=['curl','-sS','-m','120','-X',op['method'],op['url'],'--data-binary','@-','-o','/dev/null','-w','%{http_code}']
        for h in op['requestHeaders']: cmd+=['-H',f"{h['name']}: {h['value']}"]
        r=subprocess.run(cmd,input=data[op['offset']:op['offset']+op['length']],capture_output=True).stdout.decode()
        if not r.startswith('2'): print('ERR subida',nombre,r)
    st,d=call('PATCH',f'/v1/{tipo}/{aid}',{'data':{'type':tipo,'id':aid,'attributes':{'uploaded':True,'sourceFileChecksum':hashlib.md5(data).hexdigest()}}})
    print(nombre,st,'' if st<300 else json.dumps(d)[:300])
for n,i in x['subs'].items(): subir('subscriptionAppStoreReviewScreenshots','subscription','subscriptions',i,n)
subir('inAppPurchaseAppStoreReviewScreenshots','inAppPurchaseV2','inAppPurchases',x['iap'],'sc_encuentro')
time.sleep(20)
st,d=call('GET',f"/v1/subscriptionGroups/{x['group']}/subscriptions?fields[subscriptions]=productId,state")
print([(s['attributes']['productId'],s['attributes']['state']) for s in d['data']])
st,d=call('GET',"/v1/apps/6836169691/inAppPurchasesV2?fields[inAppPurchases]=productId,state")
print([(s['attributes']['productId'],s['attributes']['state']) for s in d['data']])
