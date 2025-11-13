import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest, NextResponse } from "next/server";

import type { Database, ProfileRecord } from "@/lib/database.types";
import { getCurrentProfile } from "@/lib/auth/server";
import { sbRoute } from "@/lib/supabase-route";
import { jsonError } from "@/server/api";

type MaybePromise<T> = T | Promise<T>;

export interface RouteHandlerContext<
  Params extends Record<string, string | string[]> = Record<string, string | string[]>
> {
  params: Params;
}

type NextRouteHandlerContext<
  Params extends Record<string, string | string[]> = Record<string, string | string[]>
> = Omit<RouteHandlerContext<Params>, "params"> & {
  params: MaybePromise<Params>;
  [key: string]: unknown;
};

export interface PortalSessionContext {
  supabase: SupabaseClient<Database>;
  session: Session;
  profile: ProfileRecord;
}

export type PortalRouteHandler<
  Result,
  Params extends Record<string, string | string[]> = Record<string, string | string[]>
> = (
  request: NextRequest,
  context: RouteHandlerContext<Params>,
  auth: PortalSessionContext
) => Promise<Result>;

export function requirePortalSession<
  Result,
  Params extends Record<string, string | string[]> = Record<string, string | string[]>
>(handler: PortalRouteHandler<Result, Params>) {
  return async (
    request: NextRequest,
    context: NextRouteHandlerContext<Params>
  ): Promise<Result | NextResponse> => {
    const supabase = await sbRoute();
    const { session, profile } = await getCurrentProfile(supabase);

    if (!session || !profile) {
      return jsonError("Unauthorized", { status: 401 });
    }

    const params = await Promise.resolve(context.params);
    const normalizedContext = { ...context, params } as RouteHandlerContext<Params>;

    return handler(request, normalizedContext, { supabase, session, profile });
  };
}
