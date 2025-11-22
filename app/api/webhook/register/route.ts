import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { json } from 'stream/consumers';
import { eventNames } from "process";
import prisma from "@/lib/prisma";


export async function POST(req:Request){
    const WEBHOOK_SECRET=process.env.WEBHOOK_SECRET;
    if(!WEBHOOK_SECRET){
        throw new Error("Please add webhook secret in .env")
    }
    const headersPayload=await headers();
    const svixId= headersPayload.get("svix-id");
    const svixTimeStamp=headersPayload.get("svix-timestamp");
    const svixSignature=headersPayload.get("svix-signature")
    if(!svixId || !svixTimeStamp || !svixSignature){
        throw new Error("Error happend-no svix headers")
    }
    const payload=await req.json();
    const body=JSON.stringify(payload);
    const wh=new Webhook(WEBHOOK_SECRET);
    let evnt:WebhookEvent;
    try {
        evnt=wh.verify(body,{
            "svix-id": svixId,
            "svix-timestamp": svixTimeStamp,
            "svix-signature": svixSignature,
        })as WebhookEvent;
    } catch (error:any) {
        console.log(error);
        return new Response("Error-happend :svix verification error ",{status:400})
    }
    const {id}=evnt.data;
    const eventType=evnt.type;
    try {
        if(eventType==="user.created"){
            const {email_addresses,primary_email_address_id}=evnt.data;
            const primaryEmail=email_addresses.find((email)=>email.id===primary_email_address_id);
            if(!primaryEmail){
                return new Response("Primary email not found",{status:400});
            }
            const newUser=await prisma.user.create({
                data:{
                    id:evnt.data.id!,
                    email:primaryEmail.email_address,
                    isSubscribed:false
                }
            });
            console.log("User created successfully");
        }
    } catch (error:any) {
        return new Response("Error creating user in database",{status:400});
    }
    return new Response("Webhook received successfully",{status:400});
}
