"""Quita (o devuelve con 'on') los 27 países de la Unión Europea de la disponibilidad de la app."""
import sys,json
from asc import call
EU='AUT BEL BGR HRV CYP CZE DNK EST FIN FRA DEU GRC HUN IRL ITA LVA LTU LUX MLT NLD POL PRT ROU SVK SVN ESP SWE'.split()
on=len(sys.argv)>1 and sys.argv[1]=='on'
st,d=call('GET','/v1/apps/6836169691/appAvailabilityV2')
if st>=300: print('ERR',st,json.dumps(d)[:400]); sys.exit(1)
aid=d['data']['id']; url=f'/v2/appAvailabilities/{aid}/territoryAvailabilities?include=territory&limit=200'
items=[]
while url:
    st,d=call('GET',url); items+=d['data']; url=d.get('links',{}).get('next')
print('territorios',len(items), 'disponibles',sum(1 for i in items if i['attributes']['available']))
n=0
for i in items:
    t=i['relationships']['territory']['data']['id']
    if t in EU and i['attributes']['available']!=on:
        st,r=call('PATCH',f"/v1/territoryAvailabilities/{i['id']}",{'data':{'type':'territoryAvailabilities','id':i['id'],'attributes':{'available':on}}})
        n+=st<300
        if st>=300: print('ERR',t,st,json.dumps(r)[:200])
print('cambiados',n)
st,d=call('GET',f'/v2/appAvailabilities/{aid}/territoryAvailabilities?limit=200')
print('disponibles ahora',sum(1 for i in d['data'] if i['attributes']['available']))
