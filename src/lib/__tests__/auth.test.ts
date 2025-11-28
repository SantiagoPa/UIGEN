import { describe, test, expect, vi, beforeEach } from "vitest";
import { createSession } from "../auth";

const mockSet = vi.fn();
const mockCookies = vi.fn(() => ({ set: mockSet }));

vi.mock("next/headers", () => ({
  cookies: () => mockCookies(),
}));

vi.mock("server-only", () => ({}));

const mockSign = vi.fn().mockResolvedValue("mock-jwt-token");
const mockSetProtectedHeader = vi.fn().mockReturnThis();
const mockSetExpirationTime = vi.fn().mockReturnThis();
const mockSetIssuedAt = vi.fn().mockReturnThis();

vi.mock("jose", () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: mockSetProtectedHeader,
    setExpirationTime: mockSetExpirationTime,
    setIssuedAt: mockSetIssuedAt,
    sign: mockSign,
  })),
  jwtVerify: vi.fn(),
}));

describe("createSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("creates a JWT token with correct payload", async () => {
    const { SignJWT } = await import("jose");

    await createSession("user-123", "test@example.com");

    expect(SignJWT).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-123",
        email: "test@example.com",
        expiresAt: expect.any(Date),
      })
    );
  });

  test("sets correct JWT headers and expiration", async () => {
    await createSession("user-123", "test@example.com");

    expect(mockSetProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
    expect(mockSetExpirationTime).toHaveBeenCalledWith("7d");
    expect(mockSetIssuedAt).toHaveBeenCalled();
    expect(mockSign).toHaveBeenCalled();
  });

  test("sets cookie with correct name and token", async () => {
    await createSession("user-123", "test@example.com");

    expect(mockSet).toHaveBeenCalledWith(
      "auth-token",
      "mock-jwt-token",
      expect.any(Object)
    );
  });

  test("sets cookie with httpOnly flag", async () => {
    await createSession("user-123", "test@example.com");

    expect(mockSet).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
      })
    );
  });

  test("sets cookie with sameSite lax", async () => {
    await createSession("user-123", "test@example.com");

    expect(mockSet).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        sameSite: "lax",
      })
    );
  });

  test("sets cookie with path /", async () => {
    await createSession("user-123", "test@example.com");

    expect(mockSet).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        path: "/",
      })
    );
  });

  test("sets cookie expiration to 7 days from now", async () => {
    const now = Date.now();
    vi.setSystemTime(now);

    await createSession("user-123", "test@example.com");

    const expectedExpiry = new Date(now + 7 * 24 * 60 * 60 * 1000);

    expect(mockSet).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        expires: expectedExpiry,
      })
    );

    vi.useRealTimers();
  });
});
