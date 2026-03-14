import { Hono } from "hono";
import { sign, verify } from "hono/jwt";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

import * as jpeg from "jpeg-js";
import * as bcrypt from "bcryptjs";

type Env = {
  DB: D1Database;
  TURNSTILE_SECRET_KEY?: string;
  JWT_SECRET?: string;
  BOOTSTRAP_TOKEN?: string;
  ALLOWED_ORIGINS?: string;
  ENVIRONMENT?: string;
  TOKEN_TTL_SECONDS?: string;
};


const app = new Hono<{ Bindings: Env; Variables: { user?: any } }>();

const PASSWORD_MIN_LENGTH = 8;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 64;
const DEFAULT_TOKEN_TTL_SECONDS = 60 * 60 * 8; // 8 hours
const MAX_BASE64_IMAGE_CHARS = 1_500_000; // ~1.1MB binary after base64 overhead
const MAX_STRING_FIELD_CHARS = 200;
const MAX_JSON_BODY_BYTES = 2_500_000; // 2.5MB cap for JSON payloads
const RATE_LIMIT_WINDOW_SECONDS = 10 * 60;
const LOGIN_RATE_LIMIT_MAX = 10;
const BOOTSTRAP_RATE_LIMIT_MAX = 3;

const isProduction = (env: Env) =>
  (env.ENVIRONMENT || "development").toLowerCase() === "production";

const getTokenTtlSeconds = (env: Env) => {
  const raw = env.TOKEN_TTL_SECONDS ? Number(env.TOKEN_TTL_SECONDS) : NaN;
  return Number.isFinite(raw) && raw > 300 ? raw : DEFAULT_TOKEN_TTL_SECONDS;
};

// JWT Secret - Read from Cloudflare secret (set via: npx wrangler secret put JWT_SECRET)
const getJwtSecret = (c: any) => {
  const secret = c.env.JWT_SECRET;
  if (!secret) {
    if (isProduction(c.env)) {
      throw new Error("JWT_SECRET is not configured");
    }
    console.warn("JWT_SECRET missing; using insecure dev fallback");
    return "dev-insecure-secret";
  }
  if (isProduction(c.env) && secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }
  return secret;
};

const getTurnstileSecret = (c: any) => {
  const secret = c.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (isProduction(c.env)) {
      throw new Error("TURNSTILE_SECRET_KEY is not configured");
    }
    return null;
  }
  return secret;
};

const getAllowedOrigins = (env: Env) =>
  (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

const isOriginAllowed = (origin: string, env: Env, host?: string | null) => {
  const allowed = getAllowedOrigins(env);
  if (allowed.length === 0) {
    if (!isProduction(env)) return true;
    if (!origin) return true;
    if (host) {
      const expected = `https://${host}`;
      return origin === expected;
    }
    return false;
  }
  return allowed.includes(origin);
};

// CORS + preflight handling
app.use("/*", async (c, next) => {
  const origin = c.req.header("Origin");
  const host = c.req.header("Host");
  if (origin && isOriginAllowed(origin, c.env, host)) {
    c.header("Access-Control-Allow-Origin", origin);
    c.header("Vary", "Origin");
    c.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    c.header("Access-Control-Max-Age", "86400");
  } else if (origin && isProduction(c.env)) {
    return c.json({ error: "CORS not allowed" }, 403);
  }

  if (c.req.method === "OPTIONS") {
    return c.body(null, 204);
  }

  await next();
});

// Basic request size guard (best-effort, relies on Content-Length)
app.use("/api/*", async (c, next) => {
  if (["POST", "PUT", "PATCH"].includes(c.req.method)) {
    const length = c.req.header("Content-Length");
    if (length && Number(length) > MAX_JSON_BODY_BYTES) {
      return c.json({ error: "Request payload too large" }, 413);
    }
  }
  await next();
});

// Security headers
app.use("/*", async (c, next) => {
  await next();

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: https:",
    "script-src 'self' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "connect-src 'self' https: https://challenges.cloudflare.com",
    "frame-src https://challenges.cloudflare.com",
  ].join("; ");

  c.header("Content-Security-Policy", csp);
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (isProduction(c.env)) {
    c.header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
});

// Prevent caching of auth responses
app.use("/api/auth/*", async (c, next) => {
  await next();
  c.header("Cache-Control", "no-store");
});

// Auth middleware
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.substring(7);
  try {
    const payload: any = await verify(token, getJwtSecret(c));
    const now = Math.floor(Date.now() / 1000);
    if (!payload?.exp || payload.exp < now) {
      return c.json({ error: "Token expired" }, 401);
    }
    if (!payload?.id) {
      return c.json({ error: "Invalid token" }, 401);
    }

    const dbUser: any = await c.env.DB.prepare(
      "SELECT id, username, role FROM users WHERE id = ?"
    ).bind(payload.id).first();

    if (!dbUser) {
      return c.json({ error: "User not found" }, 401);
    }

    c.set("user", dbUser);
    await next();
  } catch (err) {
    return c.json({ error: "Invalid token" }, 401);
  }
};

