"""Server-side sessions and image ownership; no static private-file mounts."""
from contextlib import contextmanager
import hashlib
import json
import os
from pathlib import Path
import secrets
import sqlite3
import time
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'data'
DATA.mkdir(exist_ok=True)
PRIVATE = DATA / 'private'
PRIVATE.mkdir(exist_ok=True)
DB = DATA / 'privacy.sqlite3'
AUTH_URL = os.environ.get('MYSTIKAL_AUTH_URL', 'https://mystikal-ai.onrender.com').rstrip('/')
router = APIRouter()

@contextmanager
def connect():
    db = sqlite3.connect(DB, timeout=20)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA foreign_keys=ON')
    try:
        with db:
            yield db
    finally:
        db.close()

def initialize():
    with connect() as db:
        db.executescript('''
        CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, guest INTEGER NOT NULL, auto_share INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, owner TEXT NOT NULL REFERENCES users(id), expires REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS images (id TEXT PRIMARY KEY, owner TEXT NOT NULL REFERENCES users(id), nsfw INTEGER NOT NULL, shared INTEGER NOT NULL DEFAULT 0, reviewed_sfw INTEGER NOT NULL DEFAULT 0, metadata TEXT NOT NULL);
        ''')
    additions = {
        'users': {'avatar':"TEXT NOT NULL DEFAULT 'sparkles'",'remote_id':'TEXT'},
        'images': {'favorite':'INTEGER NOT NULL DEFAULT 0','featured':'INTEGER NOT NULL DEFAULT 0','title':"TEXT NOT NULL DEFAULT ''",'notes':"TEXT NOT NULL DEFAULT ''",'trashed_at':'REAL'}
    }
    with connect() as db:
        for table, columns in additions.items():
            existing={row[1] for row in db.execute(f'PRAGMA table_info({table})')}
            for name, definition in columns.items():
                if name not in existing: db.execute(f'ALTER TABLE {table} ADD COLUMN {name} {definition}')
        db.execute('CREATE UNIQUE INDEX IF NOT EXISTS users_remote_identity ON users(remote_id) WHERE remote_id IS NOT NULL')
initialize()

def account_id(email):
    return 'account-' + hashlib.sha256((AUTH_URL + '|' + email.strip().casefold()).encode()).hexdigest()

def session_user(request, required=True):
    token = request.cookies.get('mystikal_session', '')
    with connect() as db:
        row = db.execute('SELECT users.* FROM sessions JOIN users ON users.id=sessions.owner WHERE token_hash=? AND expires>?', (hashlib.sha256(token.encode()).hexdigest(), time.time())).fetchone() if token else None
    if row is None and required:
        raise HTTPException(401, 'Inicia sesión o continúa como invitado.')
    return dict(row) if row else None

def issue_session(response, owner, remember=False):
    token = secrets.token_urlsafe(32)
    lifetime = 30*86400 if remember else 12*3600
    with connect() as db:
        db.execute('DELETE FROM sessions WHERE expires<=?', (time.time(),))
        db.execute('INSERT INTO sessions VALUES (?,?,?)', (hashlib.sha256(token.encode()).hexdigest(), owner, time.time()+lifetime))
    response.set_cookie('mystikal_session', token, httponly=True, samesite='strict', secure=False, max_age=lifetime if remember else None, path='/')

def logout_token(request):
    token = request.cookies.get('mystikal_session', '')
    with connect() as db:
        db.execute('DELETE FROM sessions WHERE token_hash=?', (hashlib.sha256(token.encode()).hexdigest(),))

class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=1000)
    remember: bool = False

