import { readUser } from './session';
import type { ImageResult } from '../types/studio';
export type GalleryImage=ImageResult & {title?:string;notes?:string;favorite?:boolean;featured?:boolean;trashed_at?:number|null};
function key(){const user=readUser();let guest=sessionStorage.getItem('mystikal_demo_owner');if(!guest){guest=crypto.randomUUID();sessionStorage.setItem('mystikal_demo_owner',guest);}return `mystikal_demo_library:${user?.id??user?.email??guest}`;}
export function readDemoLibrary():GalleryImage[]{try{return JSON.parse(localStorage.getItem(key())||'[]');}catch{return [];}}
function write(images:GalleryImage[]){localStorage.setItem(key(),JSON.stringify(images));return images;}
export function saveDemoImage(image:ImageResult){const images=readDemoLibrary();const existing=images.find(item=>item.id===image.id);if(existing){existing.trashed_at=null;}else{if(images.filter(item=>!item.trashed_at).length>=1000)throw new Error('Tu colección está llena.');images.unshift({...image,title:image.demo_title??'',favorite:false,featured:false});}write(images);}
export function editDemoImage(id:string,changes:Partial<GalleryImage>){const images=readDemoLibrary();const next=images.map(item=>item.id===id?{...item,...changes}:item);if(next.filter(item=>!item.trashed_at).length>1000)throw new Error('Tu colección está llena.');return write(next);}
