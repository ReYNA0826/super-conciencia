import json,sys
from asc import call
APP='6836169691'
def ok(st,d,what):
    if st>=300: print('ERROR',what,st,json.dumps(d,ensure_ascii=False)[:600]); sys.exit(1)
    print('ok',what); return d
# 1. grupo
st,d=call('GET',f'/v1/apps/{APP}/subscriptionGroups?limit=10')
ok(st,d,'leer grupos')
if d['data']: gid=d['data'][0]['id']; print('grupo ya existe',gid)
else:
    d=ok(*call('POST','/v1/subscriptionGroups',{'data':{'type':'subscriptionGroups','attributes':{'referenceName':'Súper Conciencia'},'relationships':{'app':{'data':{'type':'apps','id':APP}}}}}),'crear grupo'); gid=d['data']['id']
    for loc,name in (('es-MX','Súper Conciencia Premium'),('en-US','Súper Conciencia Premium')):
        ok(*call('POST','/v1/subscriptionGroupLocalizations',{'data':{'type':'subscriptionGroupLocalizations','attributes':{'name':name,'locale':loc},'relationships':{'subscriptionGroup':{'data':{'type':'subscriptionGroups','id':gid}}}}}),'grupo '+loc)
SUBS=[('sc_guru_mensual','Premium con Gurú mensual','ONE_MONTH',1,'Premium con Gurú mensual','Premium with Guru Monthly','Todo Premium y 20 min de Gurú al mes','All of Premium plus 20 min of Guru a month'),
      ('sc_guru_anual','Premium con Gurú anual','ONE_YEAR',1,'Premium con Gurú anual','Premium with Guru Yearly','Todo Premium y 20 min de Gurú al mes','All of Premium plus 20 min of Guru a month'),
      ('sc_plus_mensual','Premium mensual','ONE_MONTH',2,'Premium mensual','Premium Monthly','Niveles 5 y 6, y tu voz y música','Levels 5 and 6, plus your voice and music'),
      ('sc_plus_anual','Premium anual','ONE_YEAR',2,'Premium anual','Premium Yearly','Niveles 5 y 6, y tu voz y música','Levels 5 and 6, plus your voice and music')]
st,d=call('GET',f'/v1/subscriptionGroups/{gid}/subscriptions?limit=20'); ok(st,d,'leer suscripciones')
have={s['attributes']['productId']:s['id'] for s in d['data']}
ids={}
for pid,ref,per,lvl,nes,nen,des,den in SUBS:
    if pid in have: ids[pid]=have[pid]; print('ya existe',pid); continue
    d=ok(*call('POST','/v1/subscriptions',{'data':{'type':'subscriptions','attributes':{'name':ref,'productId':pid,'subscriptionPeriod':per,'groupLevel':lvl,'familySharable':False},'relationships':{'group':{'data':{'type':'subscriptionGroups','id':gid}}}}}),'crear '+pid)
    sid=d['data']['id']; ids[pid]=sid
    for loc,n,de in (('es-MX',nes,des),('en-US',nen,den)):
        ok(*call('POST','/v1/subscriptionLocalizations',{'data':{'type':'subscriptionLocalizations','attributes':{'name':n,'locale':loc,'description':de},'relationships':{'subscription':{'data':{'type':'subscriptions','id':sid}}}}}),f'{pid} {loc}')
json.dump({'group':gid,'subs':ids},open('ids.json','w'))
print(json.dumps(ids))
