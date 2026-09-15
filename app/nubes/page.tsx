import type { Metadata } from "next";
import NubesClient from "./nubes-client";

export const metadata:Metadata={title:"Nubes temáticas personalizadas | Segeda Home",description:"Elige entre cientos de diseños de nubes temáticas personalizadas en MDF, desde S/80 y con envíos a todo el Perú."};
export default function Nubes(){return <NubesClient/>}
