interface ColorTheme {
    name: string;
    filename: string;
    colors?: string[];
    darkColors?: string[];
}

export async function getColorThemes(): Promise<ColorTheme[]> {
    const modules = import.meta.glob('../assets/color-themes/*.json', { eager: true });
    const themes: ColorTheme[] = Object.entries(modules)
        .map(([path, module]: [string, any]) => {
            const filename = path.split('/').pop()?.replace('.json', '') || '';
            const name = filename
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            const colors = extractColors(module.default, false);
            const darkColors = extractColors(module.default, true);
            return {
                name,
                filename,
                colors,
                darkColors,
            };
        })
        .sort((a, b) => {
            if (a.filename === 'default') return -1;
            if (b.filename === 'default') return 1;
            return a.name.localeCompare(b.name);
        });
    return themes;
}

function extractColors(theme: any, isDark: boolean = false): string[] {
    if (!theme || !theme.cssVars) return [];
    const themeVars = isDark ? (theme.cssVars.dark || {}) : (theme.cssVars.light || {});
    const colors: string[] = [];
    const colorKeys = ['primary', 'accent', 'secondary', 'border'];
    for (const key of colorKeys) {
        const color = themeVars[key];
        if (color) {
            colors.push(color);
        }
    }
    return colors;
}

export async function getColorTheme(filename: string): Promise<any> {
    const modules = import.meta.glob('../assets/color-themes/*.json', { eager: true });
    const path = `../assets/color-themes/${filename}.json`;
    return modules[path]?.default || null;
}

