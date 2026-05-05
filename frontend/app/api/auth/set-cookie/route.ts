import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { refresh_token } = (await req.json()) as { refresh_token?: string };
  if (!refresh_token) {
    return NextResponse.json({ message: "Missing refresh_token" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("refresh_token", refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return res;
}
