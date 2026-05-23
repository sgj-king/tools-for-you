import { mockApi } from "@/services/mock";
import { apiClient, platformClient } from "@/services/sdk/client";
import type { ForgotPasswordResult, LoginResult, LogoutResult, PlanTier, RegisterResult, SessionUser } from "@/types/domain";
import type { ApiEnvelope } from "@/types/shared";

const useMock = process.env.NEXT_PUBLIC_ENABLE_MOCK === "true";
const usePlatformBff = process.env.NEXT_PUBLIC_ENABLE_PLATFORM_BFF === "true";

export const authApi = {
  getMe: async (): Promise<SessionUser> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<SessionUser>>("/api/platform/auth/me");
      return response.data;
    }
    if (useMock) {
      return mockApi.getSessionUser();
    }
    const response = await apiClient<ApiEnvelope<SessionUser>>("/v1/auth/me");
    return response.data;
  },
  login: async (payload: { email: string; password: string; mfaCode?: string; returnTo?: string }): Promise<LoginResult> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<LoginResult>>("/api/platform/auth/login", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      return response.data;
    }
    if (useMock) {
      return mockApi.login(payload);
    }
    const response = await apiClient<ApiEnvelope<LoginResult>>("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return response.data;
  },
  register: async (payload: {
    adminName: string;
    email: string;
    organizationName: string;
    password: string;
  }): Promise<RegisterResult> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<RegisterResult>>("/api/platform/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      return response.data;
    }
    if (useMock) {
      return mockApi.register();
    }
    const response = await apiClient<ApiEnvelope<RegisterResult>>("/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return response.data;
  },
  forgotPassword: async (payload: { email: string }): Promise<ForgotPasswordResult> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<ForgotPasswordResult>>("/api/platform/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      return response.data;
    }
    if (useMock) {
      return mockApi.forgotPassword(payload.email);
    }
    const response = await apiClient<ApiEnvelope<ForgotPasswordResult>>("/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return response.data;
  },
  updateProfile: async (payload: { displayName?: string; avatarUrl?: string | null }): Promise<SessionUser> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<SessionUser>>("/api/platform/auth/me", {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      return response.data;
    }
    if (useMock) {
      return mockApi.updateProfile(payload);
    }
    const response = await apiClient<ApiEnvelope<SessionUser>>("/v1/auth/me", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    return response.data;
  },
  updateTier: async (payload: { tier: PlanTier }): Promise<SessionUser> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<SessionUser>>("/api/platform/auth/me/tier", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      return response.data;
    }
    if (useMock) {
      return mockApi.updateTier(payload.tier);
    }
    const response = await apiClient<ApiEnvelope<SessionUser>>("/v1/auth/me/tier", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return response.data;
  },
  logout: async (): Promise<LogoutResult> => {
    if (usePlatformBff) {
      const response = await platformClient<ApiEnvelope<LogoutResult>>("/api/platform/auth/logout", {
        method: "POST"
      });
      return response.data;
    }
    if (useMock) {
      return mockApi.logout();
    }
    const response = await apiClient<ApiEnvelope<LogoutResult>>("/v1/auth/logout", {
      method: "POST"
    });
    return response.data;
  }
};
