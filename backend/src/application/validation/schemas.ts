import { z } from "zod";

const registerSchema = z.object({
    email: z.string().email(),
    password: z
        .string()
        .min(8)
        .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
        .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
        .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    promotion: z.string().min(2),
    company: z.string().default(""),
    sector: z.string().default(""),
    position: z.string().default(""),
    city: z.string().default(""),
    linkedin: z.string().default(""),
    phone: z.string().default(""),
    skills: z.array(z.string()).default([]),
    interests: z.array(z.string()).default([]),
    availability: z.enum(["networking", "mentoring", "recruiting", "none"]).default("none"),
    acceptedTerms: z.boolean().refine((value: boolean) => value === true, {
        message: "Vous devez accepter les conditions d'utilisation"
    })
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

const profileUpdateSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    promotion: z.string().min(2).optional(),
    photo: z.string().optional(),
    bio: z.string().max(1000).optional(),
    city: z.string().optional(),
    position: z.string().optional(),
    company: z.string().optional(),
    sector: z.string().optional(),
    linkedin: z.string().optional(),
    phone: z.string().optional(),
    skills: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
    availability: z.enum(["networking", "mentoring", "recruiting", "none"]).optional(),
    isMasked: z.boolean().optional(),
    visibility: z
        .object({
            email: z.boolean().optional(),
            linkedin: z.boolean().optional(),
            phone: z.boolean().optional(),
            city: z.boolean().optional(),
            company: z.boolean().optional(),
            position: z.boolean().optional(),
            skills: z.boolean().optional(),
            interests: z.boolean().optional()
        })
        .optional()
});

const articleSchema = z.object({
    title: z.string().min(5),
    content: z.string().min(10),
    category: z.string().min(2),
    tags: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    urgent: z.boolean().default(false)
});

const resourceSchema = z.object({
    title: z.string().min(5),
    type: z.string().min(2),
    url: z.string().url(),
    description: z.string().default(""),
    memberOnly: z.boolean().default(true)
});

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;
type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
type ArticleInput = z.infer<typeof articleSchema>;
type ResourceInput = z.infer<typeof resourceSchema>;

export { registerSchema, loginSchema, profileUpdateSchema, articleSchema, resourceSchema };
export type { RegisterInput, LoginInput, ProfileUpdateInput, ArticleInput, ResourceInput };