@router.post('/api/auth/login')
def login(body: LoginRequest, request: Request, response: Response):
    import requests
    if not AUTH_URL.startswith('https://'):
        raise HTTPException(503, 'MYSTIKAL_AUTH_URL debe usar HTTPS.')
    try:
        upstream = requests.post(AUTH_URL+'/api/login', json={'email': body.email, 'password': body.password}, timeout=40, allow_redirects=False)
        if upstream.status_code != 200:
            raise HTTPException(401 if upstream.status_code in (400,401,403) else 502, 'Credenciales incorrectas.' if upstream.status_code in (400,401,403) else 'El servicio de cuentas no está disponible.')
        payload = upstream.json()
        user = payload.get('user', {}) if isinstance(payload, dict) else {}
        if not isinstance(user, dict):
            raise HTTPException(502, 'Respuesta de autenticación no válida.')
        email = user.get('email', '')
        if not isinstance(email, str) or email.strip().casefold() != body.email.strip().casefold():
            raise HTTPException(502, 'El servicio no confirmó la identidad de la cuenta.')
    except (requests.RequestException, ValueError):
        raise HTTPException(502, 'No se pudo conectar con el servicio de cuentas. Puedes usar modo invitado.')
    identity = f'{AUTH_URL}|{user["id"]}' if user.get('id') is not None else None
    owner = account_id(email)
    with connect() as db:
        existing = db.execute('SELECT id,remote_id FROM users WHERE remote_id=?',(identity,)).fetchone() if identity else None
        legacy = db.execute('SELECT id,remote_id FROM users WHERE id=?',(owner,)).fetchone()
        if existing: owner=existing['id']
        elif identity and legacy and legacy['remote_id'] not in (None,identity):
            owner='account-'+hashlib.sha256(identity.encode()).hexdigest()
    name = str(user.get('name') or 'Mi cuenta')[:100]
    with connect() as db:
        db.execute('INSERT INTO users(id,name,email,guest,avatar,remote_id) VALUES (?,?,?,0,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,email=excluded.email,avatar=excluded.avatar,remote_id=COALESCE(excluded.remote_id,users.remote_id)', (owner,name,email,user.get('avatar','sparkles'),identity))
    logout_token(request)
    issue_session(response, owner, body.remember)
    return {'user': {'name': name, 'email': email, 'avatar': user.get('avatar','sparkles')}}

@router.post('/api/auth/guest')
def guest(request: Request, response: Response):
    current = session_user(request, required=False)
    if current and current['guest']:
        return {'guest': True}
    owner = 'guest-' + secrets.token_hex(24)
    with connect() as db:
        db.execute('INSERT INTO users(id,name,guest) VALUES (?,?,1)', (owner,'Invitado'))
    logout_token(request)
    issue_session(response, owner)
    return {'guest': True}

@router.get('/api/auth/session')
def current(request: Request):
    user = session_user(request)
    return {'guest': bool(user['guest']), 'user': {'name':user['name'], 'email':user['email'],'avatar':user['avatar']}}

@router.post('/api/auth/logout')
def logout(request: Request, response: Response):
    logout_token(request)
    response.delete_cookie('mystikal_session', path='/')
    return {'ok': True}

def output_path(owner, nsfw, image_id, suffix):
    # Only server-generated owner IDs and UUID image IDs reach this helper.
    directory = PRIVATE / owner / ('nsfw' if nsfw else 'sfw')
    directory.mkdir(parents=True, exist_ok=True)
    return directory / (image_id + suffix)

def register_image(metadata, owner):
    with connect() as db:
        db.execute('BEGIN IMMEDIATE')
        gallery_capacity(owner,1,db)
        db.execute('INSERT INTO images(id,owner,nsfw,shared,reviewed_sfw,metadata) VALUES (?,?,?,?,?,?)', (metadata['id'],owner,int(metadata['nsfw']),0,0,json.dumps(metadata,ensure_ascii=False)))
        user = db.execute('SELECT auto_share,guest FROM users WHERE id=?',(owner,)).fetchone()
        # Auto-sharing is explicit, but never auto-approves content for the home.
        if user and user['auto_share'] and not user['guest']:
            db.execute('UPDATE images SET shared=1 WHERE id=?',(metadata['id'],))

def image_row(image_id, include_trash=False):
    with connect() as db:
        row = db.execute('SELECT * FROM images WHERE id=?'+('' if include_trash else ' AND trashed_at IS NULL'), (image_id,)).fetchone()
    if row is None:
        raise HTTPException(404, 'Imagen no encontrada.')
    return dict(row)

def require_owner(row, user):
    if row['owner'] != user['id']:
        raise HTTPException(404, 'Imagen no encontrada.')

def present(row, public=False):
    metadata=json.loads(row['metadata'])
    if public:
        return {key: metadata[key] for key in ('id','width','height','steps') if key in metadata} | {'prompt':'Ilustración compartida', 'nsfw':bool(row['nsfw'])}
    return metadata | {'shared':bool(row['shared']), 'reviewed_sfw':bool(row['reviewed_sfw']), 'favorite':bool(row.get('favorite',0)), 'featured':bool(row.get('featured',0)), 'title':row.get('title',''), 'notes':row.get('notes',''), 'trashed_at':row.get('trashed_at')}

