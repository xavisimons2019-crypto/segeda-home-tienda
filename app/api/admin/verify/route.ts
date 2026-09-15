import {adminClient} from '@/lib/admin';
export async function POST(request:Request){return await adminClient(request)?Response.json({ok:true}):Response.json({ok:false},{status:401});}