// Admin middleware
const adminMiddleware = async (c: any, next: any) => {
  const user = c.get("user");
  if (!user || user.role !== "admin") {
    return c.json({ error: "Admin access required" }, 403);
  }
  await next();
};

// Moderator middleware - allows moderator or admin
const moderatorMiddleware = async (c: any, next: any) => {
  const user = c.get("user");
  if (!user || (user.role !== "admin" && user.role !== "moderator")) {
    return c.json({ error: "Moderator or admin access required" }, 403);
  }
  await next();
};

const VALID_ROLES = ["user", "moderator", "admin"];

const loginSchema = z.object({
  username: z.string().trim().min(USERNAME_MIN_LENGTH).max(USERNAME_MAX_LENGTH),
  password: z.string().min(1).max(128),
  turnstileToken: z.string().optional(),
});

const registerSchema = z.object({
  username: z.string().trim().min(USERNAME_MIN_LENGTH).max(USERNAME_MAX_LENGTH),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(128),
  role: z.string().optional(),
});

const resetPasswordSchema = z.object({
  password: z.string().min(PASSWORD_MIN_LENGTH).max(128),
});

const updateRoleSchema = z.object({
  role: z.string().min(1),
});

const bootstrapSchema = z.object({
  token: z.string().min(1),
  username: z.string().trim().min(USERNAME_MIN_LENGTH).max(USERNAME_MAX_LENGTH),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(128),
});

const photoUrlSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .refine((val) => {
    if (!val) return true;
    if (val.startsWith("data:image")) {
      return val.length <= MAX_BASE64_IMAGE_CHARS;
    }
    return val.length <= 2048;
  }, "Invalid or oversized photo_url");

const animalSchema = z.object({
  photo_url: photoUrlSchema,
  animal_type: z.enum(["Dog", "Cat", "Other"]),
  name: z.string().trim().min(1).max(MAX_STRING_FIELD_CHARS),
  age: z.preprocess((val) => Number(val), z.number().int().min(0).max(50)),
  gender: z.enum(["Male", "Female"]),
  is_neutered: z.union([z.boolean(), z.number().int().min(0).max(1)]),
  vaccination_status: z.enum(["Fully Vaccinated", "Partially Vaccinated", "Not Vaccinated"]),
  area_of_living: z.string().trim().min(1).max(MAX_STRING_FIELD_CHARS),
  nature: z.enum(["Approachable", "Approach with Caution", "Aggressive"]),
  college_campus: z.string().trim().min(1).max(MAX_STRING_FIELD_CHARS),
  caregiver_name: z.string().trim().max(MAX_STRING_FIELD_CHARS).optional().nullable(),
  caregiver_email: z.string().trim().max(MAX_STRING_FIELD_CHARS).optional().nullable(),
  caregiver_mobile: z.string().trim().max(30).optional().nullable(),
});

const getClientIp = (c: any) => {
  const cf = c.req.header("CF-Connecting-IP");
  if (cf) return cf;
  const xff = c.req.header("X-Forwarded-For");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
};

