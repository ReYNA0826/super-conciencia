import json,re
from asc import call
APP='6836169691'
md=open('/Users/reynavazquez/Projects/super-conciencia/docs/tienda/app-store.md',encoding='utf-8').read()
def desc(start,end):
    s=md[md.index(start):md.index(end)]
    return s[s.index('**Descripción:**' if 'Descripción:**' in s else '**Description:**'):].split('\n',1)[1].strip()
es=desc('## Español','## English'); en=desc('## English','## Compras dentro')
L={'es-MX':dict(subtitle='Meditación guiada en 7 mundos',promo='Siete mundos 3D para calmar la mente. Los niveles 1 a 4 son gratis. Con Premium abres los niveles 5 y 6 y eliges tu voz y tu música.',kw='meditación,mindfulness,calma,respiración,relajación,bienestar,dormir,ansiedad,guiada,conciencia,paz',desc=es,name='Súper Conciencia'),
   'en-US':dict(subtitle='Guided meditation in 7 worlds',promo='Seven 3D worlds to calm the mind. Levels 1 to 4 are free. Premium opens levels 5 and 6 and lets you choose your voice and music.',kw='meditation,mindfulness,calm,breathing,relax,wellness,sleep,anxiety,guided,awareness,peace',desc=en,name='Súper Conciencia')}
print('largos',len(es),len(en))
PRIV='https://dreameducationus.com/super-conciencia-privacidad/'
def show(what,st,d): print(what,st,'' if st<300 else json.dumps(d,ensure_ascii=False)[:400])
# appInfo
st,d=call('GET',f'/v1/apps/{APP}/appInfos'); info=d['data'][0]['id']; show('appInfo',st,d)
st,d=call('GET',f'/v1/appInfos/{info}/appInfoLocalizations'); have={x['attributes']['locale']:x['id'] for x in d['data']}
for loc,v in L.items():
    attrs={'subtitle':v['subtitle'],'privacyPolicyUrl':PRIV}
    if loc in have: st,d=call('PATCH',f'/v1/appInfoLocalizations/{have[loc]}',{'data':{'type':'appInfoLocalizations','id':have[loc],'attributes':attrs}})
    else: st,d=call('POST','/v1/appInfoLocalizations',{'data':{'type':'appInfoLocalizations','attributes':{**attrs,'locale':loc,'name':v['name']},'relationships':{'appInfo':{'data':{'type':'appInfos','id':info}}}}})
    show('info '+loc,st,d)
st,d=call('PATCH',f'/v1/appInfos/{info}',{'data':{'type':'appInfos','id':info,'relationships':{'primaryCategory':{'data':{'type':'appCategories','id':'HEALTH_AND_FITNESS'}},'secondaryCategory':{'data':{'type':'appCategories','id':'LIFESTYLE'}}}}}); show('categorias',st,d)
# version
st,d=call('GET',f'/v1/apps/{APP}/appStoreVersions?limit=5'); ver=d['data'][0]['id']; show('version '+d['data'][0]['attributes']['versionString'],st,d)
st,d=call('PATCH',f'/v1/appStoreVersions/{ver}',{'data':{'type':'appStoreVersions','id':ver,'attributes':{'copyright':'2026 Dream Education, Corp.'}}}); show('copyright',st,d)
st,d=call('GET',f'/v1/appStoreVersions/{ver}/appStoreVersionLocalizations'); have={x['attributes']['locale']:x['id'] for x in d['data']}
vl={}
for loc,v in L.items():
    attrs={'description':v['desc'],'keywords':v['kw'],'promotionalText':v['promo'],'supportUrl':PRIV}
    if loc in have: st,d=call('PATCH',f'/v1/appStoreVersionLocalizations/{have[loc]}',{'data':{'type':'appStoreVersionLocalizations','id':have[loc],'attributes':attrs}}); vl[loc]=have[loc]
    else:
        st,d=call('POST','/v1/appStoreVersionLocalizations',{'data':{'type':'appStoreVersionLocalizations','attributes':{**attrs,'locale':loc},'relationships':{'appStoreVersion':{'data':{'type':'appStoreVersions','id':ver}}}}})
        if st<300: vl[loc]=d['data']['id']
    show('texto '+loc,st,d)
x=json.load(open('ids.json')); x.update(appInfo=info,version=ver,verLoc=vl); json.dump(x,open('ids.json','w'))
