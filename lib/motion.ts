import { flushSync } from "react-dom";

export function prefersReducedMotion(){
  return typeof window!=="undefined"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Native transitions preserve focus, URLs and normal browser navigation. */
export function transitionView(update:()=>void){
  if(typeof document==="undefined"||prefersReducedMotion()||!document.startViewTransition){update();return;}
  document.startViewTransition(()=>flushSync(update));
}

export function scrollToSection(id:string){
  const target=document.getElementById(id);
  if(!target)return;
  target.scrollIntoView({behavior:prefersReducedMotion()?"instant":"smooth",block:"start"});
  if(!prefersReducedMotion()){
    window.setTimeout(()=>target.animate([{opacity:.72},{opacity:1}],{duration:450,easing:"ease-out"}),280);
  }
}