const enforceRateLimit = async (
  c: any,
  key: string,
  max: number,
  windowSeconds: number
) => {
  const db = c.env.DB;
  const now = Math.floor(Date.now() / 1000);
  const ip = getClientIp(c);
  const bucketKey = `${key}:${ip}`;

  const existing: any = await db.prepare(
    "SELECT count, window_start FROM rate_limits WHERE key = ?"
  ).bind(bucketKey).first();

  if (!existing) {
    await db.prepare(
      "INSERT INTO rate_limits (key, count, window_start) VALUES (?, ?, ?)"
    ).bind(bucketKey, 1, now).run();
    return null;
  }

  const elapsed = now - Number(existing.window_start || 0);
  if (elapsed >= windowSeconds) {
    await db.prepare(
      "UPDATE rate_limits SET count = ?, window_start = ? WHERE key = ?"
    ).bind(1, now, bucketKey).run();
    return null;
  }

  if (Number(existing.count) >= max) {
    const retryAfter = Math.max(1, windowSeconds - elapsed);
    c.header("Retry-After", String(retryAfter));
    return c.json({ error: "Too many requests. Please try again later." }, 429);
  }

  await db.prepare(
    "UPDATE rate_limits SET count = count + 1 WHERE key = ?"
  ).bind(bucketKey).run();

  if (Math.random() < 0.01) {
    const staleBefore = now - windowSeconds * 10;
    await db.prepare(
      "DELETE FROM rate_limits WHERE window_start < ?"
    ).bind(staleBefore).run();
  }

  return null;
};

// Auth routes
app.post("/api/auth/login", zValidator("json", loginSchema), async (c) => {
  const db = c.env.DB;
  const { username, password, turnstileToken } = c.req.valid("json");

  const rateLimited = await enforceRateLimit(
    c,
    "login",
    LOGIN_RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_SECONDS
  );
  if (rateLimited) return rateLimited;

  // Verify Turnstile Token if secret key is provided
  let turnstileSecret: string | null;
  try {
    turnstileSecret = getTurnstileSecret(c);
  } catch (err) {
    return c.json({ error: "Captcha not configured" }, 500);
  }

  if (turnstileSecret) {
    if (!turnstileToken) {
      return c.json({ error: "Please complete the 'not a robot' check" }, 400);
    }

    const formData = new FormData();
    formData.append("secret", turnstileSecret);
    formData.append("response", turnstileToken);
    formData.append("remoteip", c.req.header("CF-Connecting-IP") || "");

    const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    const result = await fetch(url, {
      body: formData,
      method: "POST",
    });

    const outcome: any = await result.json();
    if (!outcome.success) {
      return c.json({ error: "Invalid captcha response. Please try again." }, 400);
    }
  }

  const user: any = await db.prepare(
    "SELECT * FROM users WHERE username = ?"
  ).bind(username).first();

  if (!user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const now = Math.floor(Date.now() / 1000);
  const token = await sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      iat: now,
      exp: now + getTokenTtlSeconds(c.env),
    },
    getJwtSecret(c)
  );

  return c.json({
    token,
    user: { id: user.id, username: user.username, role: user.role }
  });
});

app.get("/api/auth/me", authMiddleware, async (c) => {
  const user = c.get("user");
  return c.json({ user });
});

