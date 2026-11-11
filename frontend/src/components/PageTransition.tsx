import { useLayoutEffect } from 'react';
import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export default function PageTransition({children,pathname,hash}:{children:ReactNode;pathname:string;hash:string}){
 const reduceMotion=useReducedMotion();
 useLayoutEffect(()=>{
  let anchor=hash.slice(1);
  try{anchor=decodeURIComponent(anchor);}catch{/* Keep malformed fragments harmless. */}
  const target=hash?document.getElementById(anchor):null;
  if(target)target.scrollIntoView({behavior:'instant',block:'start'});
  else if(!hash)window.scrollTo({top:0,left:0,behavior:'instant'});
 },[pathname,hash]);
 return <motion.div className="page-transition" initial={reduceMotion?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={reduceMotion?{opacity:1}:{opacity:0,y:-5}} transition={{duration:reduceMotion?0:.22,ease:'easeOut'}}>{children}</motion.div>;
}
