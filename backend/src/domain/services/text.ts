function sanitize(text: unknown): string {
    if (typeof text !== "string") {
        return "";
    }
    return text.trim();
}

function slugify(text: string): string {
    return sanitize(text)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export { sanitize, slugify };