// Bootstrap admin creation (one-time). Requires BOOTSTRAP_TOKEN secret.
app.post("/api/auth/bootstrap", zValidator("json", bootstrapSchema), async (c) => {
  const db = c.env.DB;
  const { token, username, password } = c.req.valid("json");

  const rateLimited = await enforceRateLimit(
    c,
    "bootstrap",
    BOOTSTRAP_RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_SECONDS
  );
  if (rateLimited) return rateLimited;

  if (!c.env.BOOTSTRAP_TOKEN) {
    return c.json({ error: "Bootstrap disabled" }, 403);
  }
  if (token !== c.env.BOOTSTRAP_TOKEN) {
    return c.json({ error: "Invalid bootstrap token" }, 403);
  }

  const existing: any = await db.prepare(
    "SELECT COUNT(*) as count FROM users"
  ).first();
  if (existing?.count > 0) {
    return c.json({ error: "Users already exist" }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await db.prepare(
    "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)"
  ).bind(username, passwordHash, "admin").run();

  const newUser: any = await db.prepare(
    "SELECT id, username, role, created_at FROM users WHERE id = ?"
  ).bind(result.meta.last_row_id).first();

  return c.json({ user: newUser }, 201);
});

app.post("/api/auth/register", authMiddleware, adminMiddleware, zValidator("json", registerSchema), async (c) => {
  const db = c.env.DB;
  const { username, password, role } = c.req.valid("json");

  // Validate role
  const assignedRole = role || "user";
  if (!VALID_ROLES.includes(assignedRole)) {
    return c.json({ error: "Invalid role. Must be user, moderator, or admin" }, 400);
  }

  // Check if user exists
  const existingUser = await db.prepare(
    "SELECT id FROM users WHERE username = ?"
  ).bind(username).first();

  if (existingUser) {
    return c.json({ error: "Username already exists" }, 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await db.prepare(
    "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)"
  ).bind(username, passwordHash, assignedRole).run();

  const newUser: any = await db.prepare(
    "SELECT id, username, role, created_at FROM users WHERE id = ?"
  ).bind(result.meta.last_row_id).first();

  return c.json({ user: newUser }, 201);
});

app.get("/api/auth/users", authMiddleware, adminMiddleware, async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare(
    "SELECT id, username, role, created_at FROM users ORDER BY created_at DESC"
  ).all();

  return c.json(results);
});

// Delete user - Admin only
app.delete("/api/auth/users/:id", authMiddleware, adminMiddleware, async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");

  // Prevent admin from deleting themselves
  const currentUser = c.get("user");
  if (currentUser.id === parseInt(id)) {
    return c.json({ error: "You cannot delete your own account" }, 400);
  }

  await db.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Helper to compress image and return as Base64 string directly
async function compressAndUpload(base64Data?: string | null): Promise<string | null> {
  if (!base64Data) {
    return base64Data ?? null;
  }
  if (!base64Data.startsWith("data:image")) {
    return base64Data; // Already a URL
  }

  try {
    const [header, data] = base64Data.split(",");
    const binaryData = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";

    let compressedBuffer: ArrayBuffer;

    if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
      // Compress JPEG
      const rawImageData = jpeg.decode(binaryData);
      const compressed = jpeg.encode(rawImageData, 75); // 75% quality
      compressedBuffer = compressed.data.buffer;
    } else {
      // For other types, just use as is
      compressedBuffer = binaryData.buffer;
    }

    // Convert back to base64
    const compressedBinary = new Uint8Array(compressedBuffer);
    const compressedBase64 = btoa(
      compressedBinary.reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    return `data:image/jpeg;base64,${compressedBase64}`;
  } catch (err) {
    console.error("Compression failed:", err);
    return base64Data; // Fallback to original base64 if compression fails
  }
}

// Update user password - Admin only
app.patch("/api/auth/users/:id/password", authMiddleware, adminMiddleware, zValidator("json", resetPasswordSchema), async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const { password } = c.req.valid("json");

  const passwordHash = await bcrypt.hash(password, 10);
  await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .bind(passwordHash, id)
    .run();

  return c.json({ success: true });
});

// Update user role - Admin only
app.patch("/api/auth/users/:id/role", authMiddleware, adminMiddleware, zValidator("json", updateRoleSchema), async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const { role } = c.req.valid("json");

  if (!role || !VALID_ROLES.includes(role)) {
    return c.json({ error: "Invalid role. Must be user, moderator, or admin" }, 400);
  }

  // Prevent admin from changing their own role
  const currentUser = c.get("user");
  if (currentUser.id === parseInt(id)) {
    return c.json({ error: "You cannot change your own role" }, 400);
  }

  await db.prepare("UPDATE users SET role = ? WHERE id = ?")
    .bind(role, id)
    .run();

  return c.json({ success: true });
});

// Get all animals
app.get("/api/animals", async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare(
    "SELECT * FROM animals ORDER BY created_at DESC"
  ).all();

  c.header("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=300");

  return c.json(results.map((animal: any) => ({
    ...animal,
    is_neutered: animal.is_neutered === 1,
    caregiver_name: animal.caregiver_name_1,
    caregiver_mobile: animal.caregiver_mobile,
    caregiver_email: animal.caregiver_name_2,
    caregiver_name_1: undefined,
    caregiver_name_2: undefined
  })));
});

// Get single animal
app.get("/api/animals/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");

  const animal = await db.prepare(
    "SELECT * FROM animals WHERE id = ?"
  ).bind(id).first();

  if (!animal) {
    return c.json({ error: "Animal not found" }, 404);
  }

  c.header("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=300");

  return c.json({
    ...animal,
    is_neutered: animal.is_neutered === 1,
    caregiver_name: animal.caregiver_name_1,
    caregiver_mobile: animal.caregiver_mobile,
    caregiver_email: animal.caregiver_name_2,
    caregiver_name_1: undefined,
    caregiver_name_2: undefined
  });
});

