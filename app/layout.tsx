import type { Metadata } from "next";
import "./globals.css";
import "./premium.css";
import StoreMotion from "./store-motion";
export const metadata: Metadata={title:"Segeda Home | Catálogo de decoración personalizada",description:"Decoración y regalos personalizados en MDF para niños, hogares y momentos especiales.",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="es"><body><StoreMotion/>{children}</body></html>}
