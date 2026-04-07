import axios from "axios";

function getApiErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError<{ error?: string }>(error)) {
        return error.response?.data?.error || fallback;
    }
    return fallback;
}

export { getApiErrorMessage };