// Create animal - Require authentication (User or Admin)
app.post("/api/animals", authMiddleware, zValidator("json", animalSchema), async (c) => {
  const db = c.env.DB;
  const body = c.req.valid("json");

  // Compress image to store as Base64 format in DB directly
  const photoUrl = await compressAndUpload(body.photo_url);
  if (photoUrl && photoUrl.startsWith("data:image") && photoUrl.length > MAX_BASE64_IMAGE_CHARS) {
    return c.json({ error: "Image too large. Please upload a smaller image." }, 413);
  }

  const result = await db.prepare(`
    INSERT INTO animals (
      photo_url, animal_type, name, age, gender, is_neutered,
      vaccination_status, area_of_living, nature, college_campus,
      caregiver_name_1, caregiver_name_2, caregiver_mobile
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    photoUrl,
    body.animal_type,
    body.name,
    body.age,
    body.gender,
    body.is_neutered ? 1 : 0,
    body.vaccination_status,
    body.area_of_living,
    body.nature,
    body.college_campus,
    body.caregiver_name || null,
    body.caregiver_email || null,
    body.caregiver_mobile || null
  ).run();

  const newAnimal = await db.prepare(
    "SELECT * FROM animals WHERE id = ?"
  ).bind(result.meta.last_row_id).first();

  if (!newAnimal) {
    return c.json({ error: "Failed to create animal" }, 500);
  }

  return c.json({
    ...newAnimal,
    is_neutered: newAnimal.is_neutered === 1,
    caregiver_name: newAnimal.caregiver_name_1,
    caregiver_mobile: newAnimal.caregiver_mobile,
    caregiver_email: newAnimal.caregiver_name_2,
    caregiver_name_1: undefined,
    caregiver_name_2: undefined
  }, 201);
});

// Update animal - Require moderator or admin
app.put("/api/animals/:id", authMiddleware, moderatorMiddleware, zValidator("json", animalSchema), async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = c.req.valid("json");

  // Compress image to store as Base64 format in DB directly
  const photoUrl = await compressAndUpload(body.photo_url);
  if (photoUrl && photoUrl.startsWith("data:image") && photoUrl.length > MAX_BASE64_IMAGE_CHARS) {
    return c.json({ error: "Image too large. Please upload a smaller image." }, 413);
  }

  await db.prepare(`
    UPDATE animals SET
      photo_url = ?,
      animal_type = ?,
      name = ?,
      age = ?,
      gender = ?,
      is_neutered = ?,
      vaccination_status = ?,
      area_of_living = ?,
      nature = ?,
      college_campus = ?,
      caregiver_name_1 = ?,
      caregiver_name_2 = ?,
      caregiver_mobile = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    photoUrl,
    body.animal_type,
    body.name,
    body.age,
    body.gender,
    body.is_neutered ? 1 : 0,
    body.vaccination_status,
    body.area_of_living,
    body.nature,
    body.college_campus,
    body.caregiver_name || null,
    body.caregiver_email || null,
    body.caregiver_mobile || null,
    id
  ).run();

  const updatedAnimal = await db.prepare(
    "SELECT * FROM animals WHERE id = ?"
  ).bind(id).first();

  if (!updatedAnimal) {
    return c.json({ error: "Animal not found" }, 404);
  }

  return c.json({
    ...updatedAnimal,
    is_neutered: updatedAnimal.is_neutered === 1,
    caregiver_name: updatedAnimal.caregiver_name_1,
    caregiver_mobile: updatedAnimal.caregiver_mobile,
    caregiver_email: updatedAnimal.caregiver_name_2,
    caregiver_name_1: undefined,
    caregiver_name_2: undefined
  });
});

// Delete animal - Require moderator or admin
app.delete("/api/animals/:id", authMiddleware, moderatorMiddleware, async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");

  await db.prepare(
    "DELETE FROM animals WHERE id = ?"
  ).bind(id).run();

  return c.json({ success: true });
});

export default app;
