import { UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { UserRole } from "../../drizzle/schema";
import { hasGrantedPermission } from "../db";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(requireUser);

export function roleProcedure(...roles: UserRole[]) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    if (!roles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to perform this action." });
    }
    return next({ ctx });
  });
}

export const adminProcedure = roleProcedure("super_admin", "school_owner", "school_admin");

export function permissionProcedure(permissionCode: string) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    const fullAccessRoles: UserRole[] = ["super_admin", "school_owner", "school_admin"];
    if (!fullAccessRoles.includes(ctx.user.role) && !(await hasGrantedPermission(ctx.user.organizationId, ctx.user.role, permissionCode))) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to perform this action." });
    }
    return next({ ctx });
  });
}
