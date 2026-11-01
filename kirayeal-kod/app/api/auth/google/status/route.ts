import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
export async function GET(){return NextResponse.json({enabled:Boolean(process.env.GOOGLE_CLIENT_ID?.trim()&&process.env.GOOGLE_CLIENT_SECRET?.trim())},{headers:{"Cache-Control":"no-store"}});}
