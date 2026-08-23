import type { SlugGenerator } from '../../application/ports/slug-generator.port.js';

export class SlugifyGenerator implements SlugGenerator {
    generate(name: string): string {
        return name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
}
