import axios from "axios";

function getApiErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError<any>(error)) {
        const data = error.response?.data;
        if (data?.issues?.length) {
            const first = data.issues[0];
            const path = Array.isArray(first?.path) ? first.path.join(".") : "";
            const msg = typeof first?.message === "string" ? first.message : "";
            if (data?.error && path && msg) return `${data.error} (${path}: ${msg})`;
            if (msg) return msg;
        }
        return data?.error || fallback;
    }
    return fallback;
}

export { getApiErrorMessage };