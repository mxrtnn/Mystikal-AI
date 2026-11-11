import sys
import tempfile
from pathlib import Path
import unittest
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient
from PIL import Image
from PIL.PngImagePlugin import PngInfo
import privacy
import main

class PrivacyTests(unittest.TestCase):
    def test_token_counter_owner_session_and_long_request_validation(self):
        from types import SimpleNamespace
        tokenizer=lambda text,**kwargs:SimpleNamespace(input_ids=text.split())
        with patch.object(main,'load_tokenizers',return_value=(tokenizer,tokenizer)):
            self.assertEqual(self.public.post('/api/prompt/tokens',json={'prompt':'test'}).status_code,401)
            counted=self.a.post('/api/prompt/tokens',json={'prompt':'cat '*220,'negative_prompt':'blurry '*220}).json()
            self.assertEqual(counted['positive'],220);self.assertEqual(counted['negative'],220)
            too_long=self.a.post('/api/generate',json={'prompt':'cat '*221})
            self.assertEqual(too_long.status_code,422);self.assertIn('221/220',too_long.json()['detail'])
    def test_account_email_change_preserves_gallery_identity(self):
        first=Mock(status_code=200);first.json.return_value={'user':{'id':123,'name':'Test','email':'old@example.invalid'}}
        second=Mock(status_code=200);second.json.return_value={'user':{'id':123,'name':'Test','email':'new@example.invalid','avatar':'moon'}}
        with patch('requests.post',return_value=first):
            self.assertEqual(self.a.post('/api/auth/login',json={'email':'old@example.invalid','password':'test-only'}).status_code,200)
        owner=privacy.account_id('old@example.invalid');self.fixture(owner)
        self.a.post('/api/auth/logout')
        with patch('requests.post',return_value=second):
            self.assertEqual(self.a.post('/api/auth/login',json={'email':'new@example.invalid','password':'test-only'}).status_code,200)
        self.assertEqual(len(self.a.get('/api/gallery').json()),1)
        self.assertEqual(self.a.get('/api/profile').json()['avatar'],'moon')
    def test_gallery_edits_trash_restore_and_isolation(self):
        self.fixture(self.owners[0])
        self.assertEqual(self.b.post('/api/images/fixture/manage',json={'favorite':True}).status_code,404)
        changed=self.a.post('/api/images/fixture/manage',json={'favorite':True,'featured':True,'title':'Mi favorita','notes':'Notas'}).json()
        self.assertTrue(changed['favorite']);self.assertTrue(changed['featured']);self.assertEqual(changed['title'],'Mi favorita')
        self.assertEqual(self.a.post('/api/images/fixture/manage',json={'action':'trash'}).status_code,200)
        self.assertEqual(self.a.get('/api/gallery').json(),[])
        self.assertEqual(len(self.a.get('/api/gallery?trashed=true').json()),1)
        self.assertEqual(self.a.get('/api/profile').json()['total'],0)
        self.assertEqual(self.a.get('/api/images/fixture/file').status_code,200)
        self.assertEqual(self.b.get('/api/images/fixture/file').status_code,404)
        self.assertEqual(self.a.post('/api/images/fixture/manage',json={'notes':'changed'}).status_code,409)
        self.assertEqual(self.a.post('/api/images/fixture/manage',json={'action':'restore'}).status_code,200)
        self.assertTrue(self.a.get('/api/gallery').json()[0]['favorite'])
    def test_trash_revokes_public_links_and_quota_limits_restore(self):
        owner=self.account(self.a);self.fixture(owner)
        self.a.post('/api/images/fixture/visibility',json={'shared':True,'reviewed_sfw':True})
        self.a.post('/api/images/fixture/manage',json={'action':'trash'})
        self.assertEqual(self.public.get('/api/images/fixture/file').status_code,401)
        self.assertEqual(self.public.get('/api/public/gallery').json(),[])
        self.fixture(owner,image_id='second')
        with patch.dict('os.environ',{'MYSTIKAL_GALLERY_LIMIT':'1'}):
            self.assertEqual(self.a.post('/api/images/fixture/manage',json={'action':'restore'}).status_code,409)
            self.assertEqual(self.a.post('/api/generate',json={'prompt':'test'}).status_code,409)
        self.assertEqual(self.a.post('/api/images/fixture/manage',json={'action':'restore'}).status_code,200)
        self.assertFalse(self.a.get('/api/gallery').json()[1]['shared'])
    def test_guest_profile_and_generation_guards(self):
        response=self.a.post('/api/profile/details',json={'name':'Creador','avatar':'moon'})
        self.assertEqual(response.status_code,200);self.assertEqual(response.json()['avatar'],'moon')
        self.assertEqual(self.a.post('/api/profile/details',json={'name':'  '}).status_code,422)
        self.assertEqual(self.a.post('/api/profile/details',json={'name':'Creador','avatar':'invalid'}).status_code,422)
        for data in [{'nsfw':True},{'engine':'flux'},{'count':5},{'engine':'flux','paid_confirmed':True,'nsfw':True,'adult_confirmed':True}]:
            self.assertEqual(self.a.post('/api/generate',json={'prompt':'test',**data}).status_code,422)
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        privacy.DB=Path(self.temp.name)/'test.sqlite3'
        privacy.PRIVATE=Path(self.temp.name)/'private'
        privacy.initialize()
        self.a=TestClient(main.app); self.b=TestClient(main.app); self.public=TestClient(main.app)
        self.a.post('/api/auth/guest'); self.b.post('/api/auth/guest')
        with privacy.connect() as db:
            self.owners=[r['id'] for r in db.execute('SELECT id FROM users ORDER BY rowid')]
    def tearDown(self):
        self.a.close(); self.b.close(); self.public.close(); self.temp.cleanup()
    def fixture(self,owner,nsfw=False,image_id='fixture'):
        data={'id':image_id,'prompt':'PRIVATE PROMPT','negative_prompt':'PRIVATE NEGATIVE','width':8,'height':8,'steps':1,'created_at':1,'nsfw':nsfw}
        path=privacy.output_path(owner,nsfw,image_id,'.png')
        info=PngInfo();info.add_text('mystikal','PRIVATE METADATA')
        Image.new('RGB',(8,8),'navy').save(path,pnginfo=info)
        privacy.register_image(data,owner)
        return data
    def account(self,client,email='test@example.invalid'):
        response=Mock(status_code=200)
        response.json.return_value={'user':{'email':email,'name':'Test'}}
        with patch('requests.post',return_value=response):
            result=client.post('/api/auth/login',json={'email':email,'password':'test-only'})
        self.assertEqual(result.status_code,200)
        return privacy.account_id(email)
    def test_private_access_and_owner_isolation(self):
        self.fixture(self.owners[0],True)
        self.assertEqual(self.a.get('/api/images/fixture/file').status_code,200)
        for client in [self.b,self.public]:
            self.assertIn(client.get('/api/images/fixture/file').status_code,(401,404))
            self.assertIn(client.get('/api/images/fixture/metadata').status_code,(401,404))
        self.assertEqual(len(self.a.get('/api/gallery').json()),1)
        self.assertEqual(self.b.get('/api/gallery').json(),[])
        self.assertEqual(self.public.get('/api/gallery').status_code,401)
    def test_no_static_outputs_and_no_auth_bypass(self):
        self.fixture(self.owners[0])
        self.assertEqual(self.public.get('/outputs/fixture.png').status_code,404)
        self.assertEqual(self.public.get('/api/gallery',headers={'X-User-Email':'test@example.invalid'}).status_code,401)
        self.assertEqual(self.public.post('/api/generate',json={'prompt':'test'}).status_code,401)
    def test_home_requires_explicit_sfw_review(self):
        owner=self.account(self.a)
        self.fixture(owner,False,'safe'); self.fixture(owner,True,'adult')
        self.a.post('/api/images/safe/visibility',json={'shared':True})
        self.assertEqual(self.public.get('/api/public/gallery').json(),[])
        self.a.post('/api/images/safe/visibility',json={'shared':True,'reviewed_sfw':True})
        self.a.post('/api/images/adult/visibility',json={'shared':True,'reviewed_sfw':True})
        self.assertEqual([r['id'] for r in self.public.get('/api/public/gallery').json()],['safe'])
    def test_public_copy_has_no_embedded_private_metadata(self):
        import io
        owner=self.account(self.a); self.fixture(owner)
        self.a.post('/api/images/fixture/visibility',json={'shared':True})
        data=self.public.get('/api/images/fixture/file')
        with Image.open(io.BytesIO(data.content)) as image:
            self.assertNotIn('mystikal',image.info)
        self.assertEqual(self.public.get('/api/images/fixture/metadata').status_code,401)
    def test_unsharing_revokes_access(self):
        owner=self.account(self.a); self.fixture(owner)
        self.a.post('/api/images/fixture/visibility',json={'shared':True})
        self.assertEqual(self.public.get('/api/images/fixture/file').status_code,200)
        self.a.post('/api/images/fixture/visibility',json={'shared':False})
        self.assertEqual(self.public.get('/api/images/fixture/file').status_code,401)
    def test_profile_preference_is_per_user_and_guests_cannot_publish(self):
        owner=self.account(self.a)
        self.assertFalse(self.a.get('/api/profile').json()['auto_share'])
        self.assertEqual(self.a.post('/api/profile',json={'auto_share':True}).status_code,200)
        self.fixture(owner,True)
        self.assertTrue(self.a.get('/api/gallery').json()[0]['shared'])
        self.assertEqual(self.public.get('/api/public/gallery').json(),[])
        self.assertFalse(self.b.get('/api/profile').json()['auto_share'])
        self.assertEqual(self.b.post('/api/profile',json={'auto_share':True}).status_code,403)
    def test_other_user_cannot_change_visibility_or_jobs(self):
        self.fixture(self.owners[0])
        self.assertEqual(self.b.post('/api/images/fixture/visibility',json={'shared':True}).status_code,404)
        main.jobs['private-job']={'_owner':self.owners[0],'_started_at':0,'status':'done','result':{'secret':True}}
        self.assertEqual(self.b.get('/api/jobs/private-job').status_code,404)
        self.assertEqual(self.b.post('/api/jobs/private-job/cancel').status_code,404)
        self.assertEqual(self.a.get('/api/jobs/private-job').status_code,200)
    def test_logout_revokes_cookie_and_cross_site_mutations_fail(self):
        self.assertEqual(self.a.post('/api/auth/logout',headers={'Origin':'https://attacker.invalid'}).status_code,403)
        token=self.a.cookies.get('mystikal_session')
        self.a.post('/api/auth/logout')
        self.a.cookies.set('mystikal_session',token)
        self.assertEqual(self.a.get('/api/auth/session').status_code,401)
    def test_login_requires_confirmed_remote_identity(self):
        response=Mock(status_code=200);response.json.return_value={'user':{'email':'different@example.invalid'}}
        with patch('requests.post',return_value=response):
            result=self.public.post('/api/auth/login',json={'email':'test@example.invalid','password':'test-only'})
        self.assertEqual(result.status_code,502)
        self.assertEqual(self.public.get('/api/auth/session').status_code,401)
    def test_manual_rating_and_artist_are_preserved(self):
        request=main.Generation(prompt='solo',artist='freng',nsfw=True,adult_confirmed=True)
        self.assertTrue(request.model_dump()['nsfw'])
        self.assertEqual(request.artist,'freng')
        self.assertIn('freng',self.public.get('/api/artists?q=fre').json()['names'])

if __name__=='__main__': unittest.main()
