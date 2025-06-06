export const registerSystemSettings = function () {
    // Track the system version which a migration was last applied
    game.settings.register('hm3', 'systemMigrationVersion', {
        name: 'System Migration Version',
        scope: 'world',
        config: false,
        type: String,
        default: 0
    });

    game.settings.register('hm3', 'actorMacrosFolderId', {
        name: 'ID of Actor Folder',
        scope: 'world',
        config: false,
        type: String,
        default: null
    });

    game.settings.register('hm3', 'weather', {
        name: 'Current Weather',
        scope: 'world',
        config: false,
        type: Object,
        default: {start: 0, weather: [{idx: undefined, force: undefined, precipitation: undefined}]}
    });

    game.settings.register('hm3', 'showWelcomeDialog', {
        name: 'Show Welcome Dialog On Start',
        hint: 'Display the welcome dialog box when the user logs in.',
        scope: 'client',
        config: true,
        type: Boolean,
        default: true
    });

    game.settings.register('hm3', 'customSunSign', {
        name: 'Custom SunSigns',
        hint: 'Enable custom SunSigns (no dropdown)',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register('hm3', 'weaponDamage', {
        name: 'Weapon Damage',
        hint: 'Enable optional combat rule that allows weapons to be damaged or destroyed on successful block (Combat 12)',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register('hm3', 'bloodloss', {
        name: 'Bloodloss',
        hint: 'Enable optional combat rule that tracks bloodloss as an injury (Combat 14) (partially implemented)',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register('hm3', 'amputation', {
        name: 'Amputation',
        hint: 'Enable optional combat rule that supports limb amputations (Combat 14)',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register('hm3', 'limbInjuries', {
        name: 'Limb Injuries',
        hint: 'Enable optional combat rule to handle stumble/fumble on limb injury (Combat 14)',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register('hm3', 'addInjuryToActorSheet', {
        name: 'Add Injuries',
        hint: 'Automatically add injuries to actor sheet',
        scope: 'world',
        config: true,
        default: 'enable',
        type: String,
        choices: {
            'enable': 'Add Injuries Automatically',
            'disable': "Don't Add Injuries Automatically",
            'ask': 'Prompt User On Each Injury'
        }
    });

    game.settings.register('hm3', 'missileTracking', {
        name: 'Track Missile Quantity',
        hint: 'Enable tracking of missile quantity, reduce missile quantity by 1 when used, and disallow missile attack when quantity is zero.',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register('hm3', 'combatAudio', {
        name: 'Combat Sounds',
        hint: 'Enable combat flavor sounds',
        scope: 'world',
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register('hm3', 'distanceUnits', {
        name: 'Distance Units',
        hint: "What units should be used for a missile weapon's short/medium/long/extreme range attributes?",
        scope: 'client',
        config: true,
        default: 'scene',
        type: String,
        choices: {
            'scene': 'Scene Units (e.g. feet)',
            'grid': 'Grid Units (e.g. hexes or squares)'
        }
    });

    game.settings.register('hm3', 'dormantPsionicTalents', {
        name: 'NEW Dormant Psionic Talents',
        hint: 'Activate to make dormant psionic talents (ML20 or less) invisible to the players. GM still sees the dormant talents. (Psionics 3)',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register('hm3', 'strictGmMode', {
        name: 'NEW Strict GM Mode',
        hint: 'If selected, players will no longer be able to change various data, such as weight, value and other aspects of the gear items. The GM can still change everything. In addition, the GM can hide the value of individual items from the players.',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register('hm3', 'blindGmMode', {
        name: 'NEW Blind GM Mode',
        hint: 'If selected, some skill rolls (such as Awareness, Hearing, Weatherlore, etc. (in cases where success or failure may not be obvious)) are handled as Blind GM Roll regardless of the Roll Mode setting. (Skills 5)',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register('hm3', 'activeEffectPermissions', {
        name: 'NEW Active Effect Permissions',
        hint: 'If selected, the active effect permissions are taken into account for the visibility of the effects for the players.',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register('hm3', 'showWeather', {
        name: 'NEW Weather',
        hint: 'If selected, weather is randomly generated according to HM rules for each watch.',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register('hm3', 'autoMarkUsedSkills', {
        name: 'NEW Auto Mark Used Skills',
        hint: 'If selected, the skills used are automatically marked for an SDR.',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register('hm3', 'truncateHighValueSkills', {
        name: 'NEW Truncate High Value Skills',
        hint: 'If selected, the skills are truncated according to HMA_Rulebook_v1.4.pdf.',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register('hm3', 'debugMode', {
        name: 'NEW Debug Mode',
        hint: 'If selected, Debug Mode is active.',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean
    });
};
