import json
from asc import call
ids=json.load(open('ids.json'))['subs']; pp=json.load(open('pp.json'))
for pid,sid in ids.items():
    url=f'/v1/subscriptionPricePoints/{pp[pid]}/equalizations?limit=200&include=territory'; pts=[]
    while url:
        st,d=call('GET',url)
        if st>=300: print('ERR',pid,st,str(d)[:300]); break
        pts+=[(x['id'],x['relationships']['territory']['data']['id']) for x in d['data']]; url=d.get('links',{}).get('next')
    okc=0; bad=[]
    for ppid,t in pts:
        if t=='USA': continue
        st,d=call('POST','/v1/subscriptionPrices',{'data':{'type':'subscriptionPrices','attributes':{'preserveCurrentPrice':False},'relationships':{'subscription':{'data':{'type':'subscriptions','id':sid}},'subscriptionPricePoint':{'data':{'type':'subscriptionPricePoints','id':ppid}}}}})
        if st<300: okc+=1
        else: bad.append((t,st,str(d)[:150]))
    print(pid,'territorios con precio:',okc,'fallos:',len(bad),bad[:2],flush=True)
