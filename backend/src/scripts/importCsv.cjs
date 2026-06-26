/**
 * Import CSV → Production Database
 * ================================
 * Standalone Node.js script (no TypeScript needed).
 *
 * Usage on the production server:
 *   docker cp importCsv.mjs abclumni-backend-1:/tmp/
 *   docker cp alumni.csv abclumni-backend-1:/tmp/
 *   docker exec abclumni-backend-1 node /tmp/importCsv.mjs /tmp/alumni.csv
 *
 * The script uses the DATABASE_URL from the container's environment.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

// ─── CSV Parser ─────────────────────────────────────────────────────────────

function parseCsv(content) {
    const lines = content.split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = parseCsvLine(lines[0]);
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = parseCsvLine(line);
        if (values.length === 0) continue;

        rows.push({
            nom: getCol(values, headers, "Nom"),
            prenom: getCol(values, headers, "Prénom"),
            membre: getCol(values, headers, "Membre ?"),
            posteActuel: getCol(values, headers, "Poste actuel"),
            entreprise: getCol(values, headers, "Entreprises"),
            entrepreneuriat: getCol(values, headers, "Entrepreneuriat"),
            secteurPublicPrive: getCol(values, headers, "Secteur Public/Privé ?"),
            secteurActivite: getCol(values, headers, "Secteur d'activité"),
            ville: getCol(values, headers, "Ville de résidence"),
            pays: getCol(values, headers, "Pays de résidence"),
            ecole: getCol(values, headers, "Ecole"),
            mandat: getCol(values, headers, "Mandat"),
            ancienPosteAbc: getCol(values, headers, "Ancien(s) poste(s) ABC"),
            linkedin: getCol(values, headers, "Linkedin"),
            contactAbc: getCol(values, headers, "Contact ABC"),
            statut: getCol(values, headers, "Statut"),
            dateRdv: getCol(values, headers, "Date de RDV"),
            coordonnees: getCol(values, headers, "Coordonnées"),
            email: getCol(values, headers, "Email"),
            emailSecondaire: getCol(values, headers, "Email secondaire"),
            questionsEntretien: getCol(values, headers, "Questions entretien"),
            newsletters: getCol(values, headers, "Newsletters"),
            abcEntrepreneurs: getCol(values, headers, "ABCentrepreneurs"),
            eventAlumni: getCol(values, headers, "Event alumni"),
            dispoEvent: getCol(values, headers, "Dispo event"),
            caAlumniVisio: getCol(values, headers, "CA alumni (visio)"),
            conseils: getCol(values, headers, "Conseils"),
            commentaires: getCol(values, headers, "Commentaires"),
            typeContact: getCol(values, headers, "Type de contact"),
        });
    }
    return rows;
}

function getCol(values, headers, name) {
    const idx = headers.indexOf(name);
    return idx >= 0 ? (values[idx] || "").trim() : "";
}

function parseCsvLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === "," && !inQuotes) {
            result.push(current);
            current = "";
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeProfileType(typeContact) {
    const t = typeContact.toLowerCase().trim();
    if (t.includes("membre") || t === "membre actuel") return "membre";
    if (t.includes("alumni") || t === "alumni/a confirmer") return "alumni";
    if (t.includes("adhérent") || t.includes("adherent")) return "adherent";
    if (t.includes("sympathisant")) return "membre";
    return "alumni";
}

function cleanLinkedinUrl(url) {
    if (!url) return "";
    return url.replace(/\?.*$/, "").replace(/\/$/, "");
}

function extractPhone(coordonnees) {
    if (!coordonnees) return "";
    return coordonnees
        .replace(/^\(\+\)\s*/, "+")
        .replace(/^00\s*/, "+")
        .replace(/\s+/g, "")
        .trim();
}

function generateRandomPassword() {
    return crypto.randomBytes(16).toString("hex");
}

function extractBio(row) {
    const parts = [];
    if (row.ancienPosteAbc) parts.push("Ancien poste ABC: " + row.ancienPosteAbc);
    if (row.ecole) parts.push("École: " + row.ecole);
    if (row.commentaires) parts.push(row.commentaires);
    return parts.join(" | ").slice(0, 500);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
    const csvPath = process.argv[2];
    if (!csvPath) {
        console.error("Usage: node importCsv.mjs <path-to-csv>");
        process.exit(1);
    }

    console.log("Reading CSV: " + csvPath);
    if (!fs.existsSync(csvPath)) {
        console.error("CSV file not found: " + csvPath);
        process.exit(1);
    }

    const content = fs.readFileSync(csvPath, "utf-8");
    const rows = parseCsv(content);
    console.log("Parsed " + rows.length + " rows");

    const validRows = rows.filter((r) => {
        const hasEmail = isValidEmail(r.email);
        const hasName = r.prenom || r.nom;
        const hasEmail2 = isValidEmail(r.emailSecondaire);
        return hasEmail || (hasEmail2 && hasName);
    });
    console.log(validRows.length + " rows have valid email + name");

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error("DATABASE_URL not set in environment");
        process.exit(1);
    }
    console.log("Connecting to database...");

    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);
    const db = new PrismaClient({ adapter });

    let created = 0;
    let skipped = 0;
    let errors = 0;
    const now = new Date();

    for (const row of validRows) {
        const email = row.email || row.emailSecondaire;
        if (!isValidEmail(email)) {
            skipped++;
            continue;
        }

        try {
            const existing = await db.user.findUnique({ where: { email } });
            if (existing) {
                skipped++;
                continue;
            }

            const userId = uuidv4();
            const profileId = uuidv4();
            const password = generateRandomPassword();
            const passwordHash = bcrypt.hashSync(password, 4);
            const profileType = normalizeProfileType(row.typeContact);
            const linkedin = cleanLinkedinUrl(row.linkedin);
            const phone = extractPhone(row.coordonnees) || row.coordonnees;

            await db.user.create({
                data: {
                    id: userId,
                    email,
                    passwordHash,
                    role: "member",
                    status: "active",
                    acceptedTermsAt: now,
                    createdAt: now,
                    profile: {
                        create: {
                            id: profileId,
                            firstName: row.prenom || "Inconnu",
                            lastName: row.nom || "Inconnu",
                            promotion: row.mandat || "",
                            photo: "",
                            bio: extractBio(row),
                            city: row.ville || "",
                            position: row.posteActuel || "",
                            company: row.entreprise || "",
                            sector: row.secteurActivite || "",
                            linkedin,
                            phone,
                            skills: [],
                            interests: [],
                            availability: "none",
                            experience: "",
                            profileType,
                            isMasked: false,
                            visibility: {
                                email: false,
                                linkedin: true,
                                phone: false,
                                city: true,
                                company: true,
                                position: true,
                                skills: true,
                                interests: true,
                            },
                        },
                    },
                },
            });

            created++;
            if (created % 50 === 0) {
                console.log("   Imported " + created + " users... (" + skipped + " skipped, " + errors + " errors)");
            }
        } catch (err) {
            errors++;
            console.error("   Error on " + email + ": " + err.message);
        }
    }

    console.log("");
    console.log("═══════════════════════════════════════");
    console.log("   Created:  " + created);
    console.log("   Skipped:  " + skipped + " (already exists)");
    console.log("   Errors:   " + errors);
    console.log("═══════════════════════════════════════");

    await db.$disconnect();
    await pool.end();
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
