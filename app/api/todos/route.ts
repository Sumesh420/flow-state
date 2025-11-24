import { NextRequest,NextResponse } from "next/server";
import {auth} from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { todo } from "node:test";


export async function GET(request:NextRequest){
    const {userId}=await auth();
    if(!userId){
        return NextResponse.json({error:"Unauthorized"},{status:401});
    }
    const ITEM_PER_PAGE=10;
    const {searchParams}=new URL(request.url);
    const page=Math.max(parseInt(searchParams.get("page")||"1"));
    const search=searchParams.get("search")||"";
    try {
        const todos=await prisma.todo.findMany({where:{
            userid:userId,
            title:{
                contains:search,
                mode:"insensitive"
            },
            
        },
     take:ITEM_PER_PAGE,
     skip:(page-1)*ITEM_PER_PAGE
    });
    const totalItems=await prisma.todo.count({where:{userid:userId,
        title:{
            contains:search,
            mode:"insensitive"
        }
    }});
    const totalPages=Math.ceil(totalItems/ITEM_PER_PAGE);
    return NextResponse.json({
        todos,
        totalPages,
        currentPage:page
    });

    } catch (error:any) {
        return NextResponse.json({error:"Something gone wrong"},{status:500})
    }
     
};

export async function POST(request:NextRequest){
    const {userId}=await auth();
    if(!userId){
        return NextResponse.json({error:"Unauthorized"},{status:401});
    }
    try {
        const user=await prisma.user.findUnique({where:{id:userId},
        include:{
            todos:true
        }});
        if(!user){
            return NextResponse.json({error:"User not found"},{status:404});
        }
        
        const todoCount = await prisma.todo.count({
            where: { userid: userId }
        });
        if(!user.isSubscribed && todoCount>=3){
            return NextResponse.json({errorMesage:"Free users can only create upto 3 todos.Please subscribe to our plan to write more awesome todos"},{status:403})
        }
        const{title}=await request.json();
        if(!title || title.trim() === ""){
    return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
    );
}
        const todo=await prisma.todo.create({data:{title,userid:userId}});
        return NextResponse.json(todo,{status:201});
    } catch (error:any) {
        return NextResponse.json({error:"Internal server error"},{status:500})
    }
}