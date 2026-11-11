"""Local prompt composition; scene and characters remain separate API fields."""
class Cancelled(Exception):pass

STYLE_PROMPTS={
 'original':'', 'anime':'anime illustration, expressive lineart',
 'retro':'1990s anime aesthetic, retro colors, film grain',
 'realistic':'photorealistic, natural lighting, realistic materials',
 '3d':'3d render, physically based materials, studio lighting',
 '2d':'2d illustration, clean lineart, flat colors'
}

def effective_prompt(request):
    # CLIP receives shared conditioning, not independent character regions.
    # Put explicit character descriptions before scene text so they are no
    # longer relegated to the tail of a long scene prompt.
    characters=[character.description.strip() for character in request.characters if character.description.strip()]
    parts=[request.artist.strip(),STYLE_PROMPTS[request.style],*characters,request.prompt.strip()]
    return ', '.join(part for part in parts if part)
