import { z } from "zod";
export const registerSchema = z.object({
  login: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_\-\.]+$/, "login_bad"),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128)
});
export const loginSchema = z.object({
  login: z.string().min(1).max(255),
  password: z.string().min(1).max(128)
});
export const serverSchema = z.object({
  name: z.string().min(2).max(80),
  shortDesc: z.string().max(300).default(""),
  descriptionMd: z.string().max(20000).default(""),
  host: z.string().min(1).max(255),
  port: z.number().int().min(1).max(65535).default(25565),
  bedrockPort: z.number().int().min(1).max(65535).nullable().optional(),
  edition: z.enum(["JAVA", "BEDROCK", "BOTH"]).default("JAVA"),
  version: z.string().max(50).default(""),
  tags: z.array(z.string().max(30)).max(15).default([]),
  language: z.string().max(10).default("ru"),
  country: z.string().max(60).default(""),
  website: z.string().max(255).default("").optional(),
  discord: z.string().max(255).default("").optional(),
  telegram: z.string().max(255).default("").optional(),
  vk: z.string().max(255).default("").optional(),
  access: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  joinRules: z.string().max(10000).default(""),
  whitelistQs: z.array(z.string().max(300)).max(10).default([]),
  logoUrl: z.string().max(500).default("").optional(),
  bannerUrl: z.string().max(500).default("").optional()
});
export const appSchema = z.object({
  nick: z.string().min(2).max(32).regex(/^[a-zA-Z0-9_]+$/, "nick_bad"),
  age: z.number().int().min(5).max(120).nullable().optional(),
  contact: z.string().max(255).default(""),
  answers: z.array(z.string().max(2000)).max(10).default([]),
  message: z.string().max(4000).default("")
});
