import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse ,NextRequest} from "next/server";
import { clerkClient } from "@clerk/clerk-sdk-node";

const publicRoutes=createRouteMatcher([
    "/sign-in",
    "/sign-up",
    "/api/webhook/register"
]);

export default clerkMiddleware(async(auth,req)=>{
    const {userId,sessionClaims}=await auth();
    if(publicRoutes(req)){
        return NextResponse.next();
    }
    if(!userId){
        return NextResponse.redirect(new URL("/sign-in",req.url))
    }
    
      try {
         const publicMetadata= sessionClaims?.publicMetadata as {role?:string}|undefined;
         const role=publicMetadata?.role as string|undefined;
         if(role==="admin"&&req.nextUrl.pathname==="/dashboard"){
          return NextResponse.redirect(new URL("/admin/dashboard",req.url));
         }
         //prevents non admin user access admin routes
         if(role!=="admin"&&req.nextUrl.pathname.startsWith("/admin")){
          return NextResponse.redirect(new URL("/dashboard",req.url))
         }
         //
        //  if(publicRoutes(req)){
        //   return NextResponse.redirect(new URL(role==="admin"?"/admin/dashboard":"/dashboard",req.url))
        //  }
      } catch (error:any) {
        console.log(error);
        return NextResponse.redirect(new URL("/error",req.url));
      }

    
    return NextResponse.next();
});
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

