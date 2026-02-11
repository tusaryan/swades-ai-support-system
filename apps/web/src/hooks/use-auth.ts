import { useAuthStore } from "@/lib/auth-store";

export function useAuth() {
    const { user, accessToken, login, logout, register, isAuthenticated } = useAuthStore();

    return {
        user,
        token: accessToken,
        login,
        logout,
        register,
        isAuthenticated
    };
}
