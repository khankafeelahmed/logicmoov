import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { HttpError } from "../../lib/httpError";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../lib/tokens";

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  locale?: string;
  role?: Role;
}

function publicUser(user: {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  phone: string | null;
  locale: string;
}) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    phone: user.phone,
    locale: user.locale,
  };
}

async function issueTokens(user: { id: string; role: Role; email: string }) {
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });
  const refreshToken = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });

  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw HttpError.conflict("Email already registered");

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phone: input.phone,
      locale: input.locale ?? "fr",
      // Only allow self-registration as CUSTOMER or DRIVER.
      role: input.role === "DRIVER" ? "DRIVER" : "CUSTOMER",
    },
  });

  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

export async function login(email: string, password: string) {
  const canonicalEmail = email.trim().toLowerCase();
  const emailCandidates = Array.from(
    new Set([
      canonicalEmail,
      canonicalEmail === "admin@taximovqc.ca" ? "admin@logicmoov.ca" : "",
      canonicalEmail === "admin@logicmoov.ca" ? "admin@taximovqc.ca" : "",
    ].filter(Boolean)),
  );

  let user = null;
  for (const candidate of emailCandidates) {
    user = await prisma.user.findUnique({ where: { email: candidate } });
    if (user) break;
  }

  if (!user) throw HttpError.unauthorized("Invalid credentials");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw HttpError.unauthorized("Invalid credentials");

  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

export async function refresh(refreshToken: string) {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw HttpError.unauthorized("Invalid refresh token");
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
  });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw HttpError.unauthorized("Refresh token expired or revoked");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw HttpError.unauthorized("User not found");

  // Rotate: revoke the used token and issue a fresh pair.
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revoked: true },
  });

  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken) },
    data: { revoked: true },
  });
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw HttpError.notFound("User not found");
  return publicUser(user);
}
