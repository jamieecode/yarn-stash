import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { AuthProvider } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuthService } from "./auth.service";

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as unknown as Response;
}

describe("AuthService", () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock };
    yarn: { updateMany: jest.Mock };
    patternBookmark: { updateMany: jest.Mock };
    project: { updateMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let jwtService: { sign: jest.Mock };
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn() },
      yarn: { updateMany: jest.fn().mockReturnValue("yarn.updateMany") },
      patternBookmark: { updateMany: jest.fn().mockReturnValue("patternBookmark.updateMany") },
      project: { updateMany: jest.fn().mockReturnValue("project.updateMany") },
      $transaction: jest.fn(),
    };
    jwtService = { sign: jest.fn().mockReturnValue("signed.jwt.token") };
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue("dummy") } },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe("createGuest", () => {
    it("creates an anonymous GUEST user and issues a JWT", async () => {
      prisma.user.create.mockResolvedValue({ id: "guest-1", provider: AuthProvider.GUEST });

      const result = await service.createGuest();

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { provider: AuthProvider.GUEST, providerId: null },
      });
      expect(result).toEqual({
        accessToken: "signed.jwt.token",
        user: { id: "guest-1", provider: AuthProvider.GUEST },
      });
    });
  });

  describe("loginWithKakao", () => {
    it("throws UnauthorizedException when the token exchange fails", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({}, false));

      await expect(service.loginWithKakao("bad-code")).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException when the profile lookup fails", async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: "kakao-token" }))
        .mockResolvedValueOnce(jsonResponse({}, false));

      await expect(service.loginWithKakao("code")).rejects.toThrow(UnauthorizedException);
    });

    it("finds an existing user by provider+providerId instead of creating a duplicate", async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: "kakao-token" }))
        .mockResolvedValueOnce(jsonResponse({ id: 12345 }));
      prisma.user.findUnique.mockResolvedValue({ id: "user-1", provider: AuthProvider.KAKAO, providerId: "12345" });

      const result = await service.loginWithKakao("code");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { provider_providerId: { provider: AuthProvider.KAKAO, providerId: "12345" } },
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(result.user).toEqual({ id: "user-1", provider: AuthProvider.KAKAO });
    });

    it("creates a new user when no matching provider+providerId exists yet", async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: "kakao-token" }))
        .mockResolvedValueOnce(jsonResponse({ id: 999 }));
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: "new-user", provider: AuthProvider.KAKAO, providerId: "999" });

      await service.loginWithKakao("code");

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { provider: AuthProvider.KAKAO, providerId: "999", nickname: undefined },
      });
    });

    it("merges guest data into the new/existing account when a guest session is upgraded (기획서 2.9)", async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: "kakao-token" }))
        .mockResolvedValueOnce(jsonResponse({ id: 12345 }));
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: "real-user", provider: AuthProvider.KAKAO, providerId: "12345" }) // find-or-create lookup
        .mockResolvedValueOnce({ id: "guest-1", provider: AuthProvider.GUEST }); // guest lookup inside mergeGuestInto check
      prisma.$transaction.mockResolvedValue([]);

      await service.loginWithKakao("code", "guest-1");

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("does not merge when the resolved user IS the guest (i.e. nothing to upgrade)", async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: "kakao-token" }))
        .mockResolvedValueOnce(jsonResponse({ id: 12345 }));
      prisma.user.findUnique.mockResolvedValue({ id: "guest-1", provider: AuthProvider.KAKAO, providerId: "12345" });

      await service.loginWithKakao("code", "guest-1");

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("loginWithGoogle", () => {
    it("throws UnauthorizedException when the token exchange fails", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({}, false));
      await expect(service.loginWithGoogle("bad-code")).rejects.toThrow(UnauthorizedException);
    });

    it("uses the Google `sub` claim as providerId", async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: "google-token" }))
        .mockResolvedValueOnce(jsonResponse({ sub: "google-sub-1", name: "Jamie" }));
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: "new-user", provider: AuthProvider.GOOGLE, providerId: "google-sub-1" });

      await service.loginWithGoogle("code");

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { provider: AuthProvider.GOOGLE, providerId: "google-sub-1", nickname: "Jamie" },
      });
    });
  });

  describe("mergeGuestInto", () => {
    it("reassigns Yarn/PatternBookmark/Project ownership from the guest to the target user in one transaction", async () => {
      prisma.$transaction.mockResolvedValue([]);

      await service.mergeGuestInto("guest-1", "user-1");

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      const calls = prisma.$transaction.mock.calls[0][0];
      expect(calls).toHaveLength(3);
    });
  });
});