@router.get('/api/gallery')
def gallery(request: Request, trashed: bool=False):
    user=session_user(request)
    with connect() as db:
        rows=db.execute('SELECT * FROM images WHERE owner=? AND trashed_at IS '+('NOT NULL' if trashed else 'NULL')+' ORDER BY rowid DESC',(user['id'],)).fetchall()
    return [present(dict(row)) for row in rows]

@router.get('/api/public/gallery')
def public_gallery():
    with connect() as db:
        rows=db.execute('SELECT * FROM images WHERE shared=1 AND nsfw=0 AND reviewed_sfw=1 AND trashed_at IS NULL ORDER BY rowid DESC LIMIT 24').fetchall()
    return [present(dict(row),public=True) for row in rows]

@router.get('/api/images/{image_id}/file')
def image_file(image_id: str, request: Request):
    row=image_row(image_id,include_trash=True)
    if row['trashed_at'] is not None:
        require_owner(row,session_user(request))
    if not row['shared']:
        require_owner(row,session_user(request))
    path=output_path(row['owner'],row['nsfw'],row['id'],'.png')
    if not path.exists():
        raise HTTPException(404,'Archivo no encontrado.')
    # Public files are re-encoded to omit embedded private prompts/metadata.
    if row['shared'] and (not session_user(request,required=False) or session_user(request,required=False)['id'] != row['owner']):
        from PIL import Image
        from fastapi.responses import StreamingResponse
        import io
        data=io.BytesIO()
        with Image.open(path) as image:
            clean=image.copy()
            clean.info.clear()
            clean.save(data,format='PNG')
        data.seek(0)
        return StreamingResponse(data,media_type='image/png',headers={'Cache-Control':'no-store','Content-Disposition':f'inline; filename="{row["id"]}.png"'})
    return FileResponse(path,media_type='image/png',filename=row['id']+'.png',content_disposition_type='inline',headers={'Cache-Control':'private, no-store'})

@router.get('/api/images/{image_id}/metadata')
def image_metadata(image_id: str,request: Request):
    row=image_row(image_id)
    require_owner(row,session_user(request))
    return Response(json.dumps(present(row),ensure_ascii=False),media_type='application/json',headers={'Cache-Control':'private, no-store','Content-Disposition':f'attachment; filename="{row["id"]}.json"'})

class Visibility(BaseModel):
    shared: bool
    reviewed_sfw: bool = False

@router.post('/api/images/{image_id}/visibility')
def visibility(image_id: str, body: Visibility, request: Request):
    user=session_user(request)
    row=image_row(image_id)
    require_owner(row,user)
    if user['guest']:
        raise HTTPException(403,'Solo las cuentas pueden publicar imágenes.')
    with connect() as db:
        db.execute('UPDATE images SET shared=?,reviewed_sfw=? WHERE id=? AND trashed_at IS NULL',(int(body.shared),int(body.reviewed_sfw and not row['nsfw']),image_id))
    return present(image_row(image_id))

@router.get('/api/profile')
def profile(request: Request):
    user=session_user(request)
    with connect() as db:
        counts=db.execute('SELECT COUNT(*) AS total,COALESCE(SUM(nsfw),0) AS nsfw FROM images WHERE owner=? AND trashed_at IS NULL',(user['id'],)).fetchone()
    return {'name':user['name'],'guest':bool(user['guest']),'auto_share':bool(user['auto_share']),'total':counts['total'],'nsfw':counts['nsfw'],'email':user['email'],'avatar':user['avatar'],'limit':gallery_limit()}

class Preferences(BaseModel):
    auto_share: bool

@router.post('/api/profile')
def preferences(body: Preferences,request: Request):
    user=session_user(request)
    if user['guest']:
        raise HTTPException(403,'Inicia sesión con una cuenta para compartir.')
    with connect() as db:
        db.execute('UPDATE users SET auto_share=? WHERE id=?',(int(body.auto_share),user['id']))
    return profile(request)

@router.get('/api/artists')
def artists(q: str = ''):
    names=['freng','ebifurya','kantoku','mika pikazo','fukahire (ruinon)','misaka 12003-gou']
    return {'names':[name for name in names if q.casefold() in name.casefold()], 'source':'https://tags.gallery/en/v4-5','support':'unverified-in-animagine','catalog':'local-starter-list-not-a-live-TAGs-API'}


AVATARS=('sparkles','moon','bot','palette','rocket','ghost')

