import type { Engine } from '../types/studio';
export const MODEL_OPTIONS=[
 {id:'animagine',label:'Animagine XL 4.0',guidance:7,source:'https://huggingface.co/cagliostrolab/animagine-xl-4.0',hint:'Ilustración anime. Puedes probar etiquetas de artistas; reconocer una etiqueta depende del entrenamiento.'},
 {id:'wai',label:'WAI Illustrious SDXL v17',guidance:5,source:'https://civitai.com/models/827184?modelVersionId=2883731',hint:'Checkpoint de la familia Illustrious / SDXL. ILLUST identifica esta familia en TAGs; no es un modelo de NovelAI.'},
] as const;
export type ModelAvailability=Partial<Record<Engine,boolean>>;
export function modelLabel(engine?:string,model?:string){
 const id=engine??(model?.toLowerCase().includes('wai')?'wai':model?.includes('pony')?'pony':model?.includes('flux')?'flux':'animagine');
 return MODEL_OPTIONS.find(item=>item.id===id)?.label??(id==='pony'?'Pony (retirado)':id==='flux'?'FLUX (retirado)':'Modelo retirado');
}
