import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { error } from "console";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }
    const subscriptionEnd = new Date();
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isSubscribed: true,
        subscriptionEnds: subscriptionEnd,
      },
    });
    if (!updatedUser) {
      return NextResponse.json(
        {
          error: "Something went wrong while updating the user",
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        message: "user updated successfully",
        subscriptionEnds: subscriptionEnd,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isSubscribed: true,
        subscriptionEnds: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }
    const now = new Date();
    if (user.subscriptionEnds && user.subscriptionEnds < now) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isSubscribed: false,
          subscriptionEnds: null,
        },
      });
      return NextResponse.json(
        {
          message: "user subscription is ended",
          isSubscribed: false,
          subscriptionEnds: null,
        },
        { status: 200 }
      );
    }
    return NextResponse.json({
      message: "user fetched",
      data: {
        isSubscribed: user.isSubscribed,
        subscriptionEnds: user.subscriptionEnds,
      },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
