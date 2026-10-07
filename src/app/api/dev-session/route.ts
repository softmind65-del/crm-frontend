import { NextResponse, type NextRequest } from "next/server";
import {
  DEV_USER_ID_COOKIE,
  DEV_USER_NAME_COOKIE,
  getDevSessionCookieOptions,
  validateDevIdentity,
} from "@/lib/auth/dev-session-shared";


export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid development user." },
        { status: 400 }
      );
    }

    // Require plain object with exactly one field: "identity"
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Invalid development user." },
        { status: 400 }
      );
    }

    const payload = body as Record<string, unknown>;
    const keys = Object.keys(payload);

    if (
      keys.length !== 1 ||
      !("identity" in payload) ||
      typeof payload.identity !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid development user." },
        { status: 400 }
      );
    }

    const validation = validateDevIdentity(payload.identity);

    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.message },
        { status: 400 }
      );
    }

    // Single normalized value used for BOTH userId and displayName
    const identity = validation.value;

    const response = NextResponse.json({
      ok: true,
      displayName: identity,
      userId: identity,
    });

    const cookieOptions = getDevSessionCookieOptions();

    // Persist session in HTTP-only cookies
    // Development identity entered on /setup directly drives X-User-ID for FastAPI ownership
    response.cookies.set(DEV_USER_ID_COOKIE, identity, cookieOptions);
    response.cookies.set(DEV_USER_NAME_COOKIE, identity, cookieOptions);

    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid development user." },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });

  const expiredOptions = {
    ...getDevSessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  };

  response.cookies.set(DEV_USER_ID_COOKIE, "", expiredOptions);
  response.cookies.set(DEV_USER_NAME_COOKIE, "", expiredOptions);

  return response;
}
