"use client";

import {useEffect} from "react";
import {prefersReducedMotion,scrollToSection} from "@/lib/motion";

export default function StoreMotion(){
  useEffect(()=>{
    const onAnchor=(event:MouseEvent)=>{
      if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
      const link=(event.target as Element)?.closest<HTMLAnchorElement>("a[href]");
      if(!link||link.target||link.hasAttribute("download"))return;
      const next=new URL(link.href,location.href);
      if(next.origin!==location.origin||next.pathname!==location.pathname||next.search!==location.search||!next.hash)return;
      const id=decodeURIComponent(next.hash.slice(1));
      const target=document.getElementById(id);
      if(!target)return;
      event.preventDefault();
      history.pushState(null,"",next.hash);
      scrollToSection(id);
    };
    document.addEventListener("click",onAnchor);
    // Animate local client-side page changes in browsers without native page transitions.
    const onPage=()=>{if(!prefersReducedMotion())document.querySelector("main")?.animate([{opacity:.75},{opacity:1}],{duration:240})};
    window.addEventListener("popstate",onPage);
    return()=>{document.removeEventListener("click",onAnchor);window.removeEventListener("popstate",onPage)};
  },[]);
  return null;
}
