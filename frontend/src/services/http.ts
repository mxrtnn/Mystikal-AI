export class ApiError extends Error {
  status:number;
  unavailable:boolean;
  constructor(message:string,status=0,unavailable=false){
    super(message);this.name='ApiError';this.status=status;this.unavailable=unavailable;
  }
}
function detailMessage(body:Record<string,unknown>):string|undefined {
  const detail=body.detail??body.error;
  if(typeof detail==='string')return detail;
  if(Array.isArray(detail))return detail.map(item=>typeof item?.msg==='string'?item.msg:'Parámetro no válido.').join(' ');
}
export async function readJsonResponse<T>(response:Response):Promise<T>{
  let text:string;
  try{text=await response.text();}catch{throw new ApiError('Se interrumpió la conexión con el backend. Revisa su terminal y recarga la página.',response.status,true);}
  let body:unknown;
  try{body=text.trim()?JSON.parse(text):undefined;}catch{/* HTML/empty proxy errors are not JSON API responses. */}
  if(!response.ok){
    const detail=body&&typeof body==='object'?detailMessage(body as Record<string,unknown>):undefined;
    if(detail)throw new ApiError(detail,response.status);
    if([502,503,504].includes(response.status))throw new ApiError('El backend no está disponible. Revisa la terminal del backend y ejecuta iniciar-local.ps1 backend; después recarga la página.',response.status,true);
    throw new ApiError(`El backend devolvió un error (HTTP ${response.status}). Revisa su terminal para conocer la causa.`,response.status);
  }
  if(!body||typeof body!=='object')throw new ApiError('El backend devolvió una respuesta vacía o incompleta. Revisa su terminal y recarga la página.',response.status);
  return body as T;
}
export async function requestJson<T>(url:string,options?:RequestInit):Promise<T>{
  let response:Response;
  try{response=await fetch(url,options);}catch(error){
    if(error instanceof Error&&error.name==='AbortError')throw error;
    throw new ApiError('No se pudo conectar con el backend. Comprueba que siga funcionando en su terminal.',0,true);
  }
  return readJsonResponse<T>(response);
}
