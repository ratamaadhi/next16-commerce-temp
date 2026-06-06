import { describe, it, expect, beforeEach } from "vitest";
import {
  generateSessionId,
  getSessionId,
  setSessionId,
  getOrCreateSessionId,
  resetSessionId,
} from "../cart-session";

const SESSION_COOKIE = "cart-session";

describe("cart-session", () => {
  function clearCartSessionCookie() {
    document.cookie = `${SESSION_COOKIE}=;expires=${new Date(0).toUTCString()};path=/`;
  }

  beforeEach(() => {
    clearCartSessionCookie();
  });

  describe("generateSessionId", () => {
    it("returns a non-empty string", () => {
      const id = generateSessionId();
      expect(id).toBeTruthy();
      expect(typeof id).toBe("string");
    });

    it("returns unique values on subsequent calls", () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("setSessionId", () => {
    it("sets the session id in a cookie", () => {
      setSessionId("test-session-123");
      expect(document.cookie).toContain(`${SESSION_COOKIE}=test-session-123`);
    });
  });

  describe("getSessionId", () => {
    it("returns null when no session cookie exists", () => {
      expect(getSessionId()).toBeNull();
    });

    it("returns the session id from existing cookie", () => {
      setSessionId("my-session-id");
      expect(getSessionId()).toBe("my-session-id");
    });
  });

  describe("getOrCreateSessionId", () => {
    it("returns existing session id from cookie", () => {
      setSessionId("existing-id");
      const id = getOrCreateSessionId();
      expect(id).toBe("existing-id");
    });

    it("generates and persists a new session id when none exists", () => {
      const id = getOrCreateSessionId();
      expect(id).toBeTruthy();
      expect(document.cookie).toContain(`${SESSION_COOKIE}=${id}`);
      expect(getSessionId()).toBe(id);
    });
  });

  describe("resetSessionId", () => {
    it("generates a new session id and overwrites the cookie", () => {
      setSessionId("old-session-id");
      expect(getSessionId()).toBe("old-session-id");

      const newId = resetSessionId();

      expect(newId).not.toBe("old-session-id");
      expect(document.cookie).toContain(`${SESSION_COOKIE}=${newId}`);
      expect(getSessionId()).toBe(newId);
    });
  });
});
