import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../prisma.js";
import { generateToken, requireAuth, AuthRequest } from "../middleware/auth.middleware.js";
import otpService from "../services/otp.service.js";

const router = Router();

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  phone: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  language: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const SendOtpSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

const VerifyOtpSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  name: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  language: z.string().optional(),
});

const GoogleAuthSchema = z.object({
  credential: z.string().min(1, "Google ID token credential is required"),
});

// Register new user
router.post("/register", async (req, res) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { email, password, name, phone, state, district, language } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: "An account with this email already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        state: state || "Punjab",
        district: district || "Ludhiana",
        language: language || "Hindi",
        role: "USER",
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        language: user.language,
        state: user.state,
        district: user.district,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid email or password format" });
      return;
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        language: user.language,
        state: user.state,
        district: user.district,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * POST /api/v1/auth/otp/send
 * Request 6-digit OTP code to an Indian mobile number
 */
router.post("/otp/send", async (req, res) => {
  try {
    const parsed = SendOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const result = await otpService.sendOtp(parsed.data.phone);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "Failed to send OTP" });
  }
});

/**
 * POST /api/v1/auth/otp/verify
 * Verify OTP and auto-login or register farmer user
 */
router.post("/otp/verify", async (req, res) => {
  try {
    const parsed = VerifyOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { phone: rawPhone, otp, name, state, district, language } = parsed.data;
    const { phone } = await otpService.verifyOtp(rawPhone, otp);

    // Look up existing user by phone or create new farmer account
    let user = await prisma.user.findFirst({
      where: { phone },
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const defaultEmail = `${phone}@farmer.kishanvaani.in`;
      user = await prisma.user.create({
        data: {
          phone,
          email: defaultEmail,
          name: name && name.trim() ? name.trim() : `Kishan Mitr (${phone.slice(-4)})`,
          state: state || "Punjab",
          district: district || "Ludhiana",
          language: language || "Hindi",
          role: "USER",
        },
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.json({
      success: true,
      token,
      isNewUser,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        language: user.language,
        state: user.state,
        district: user.district,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "OTP verification failed" });
  }
});

// Quick Demo Login (Farmer / Expert / Admin) - ONLY mounted in non-production environments
if (process.env.NODE_ENV !== "production") {
  router.post("/demo-login", async (req, res) => {
    try {
      const { role = "USER" } = req.body;

      const emailMap: Record<string, string> = {
        USER: "farmer@kishanvaani.in",
        EXPERT: "expert@kishanvaani.in",
        ADMIN: "admin@kishanvaani.in",
      };

      const targetEmail = emailMap[role] || "farmer@kishanvaani.in";
      let user = await prisma.user.findUnique({ where: { email: targetEmail } });

      if (!user) {
        // Auto-provision demo account on-demand so 1-click demo login always succeeds
        const demoNames: Record<string, string> = {
          USER: "Sardar Gurpreet Singh",
          EXPERT: "Dr. Arvind Pathak (ICAR Scientist)",
          ADMIN: "KishanVaani Administrator",
        };
        const hashedPassword = await bcrypt.hash("farmer123", 10);
        user = await prisma.user.create({
          data: {
            email: targetEmail,
            name: demoNames[role] || "KishanVaani Demo User",
            password: hashedPassword,
            role: (role === "ADMIN" || role === "EXPERT") ? role : "USER",
            state: role === "EXPERT" ? "Uttar Pradesh" : "Punjab",
            district: role === "EXPERT" ? "Gorakhpur" : "Ludhiana",
            language: role === "USER" ? "Punjabi" : "Hindi",
          },
        });
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          language: user.language,
          state: user.state,
          district: user.district,
          avatarUrl: user.avatarUrl,
        },
      });
    } catch (error) {
      console.error("Demo login error:", error);
      res.status(500).json({ error: "Demo login failed" });
    }
  });
}

/**
 * POST /api/v1/auth/google
 * Cryptographically verifies Google OAuth credential with Google Identity API
 */
router.post("/google", async (req, res) => {
  try {
    const parsed = GoogleAuthSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { credential } = parsed.data;

    let payload: {
      sub: string;
      email: string;
      name: string;
      picture?: string;
    };

    // Test mode / Mock token support for automated CI test suite
    if (process.env.NODE_ENV === "test" && credential === "mock-google-id-token") {
      payload = {
        sub: "google-test-sub-123456",
        email: "testfarmer@gmail.com",
        name: "Google Verified Farmer",
        picture: "https://lh3.googleusercontent.com/test",
      };
    } else {
      // Authenticate cryptographically against Google's Token Verification API
      const googleRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      );
      if (!googleRes.ok) {
        res.status(401).json({ error: "Invalid or expired Google credential" });
        return;
      }

      const googleData = (await googleRes.json()) as any;

      if (!googleData.sub || !googleData.email) {
        res.status(401).json({ error: "Incomplete profile from Google token" });
        return;
      }

      payload = {
        sub: googleData.sub,
        email: googleData.email,
        name: googleData.name || googleData.email.split("@")[0],
        picture: googleData.picture,
      };
    }

    // Match or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: payload.sub }, { email: payload.email }],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId: payload.sub,
          email: payload.email,
          name: payload.name,
          avatarUrl: payload.picture,
          role: "USER",
          state: "Punjab",
          district: "Ludhiana",
          language: "Hindi",
        },
      });
    } else if (!user.googleId) {
      // Link Google ID if user previously registered with email
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: payload.sub,
          ...(payload.picture && !user.avatarUrl ? { avatarUrl: payload.picture } : {}),
        },
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        language: user.language,
        state: user.state,
        district: user.district,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ error: "Google authentication failed" });
  }
});

// Get Current User Profile
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        state: true,
        district: true,
        language: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            bookmarks: true,
            history: true,
            questions: true,
            stories: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Update Profile
router.put("/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, phone, state, district, language, avatarUrl } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(state && { state }),
        ...(district && { district }),
        ...(language && { language }),
        ...(avatarUrl && { avatarUrl }),
      },
    });

    res.json({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        language: updated.language,
        state: updated.state,
        district: updated.district,
        avatarUrl: updated.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
