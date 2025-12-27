import { describe, it, expect } from "vitest";
import {
  signInSchema,
  signUpSchema,
  magicLinkSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./schemas";

describe("signInSchema", () => {
  it("rejects invalid email", () => {
    const result = signInSchema.safeParse({ email: "not-an-email", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = signInSchema.safeParse({ email: "test@example.com", password: "" });
    expect(result.success).toBe(false);
  });

  it("accepts valid email and password", () => {
    const result = signInSchema.safeParse({ email: "test@example.com", password: "password123" });
    expect(result.success).toBe(true);
  });

  it("trims whitespace from email", () => {
    const result = signInSchema.safeParse({ email: "  test@example.com  ", password: "pass" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });
});

describe("signUpSchema", () => {
  it("rejects password shorter than 6 characters", () => {
    const result = signUpSchema.safeParse({ email: "test@example.com", password: "12345" });
    expect(result.success).toBe(false);
  });

  it("accepts password with 6+ characters", () => {
    const result = signUpSchema.safeParse({ email: "test@example.com", password: "123456" });
    expect(result.success).toBe(true);
  });
});

describe("magicLinkSchema", () => {
  it("rejects invalid email", () => {
    const result = magicLinkSchema.safeParse({ email: "invalid" });
    expect(result.success).toBe(false);
  });

  it("accepts valid email", () => {
    const result = magicLinkSchema.safeParse({ email: "user@domain.com" });
    expect(result.success).toBe(true);
  });
});

describe("forgotPasswordSchema", () => {
  it("rejects empty email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });

  it("accepts valid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "forgot@test.com" });
    expect(result.success).toBe(true);
  });
});

describe("resetPasswordSchema", () => {
  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "newpassword123",
      confirmPassword: "differentpassword",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Passwords do not match");
    }
  });

  it("rejects short password", () => {
    const result = resetPasswordSchema.safeParse({
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("accepts matching valid passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "validpassword123",
      confirmPassword: "validpassword123",
    });
    expect(result.success).toBe(true);
  });
});
