import json,sys
from asc import call
ids=json.load(open('ids.json'))['subs']
PR={'sc_guru_mensual':'14.99','sc_guru_anual':'119.99','sc_plus_mensual':'7.99','sc_plus_anual':'49.99'}
# territorios
terr=[]; url='/v1/territories?limit=200'
st,d=call('GET',url); terr=[t['id'] for t in d['data']]; print('territorios',len(terr))
json.dump(terr,open('terr.json','w'))
res={}
for pid,sid in ids.items():
    # punto de precio en USA
    url=f'/v1/subscriptions/{sid}/pricePoints?filter[territory]=USA&limit=200'; pp=None
    while url and not pp:
        st,d=call('GET',url)
        if st>=300: print('ERR pp',st,str(d)[:300]); sys.exit(1)
        for x in d['data']:
            if x['attributes']['customerPrice']==PR[pid]: pp=x['id']; break
        url=d.get('links',{}).get('next')
    print(pid,'punto USA',bool(pp)); res[pid]=pp
    st,d=call('POST','/v1/subscriptionPrices',{'data':{'type':'subscriptionPrices','attributes':{'preserveCurrentPrice':False},'relationships':{'subscription':{'data':{'type':'subscriptions','id':sid}},'subscriptionPricePoint':{'data':{'type':'subscriptionPricePoints','id':pp}}}}})
    print(pid,'precio USA',st, '' if st<300 else json.dumps(d)[:300])
    st,d=call('POST','/v1/subscriptionAvailabilities',{'data':{'type':'subscriptionAvailabilities','attributes':{'availableInNewTerritories':True},'relationships':{'subscription':{'data':{'type':'subscriptions','id':sid}},'availableTerritories':{'data':[{'type':'territories','id':t} for t in terr]}}}})
    print(pid,'disponibilidad',st, '' if st<300 else json.dumps(d)[:300])
json.dump(res,open('pp.json','w'))
