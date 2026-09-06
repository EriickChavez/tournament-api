import 'dotenv/config';
import { pool } from '../config/database.js';
import { DrizzleSuperAdminRepository } from '../modules/superadmins/infrastructure/database/drizzle-super-admin.repository.js';
import { Argon2PasswordHasher } from '../modules/auth/infrastructure/security/argon2-password-hasher.js';

async function seedSuperAdmin(): Promise<void> {
    const email = process.env.SUPERADMIN_EMAIL;
    const password = process.env.SUPERADMIN_PASSWORD;
    const displayName = process.env.SUPERADMIN_DISPLAY_NAME ?? 'Super Admin';

    if (!email || !password) {
        throw new Error('SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD son requeridos para el seed.');
    }

    const repository = new DrizzleSuperAdminRepository();
    const hasher = new Argon2PasswordHasher();

    const existing = await repository.findByEmail(email);
    if (existing) {
        console.log(`Superadmin ${email} ya existe, no se crea de nuevo.`);
        await pool.end();
        return;
    }

    const passwordHash = await hasher.hash(password);
    const superAdmin = await repository.create({ email, passwordHash, displayName });
    console.log(`Superadmin creado: ${superAdmin.email} (${superAdmin.id})`);

    await pool.end();
}

seedSuperAdmin().catch((error: unknown) => {
    console.error('Seed de superadmin falló', error);
    process.exit(1);
});