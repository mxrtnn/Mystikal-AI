"""Optional local import. Never sends email or images to any service."""
import json
from pathlib import Path
import uuid
import privacy

def main():
    email=input('Correo de tu cuenta (solo se usa localmente, no se envia): ').strip()
    owner=privacy.account_id(email)
    with privacy.connect() as db:
        user=db.execute('SELECT id FROM users WHERE id=? AND guest=0',(owner,)).fetchone()
    if not user:
        raise SystemExit('Primero inicia sesion con esa cuenta en la app actualizada. No se modifico ningun archivo.')
    source=Path(__file__).resolve().parent/'outputs'
    count=0
    from PIL import Image
    from PIL.PngImagePlugin import PngInfo
    for path in source.glob('*.json'):
        try:
            data=json.loads(path.read_text(encoding='utf-8'))
            image_id=str(uuid.UUID(data['id']))
            if path.stem != image_id or not (source/(image_id+'.png')).exists():
                continue
            with privacy.connect() as db:
                if db.execute('SELECT id FROM images WHERE id=?',(image_id,)).fetchone():
                    continue
            # Older files have no trusted rating: import into NSFW, private, unreviewed.
            data.update(nsfw=True,legacy_imported=True,artist=data.get('artist',''))
            info=PngInfo();info.add_text('mystikal',json.dumps(data,ensure_ascii=False))
            with Image.open(source/(image_id+'.png')) as image:
                image.save(privacy.output_path(owner,True,image_id,'.png'),pnginfo=info)
            privacy.output_path(owner,True,image_id,'.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
            with privacy.connect() as db:
                db.execute('INSERT INTO images(id,owner,nsfw,shared,reviewed_sfw,metadata) VALUES (?,?,?,?,?,?)',(image_id,owner,1,0,0,json.dumps(data,ensure_ascii=False)))
            count+=1
        except (ValueError,KeyError,OSError):
            continue
    print(f'Importadas {count} imagenes como privadas y NSFW/sin revisar. Los originales permanecen intactos.')
if __name__=='__main__':
    main()
