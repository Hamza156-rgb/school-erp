import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getUserById } from "../db";
import { SCHOOL_SESSION_COOKIE, verifySession } from "../customAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

function readCookie(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return undefined;
  return cookieHeader.split(";").map(value => value.trim()).find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  const token = readCookie(opts.req.headers.cookie, SCHOOL_SESSION_COOKIE);
  const session = await verifySession(token);
  const user = session ? (await getUserById(session.userId)) ?? null : null;
  return { req: opts.req, res: opts.res, user };
}
