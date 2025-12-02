const icons = {
    // Helper to wrap SVG content
    wrap: (content, bgColor) => {
        const svg = `<svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
            <rect width="72" height="72" rx="8" fill="${bgColor}"/>
            ${content}
        </svg>`;
        const base64 = Buffer.from(svg).toString('base64');
        return `data:image/svg+xml;base64,${base64}`;
    },

    // Icon Definitions (Filled Style)
    light: '<circle cx="36" cy="28" r="10" fill="#ffffff" fill-opacity="0.9"/><rect x="33" y="40" width="6" height="8" rx="1" fill="#ffffff" fill-opacity="0.9"/><rect x="30" y="50" width="12" height="4" rx="1" fill="#ffffff" fill-opacity="0.9"/>',

    socket: '<rect x="18" y="24" width="36" height="24" rx="4" fill="#ffffff" fill-opacity="0.9"/><circle cx="30" cy="36" r="3" fill="#1a1a1a"/><circle cx="42" cy="36" r="3" fill="#1a1a1a"/>',

    switch: '<rect x="16" y="28" width="40" height="16" rx="8" fill="#ffffff" fill-opacity="0.3"/><circle cx="28" cy="36" r="6" fill="#ffffff" fill-opacity="0.9"/>',

    snowflake: '<path d="M36 18 L36 54 M18 36 L54 36 M24 24 L48 48 M48 24 L24 48" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.9"/>',

    thermometer: '<rect x="32" y="20" width="8" height="24" rx="4" fill="#ffffff" fill-opacity="0.9"/><circle cx="36" cy="50" r="8" fill="#ffffff" fill-opacity="0.9"/><rect x="34" y="28" width="4" height="16" fill="#ff4444" fill-opacity="0.8"/>',

    kettle: `<path d="M26 22 L46 22 C50 22 52 26 52 30 L54 48 C54 52 50 54 46 54 L26 54 C22 54 18 52 18 48 L20 30 C20 26 22 22 26 22 Z" fill="#ffffff" fill-opacity="0.9"/>
        <path d="M52 30 C58 30 58 46 52 46" stroke="#ffffff" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.9"/>
        <path d="M20 32 L14 28" stroke="#ffffff" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.9"/>
        <rect x="33" y="18" width="6" height="4" rx="1" fill="#ffffff" fill-opacity="0.9"/>`,

    tv: '<rect x="16" y="26" width="40" height="28" rx="3" fill="#ffffff" fill-opacity="0.9"/><path d="M26 20 L36 26 L46 20" stroke="#ffffff" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.9"/>',

    fan: '<circle cx="36" cy="36" r="4" fill="#ffffff" fill-opacity="0.9"/><path d="M36 20 C40 24 40 32 36 36 M52 36 C48 40 40 40 36 36 M36 52 C32 48 32 40 36 36 M20 36 C24 32 32 32 36 36" fill="#ffffff" fill-opacity="0.7"/>',

    fridge: '<rect x="24" y="18" width="24" height="36" rx="3" fill="#ffffff" fill-opacity="0.9"/><line x1="24" y1="36" x2="48" y2="36" stroke="#1a1a1a" stroke-width="2"/><rect x="40" y="24" width="2" height="8" rx="1" fill="#1a1a1a"/>',

    robot: '<rect x="20" y="32" width="32" height="20" rx="3" fill="#ffffff" fill-opacity="0.9"/><circle cx="30" cy="42" r="3" fill="#1a1a1a"/><circle cx="42" cy="42" r="3" fill="#1a1a1a"/><rect x="34" y="22" width="4" height="10" fill="#ffffff" fill-opacity="0.9"/>',

    droplets: '<path d="M36 20 C32 28 28 32 28 38 C28 44 32 48 36 48 C40 48 44 44 44 38 C44 32 40 28 36 20 Z" fill="#ffffff" fill-opacity="0.9"/>',

    blinds: '<rect x="20" y="20" width="32" height="4" rx="1" fill="#ffffff" fill-opacity="0.9"/><rect x="20" y="28" width="32" height="4" rx="1" fill="#ffffff" fill-opacity="0.9"/><rect x="20" y="36" width="32" height="4" rx="1" fill="#ffffff" fill-opacity="0.9"/><rect x="20" y="44" width="32" height="4" rx="1" fill="#ffffff" fill-opacity="0.9"/>',

    door: '<rect x="24" y="18" width="24" height="36" rx="2" fill="#ffffff" fill-opacity="0.9"/><circle cx="42" cy="36" r="2" fill="#1a1a1a"/>',

    eye: '<ellipse cx="36" cy="36" rx="18" ry="12" fill="#ffffff" fill-opacity="0.9"/><circle cx="36" cy="36" r="6" fill="#1a1a1a"/>',

    default: '<path d="M36 18 L28 32 L34 32 L32 54 L40 40 L34 40 Z" fill="#ffffff" fill-opacity="0.9"/>'
};

module.exports = {
    getIcon: (type, isOn) => {
        const t = type.toLowerCase();

        // Background Colors
        let bgColor = '#1a1a1a'; // Off state

        if (isOn) {
            bgColor = '#F59E0B'; // Amber

            if (t.includes('socket') || t.includes('switch')) bgColor = '#3B82F6'; // Blue
            else if (t.includes('kettle') || t.includes('coffee')) bgColor = '#EF4444'; // Red
            else if (t.includes('thermostat') || t.includes('ac') || t.includes('climate')) bgColor = '#06B6D4'; // Cyan
            else if (t.includes('fridge')) bgColor = '#0891B2'; // Cyan-dark
            else if (t.includes('sensor')) bgColor = '#A855F7'; // Purple
            else if (t.includes('curtain') || t.includes('gate')) bgColor = '#10B981'; // Green
        }

        // Icon Selection
        let content = icons.default;

        if (t.includes('light')) content = icons.light;
        else if (t.includes('socket')) content = icons.socket;
        else if (t.includes('switch')) content = icons.switch;
        else if (t.includes('thermostat') || t.includes('heater')) content = icons.thermometer;
        else if (t.includes('ac') || t.includes('climate')) content = icons.snowflake;
        else if (t.includes('fan')) content = icons.fan;
        else if (t.includes('humidifier') || t.includes('purifier') || t.includes('water') || t.includes('leak')) content = icons.droplets;
        else if (t.includes('kettle') || t.includes('coffee')) content = icons.kettle;
        else if (t.includes('fridge')) content = icons.fridge;
        else if (t.includes('vacuum')) content = icons.robot;
        else if (t.includes('tv')) content = icons.tv;
        else if (t.includes('curtain') || t.includes('blind')) content = icons.blinds;
        else if (t.includes('door') || t.includes('gate')) content = icons.door;
        else if (t.includes('sensor') || t.includes('motion')) content = icons.eye;

        return icons.wrap(content, bgColor);
    }
};