def gallery_limit():
    try: return max(1,int(os.environ.get('MYSTIKAL_GALLERY_LIMIT','1000')))
    except ValueError: return 1000

def gallery_capacity(owner,additional=1,db=None):
    if db is None:
        with connect() as connection: return gallery_capacity(owner,additional,connection)
    used=db.execute('SELECT COUNT(*) FROM images WHERE owner=? AND trashed_at IS NULL',(owner,)).fetchone()[0]
    if used+additional>gallery_limit():
        raise HTTPException(409,f'Tu galería contiene {used}/{gallery_limit()} imágenes. Mueve imágenes a la papelera antes de continuar.')
    return used

class ImageManagement(BaseModel):
    action: str = 'edit'
    favorite: bool | None = None
    featured: bool | None = None
    title: str | None = Field(default=None,max_length=120)
    notes: str | None = Field(default=None,max_length=2000)

@router.post('/api/images/{image_id}/manage')
def manage_image(image_id: str,body: ImageManagement,request: Request):
    user=session_user(request)
    row=image_row(image_id,include_trash=True)
    require_owner(row,user)
    if body.action not in ('edit','trash','restore'):
        raise HTTPException(422,'Acción no válida.')
    with connect() as db:
        db.execute('BEGIN IMMEDIATE')
        if body.action=='trash':
            db.execute('UPDATE images SET trashed_at=?,shared=0,reviewed_sfw=0 WHERE id=?',(time.time(),image_id))
        elif body.action=='restore':
            if row['trashed_at'] is not None: gallery_capacity(user['id'],1,db)
            db.execute('UPDATE images SET trashed_at=NULL WHERE id=?',(image_id,))
        else:
            if row['trashed_at'] is not None: raise HTTPException(409,'Restaura la imagen antes de editarla.')
            updates={key:value for key,value in body.model_dump().items() if key!='action' and value is not None}
            if updates:
                db.execute('UPDATE images SET '+','.join(f'{key}=?' for key in updates)+' WHERE id=?',tuple(updates.values())+(image_id,))
    return present(image_row(image_id,include_trash=True))

class ProfileDetails(BaseModel):
    name: str = Field(min_length=1,max_length=100)
    email: str | None = Field(default=None,max_length=320)
    avatar: str = 'sparkles'
    current_password: str = Field(default='',max_length=1000)

@router.post('/api/profile/details')
def profile_details(body: ProfileDetails,request: Request):
    user=session_user(request)
    if not body.name.strip(): raise HTTPException(422,'Introduce un nombre.')
    if body.avatar not in AVATARS: raise HTTPException(422,'Avatar no válido.')
    if user['guest']:
        if body.email: raise HTTPException(403,'Una sesión invitada no tiene correo de cuenta.')
        with connect() as db:
            db.execute('UPDATE users SET name=?,avatar=? WHERE id=?',(body.name.strip(),body.avatar,user['id']))
    else:
        if not body.current_password: raise HTTPException(400,'Introduce tu contraseña actual para guardar los datos de tu cuenta.')
        import requests
        try:
            with requests.Session() as remote:
                authenticated=remote.post(AUTH_URL+'/api/login',json={'email':user['email'],'password':body.current_password},timeout=40,allow_redirects=False)
                if authenticated.status_code!=200: raise HTTPException(401,'La contraseña actual no se pudo verificar.')
                changed=remote.post(AUTH_URL+'/api/account',json={'name':body.name.strip(),'email':body.email or user['email'],'avatar':body.avatar,'current_password':body.current_password},timeout=40,allow_redirects=False)
                if changed.status_code!=200:
                    message='El backend de cuentas todavía no admite editar perfiles. Publica también los cambios de Render.' if changed.status_code==404 else 'No se pudo actualizar la cuenta; revisa el correo o la contraseña.'
                    raise HTTPException(502,message)
                updated=changed.json()['user']
                identity=f'{AUTH_URL}|{updated["id"]}'
                if user['remote_id'] and identity!=user['remote_id']: raise HTTPException(502,'La identidad de la cuenta no coincide.')
        except (requests.RequestException,ValueError,KeyError):
            raise HTTPException(502,'El servicio de cuentas no está disponible. No se cambiaron los datos locales.')
        with connect() as db:
            db.execute('UPDATE users SET name=?,email=?,avatar=?,remote_id=? WHERE id=?',(updated['name'],updated['email'],updated['avatar'],identity,user['id']))
    return profile(request)
