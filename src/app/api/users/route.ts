import { dbConnect } from "../../../lib/mongoose";
import User from "../../../models/User";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  // in case checking by email
  if (email) {
    console.log("Fetching unique user by email:", email);
    const user = await User.findOne({ email });
    return NextResponse.json(user || null);
  }

  console.log("Fetching all users");
  const users = await User.find();
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  await dbConnect();
  try {
    const data = await req.json();
    const { firebase_uid, name, email, username, profil_url, bio, location } = data;

    if (!firebase_uid || !name || !email || !username) {
      return NextResponse.json(
        { message: "firebase_uid, name, email and username are required" },
        { status: 400 }
      );
    }

    const user = await User.findOneAndUpdate(
      { firebase_uid },
      { firebase_uid, name, email, username, profil_url, bio, location },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(user, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
