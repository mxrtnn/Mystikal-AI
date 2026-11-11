import { Bot, Ghost, Moon, Palette, Rocket, Sparkles } from 'lucide-react';
const icons={sparkles:Sparkles,moon:Moon,bot:Bot,palette:Palette,rocket:Rocket,ghost:Ghost};
export function Avatar({value='sparkles'}:{value?:string}){const Icon=icons[value as keyof typeof icons]??Sparkles;return <Icon size={28}/>;}
export default function AvatarPicker({value,onChange}:{value:string;onChange:(value:string)=>void}){
  return <div className="avatar-picker" role="group" aria-label="Elige tu avatar">{Object.keys(icons).map(key=><button type="button" key={key} aria-label={`Avatar ${key}`} aria-pressed={value===key} onClick={()=>onChange(key)}><Avatar value={key}/></button>)}</div>;
}
