import importlib.util
import json
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('refresh',Path(__file__).resolve().parents[1]/'scripts/refresh_availability.py')
r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)

class AvailabilityTests(unittest.TestCase):
    movie={'title':'Example','year':2000,'source':'justwatch','url':'https://www.justwatch.com/ca/movie/example'}
    def page(self,actions=None,count=1,year='2000',name='Example'):
        data={'@type':'Movie','name':name,'dateCreated':year+'-01-01','offers':{'offerCount':count},'potentialAction':actions or []}
        return '<script type="application/ld+json">'+json.dumps({'@graph':[data]})+'</script>'
    def action(self,kind='ProvideService',region='CA',price=8,currency='CAD',provider='Service',props=None):
        return {'@type':'WatchAction','target':{'urlTemplate':'https://provider.example/watch'},'expectsAcceptanceOf':{'eligibleRegion':{'name':region},'priceCurrency':currency,'price':price,'availability':'https://schema.org/InStock','businessFunction':'https://schema.org/'+kind,'offeredBy':{'name':provider},'additionalProperty':props or []}}
    def test_canadian_types_and_deduplication(self):
        sub=self.action(props=[{'name':'BillingPeriod','value':'Monthly'}]);offers,_=r.extract_offers(self.page([sub,sub,self.action('RentAction'),self.action('SellAction'),self.action(price=0,provider='Free service'),self.action(price=0,provider='Hoopla')]),self.movie)
        self.assertEqual(len(offers),5);self.assertEqual({o['type'] for o in offers},{'Subscription','Rent','Buy','Free / ads','Library access'})
    def test_wrong_country_currency_identity_and_structure_rejected(self):
        for page in [self.page([self.action(region='US')]),self.page([self.action(currency='USD')]),self.page(year='1999'),self.page(name='Wrong film'),'<html>unavailable</html>']:
            with self.assertRaises(ValueError):r.extract_offers(page,self.movie)
    def test_unpriced_canadian_library_offer(self):
        action=self.action(provider='Hoopla');offer=action['expectsAcceptanceOf'];offer.pop('price');offer.pop('priceCurrency')
        self.assertEqual(r.extract_offers(self.page([action]),self.movie)[0][0]['type'],'Library access')
    def test_explicit_unavailable_is_empty_even_with_foreign_alternatives(self):
        page=self.page([self.action(region='DE',currency='EUR')])+ '<p>Example is not available for streaming in Canada.</p>'
        self.assertEqual(r.extract_offers(page,self.movie)[0],[])
    def test_zero_offers_is_not_a_failed_check(self):
        self.assertEqual(r.extract_offers(self.page(count=0),self.movie)[0],[])
    def test_failure_retains_last_good_timestamp_and_offers(self):
        old={'checkedAt':'2026-09-12T00:00:00Z','offers':[{'provider':'Old'}]}
        result,ok=r.refresh_record(self.movie,old,'2026-09-14T00:00:00Z',lambda _: 'broken response')
        self.assertFalse(ok);self.assertEqual(result['checkedAt'],old['checkedAt']);self.assertEqual(result['offers'],old['offers']);self.assertIn('error',result)
    def test_success_removes_failure_flag(self):
        result,ok=r.refresh_record(self.movie,{'error':'old failure'},'2026-09-14T00:00:00Z',lambda _: self.page(count=0))
        self.assertTrue(ok);self.assertNotIn('error',result)
    def test_cbc_free_account_listing_and_trailer_only_rejection(self):
        movie={'title':'Blood Quantum','year':2019,'source':'cbc','url':'https://gem.cbc.ca/blood-quantum'}
        metadata={'@type':'Movie','name':'Blood Quantum','duration':'PT1H38M'}
        data={'contentType':'Standalone','header':{'title':'Blood Quantum','cta':{'mainCTAtype':'signin'}},'htmlMeta':{'apple-media-service-subscription-v2':{'type':{'availabilityType':'Free'}}}}
        def page():return '<script type="application/ld+json">'+json.dumps(metadata)+'</script><script id="__NEXT_DATA__" type="application/json">'+json.dumps({'props':{'pageProps':{'data':data}}})+'</script>'
        offers,_=r.extract_offers(page(),movie);self.assertEqual(offers[0]['provider'],'CBC Gem');self.assertEqual(offers[0]['type'],'Free · account required')
        data['header']['cta']={'mainCTAtype':'trailer'}
        with self.assertRaises(ValueError):r.extract_offers(page(),movie)
    def test_nfb_is_a_player_page_check_not_a_free_offer_claim(self):
        m={'title':'Acadian Film','source':'nfb','url':'https://www.nfb.ca/film/example/'}
        data={'@type':['Movie','VideoObject'],'name':m['title'],'embedUrl':m['url']+'embed/player/'}
        offers,_=r.extract_offers('<script type="application/ld+json">'+json.dumps(data)+'</script>',m)
        self.assertEqual(offers[0]['type'],'Film player')

if __name__=='__main__':unittest.main()
