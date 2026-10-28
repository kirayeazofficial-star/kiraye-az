import type { Metadata } from "next";
import MessagesPanel from "./MessagesPanel";
export const metadata: Metadata = {title:"Mesajlar | kirayeal.az",robots:{index:false,follow:false}};
export default function MessagesPage(){return <MessagesPanel/>;}
