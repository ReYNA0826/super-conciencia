"""Deja la app gratis y disponible en todos los países menos los 27 de la Unión Europea (ley DSA; se agregan cuando la cuenta sea de Dream Education)."""
import json
from asc import call
APP='6836169691'
EU='AUT BEL BGR HRV CYP CZE DNK EST FIN FRA DEU GRC HUN IRL ITA LVA LTU LUX MLT NLD POL PRT ROU SVK SVN ESP SWE'.split()
st,d=call('GET',f'/v1/apps/{APP}/appPricePoints?filter[territory]=USA&limit=3')
pp=[p for p in d['data'] if float(p['attributes']['customerPrice'])==0][0]['id']
st,d=call('POST','/v1/appPriceSchedules',{'data':{'type':'appPriceSchedules','relationships':{'app':{'data':{'type':'apps','id':APP}},'baseTerritory':{'data':{'type':'territories','id':'USA'}},'manualPrices':{'data':[{'type':'appPrices','id':'${p0}'}]}}},'included':[{'type':'appPrices','id':'${p0}','attributes':{'startDate':None},'relationships':{'appPricePoint':{'data':{'type':'appPricePoints','id':pp}}}}]})
print('precio',st,'' if st<300 else json.dumps(d)[:400])
st,d=call('GET','/v1/territories?limit=200'); T=[t['id'] for t in d['data']]
inc=[{'type':'territoryAvailabilities','id':'${t%s}'%t,'attributes':{'available':t not in EU},'relationships':{'territory':{'data':{'type':'territories','id':t}}}} for t in T]
st,d=call('POST','/v2/appAvailabilities',{'data':{'type':'appAvailabilities','attributes':{'availableInNewTerritories':False},'relationships':{'app':{'data':{'type':'apps','id':APP}},'territoryAvailabilities':{'data':[{'type':'territoryAvailabilities','id':i['id']} for i in inc]}}},'included':inc})
print('paises',st,'' if st<300 else json.dumps(d)[:600])
if st<300:
    aid=d['data']['id']; st,d=call('GET',f'/v2/appAvailabilities/{aid}/territoryAvailabilities?limit=200')
    print('disponibles',sum(1 for i in d['data'] if i['attributes']['available']),'de',len(d['data']))
