import { PrismaClient } from "@prisma/client";

function prismaClientSingleton(){
    return new PrismaClient();
}
type prismaClientSingleton=ReturnType<typeof prismaClientSingleton>
const globalforPrisma=globalThis as unknown as {prisma:PrismaClient | undefined};
const prisma=globalforPrisma.prisma ?? prismaClientSingleton();

if(process.env.NODE_ENV!=="production") globalforPrisma.prisma=prisma;
export default prisma;