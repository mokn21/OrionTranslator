import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { nanoid } from "nanoid";
import { z } from "zod";

const sessions = new Map<string, {
  code: string;
  createdAt: number;
  history: Array<{ source: string; translation: string; createdAt: number }>;
}>();

const makeSessionCode = () => {
  let code = "";
  do {
    code = `SA-${nanoid(6).toUpperCase()}`;
  } while (sessions.has(code));
  return code;
};

async function translateWithFreeProvider(text: string) {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text.slice(0, 450));
  url.searchParams.set("langpair", "en|ar");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Translation provider returned ${response.status}`);
  const payload = await response.json() as { responseStatus?: number; responseData?: { translatedText?: string } };
  const translated = payload.responseData?.translatedText?.trim();
  if (!translated || payload.responseStatus !== 200) throw new Error("Translation provider returned no usable translation");
  return translated;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  sessions: router({
    create: publicProcedure.mutation(() => {
      const code = makeSessionCode();
      const session = { code, createdAt: Date.now(), history: [] as Array<{ source: string; translation: string; createdAt: number }> };
      sessions.set(code, session);
      return { code, createdAt: session.createdAt };
    }),
    get: publicProcedure.input(z.object({ code: z.string().regex(/^SA-[A-Z0-9]{6}$/) })).query(({ input }) => {
      const session = sessions.get(input.code);
      if (!session) throw new Error("الجلسة غير موجودة أو انتهت");
      return session;
    }),
    translate: publicProcedure.input(z.object({ code: z.string().regex(/^SA-[A-Z0-9]{6}$/), text: z.string().trim().min(1).max(1000) })).mutation(async ({ input }) => {
      const session = sessions.get(input.code);
      if (!session) throw new Error("الجلسة غير موجودة أو انتهت");
      const previous = session.history.find(item => item.source.toLowerCase() === input.text.toLowerCase());
      if (previous) return { ...previous, cached: true };
      const translation = await translateWithFreeProvider(input.text);
      const item = { source: input.text, translation, createdAt: Date.now() };
      session.history = [...session.history.slice(-9), item];
      return { ...item, cached: false };
    }),
  }),
});

export type AppRouter = typeof appRouter;
