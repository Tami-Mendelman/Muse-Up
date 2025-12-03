import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const response = NextResponse.json({ message: "Logged out" });

    // מוחק את ה-cookie
    response.cookies.set({
        name: "token", 
        value: "", 
        path: "/",
        maxAge: 0, 
        httpOnly: true,
        sameSite: "lax", 
    });

    return response;
}
