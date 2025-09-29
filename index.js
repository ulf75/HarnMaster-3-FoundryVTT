// @ts-check

// Import Modules
import {ActorHM3} from './module/actor/actor.js';
import {CharacterSheetHM3v2} from './module/actor/character-sheet-v2.js';
import {ContainerSheetHM3v2} from './module/actor/container-sheet-v2.js';
import {CreatureSheetHM3v2} from './module/actor/creature-sheet-v2.js';
import {HM3} from './module/config.js';
import {registerFoundryGMHooks, registerFoundryHooks} from './module/foundry-hooks.js';
import {registerHandlebars} from './module/handlebars.js';
import {ActiveEffectHM3} from './module/hm3-active-effect.js';
import {ChatMessageHM3} from './module/hm3-chatmessage.js';
import {CombatHM3} from './module/hm3-combat.js';
import {CombatantHM3} from './module/hm3-combatant.js';
import {registerHM3GMHooks, registerHM3Hooks} from './module/hm3-hooks.js';
import {MacroHM3} from './module/hm3-macro.js';
import {RollHM3} from './module/hm3-roll.js';
import {TokenDocumentHM3, TokenHM3} from './module/hm3-token.js';
import {
    ActorType,
    ArcanePower,
    Aspect,
    Condition,
    Hook,
    InjuryType,
    ItemType,
    Location,
    MiscItemType,
    Range,
    SkillType
} from './module/hm3-types.js';
import {ActiveEffectConfigHM3} from './module/hm3/hm3-active-effect-config.js';
import {AmbientLightHM3} from './module/hm3/hm3-ambient-light.js';
import {AmbientSoundHM3} from './module/hm3/hm3-ambient-sound.js';
import {DrawingHM3} from './module/hm3/hm3-drawing.js';
import {MacroConfigHM3} from './module/hm3/hm3-macro-config.js';
import {NoteHM3} from './module/hm3/hm3-note.js';
import {RegionHM3} from './module/hm3/hm3-region.js';
import {TileHM3} from './module/hm3/hm3-tile.js';
import {WallHM3} from './module/hm3/hm3-wall.js';
import {ItemSheetHM3v2} from './module/item/item-sheet-v2.js';
import {ItemSheetHM3} from './module/item/item-sheet.js';
import {ItemHM3} from './module/item/item.js';
import {ArmorDataModel} from './module/item/models/armor-data-model.js';
import {ArmorlocationDataModel} from './module/item/models/armorlocation-data-model.js';
import {CompanionDataModel} from './module/item/models/companion-data-model.js';
import {ContainerDataModel} from './module/item/models/container-data-model.js';
import {EffectDataModel} from './module/item/models/effect-data-model.js';
import {InjuryDataModel} from './module/item/models/injury-data-model.js';
import {InvocationDataModel} from './module/item/models/invocation-data-model.js';
import {MiscgearDataModel} from './module/item/models/miscgear-data-model.js';
import {MissileDataModel} from './module/item/models/missile-data-model.js';
import {PsionicDataModel} from './module/item/models/psionic-data-model.js';
import {SkillDataModel} from './module/item/models/skill-data-model.js';
import {SpellDataModel} from './module/item/models/spell-data-model.js';
import {TraitDataModel} from './module/item/models/trait-data-model.js';
import {WeaponDataModel} from './module/item/models/weapon-data-model.js';
import {registerHooks} from './module/macro.js';
import * as macros from './module/macros.js';
import * as migrations from './module/migrations.js';
import {registerSystemSettings} from './module/settings.js';
import {registerDragRulerHook} from './module/speed-provider.js';
import {SlideToggleElement} from './module/toggle.js';
import {Weather} from './module/weather.js';
import {BaseTestHM3} from './tests/hm3-basetest.js';
import {runner} from './tests/runner.js';

// import './scss/hm3.scss';

globalThis.hm3 = {
    config: HM3,
    macros,
    migrations,

    ActorHM3,

    ActorType,
    ArcanePower,
    Aspect,
    Condition,
    Hook,
    InjuryType,
    ItemType,
    Location,
    MiscItemType,
    Range,
    SkillType,

    proxyCache: new Map(),

    CONST: {
        COMBAT: {SHOCK_INDEX_THRESHOLD: 20},
        TIME: {
            SECOND: 1,
            MINUTE: 60,
            HOUR: 60 * 60, // 3600 sec
            WATCH: 4 * 60 * 60,
            DAY: 24 * 60 * 60,
            TENDAY: 10 * 24 * 60 * 60,
            MONTH: 30 * 24 * 60 * 60,
            YEAR: 12 * 30 * 24 * 60 * 60,
            PERMANENT: Number.MAX_SAFE_INTEGER - 1,
            INDEFINITE: Number.MAX_SAFE_INTEGER
        }
    },
    gmconsole: async (level, msg, error) => {
        return hm3.socket.executeAsGM('gmConsole', game.user?.name, level, msg, error);
    },
    /**
     *
     * @param {Object} options
     * @param {string} [options.source]
     * @param {string} [options.text]
     * @param {Token | null} [options.token=null]
     * @returns
     */
    Gm2GmSays: async (text, source, token = null) => {
        return hm3.socket.executeAsGM('GmSays', {
            gmonly: true,
            sendingUserId: game.user?.id,
            source,
            text,
            tokenId: token ? token.id : null
        });
    },
    /**
     *
     * @param {Object} options
     * @param {boolean} [options.gmonly=false]
     * @param {User | null} [options.sendingUser=null]
     * @param {string | null} [options.source=null]
     * @param {string | null} [options.text=null]
     * @param {Token | null} [options.token=null]
     * @returns
     */
    GmSays: async ({gmonly = false, sendingUser = null, source = null, text = null, token = null}) => {
        console.assert(text, 'Parameter text not set');
        console.assert(game.user?.isGM ? true : token, 'Parameter token not set');
        if (!text) return;

        const gmUsers = game.users?.filter((user) => user.isGM).map((user) => user.id);
        const content = !!source
            ? `<div class="chat-card gmsays"><blockquote lang="en"><p>${text}</p><cite>&ndash; ${source}</cite></blockquote></div>`
            : `<div class="chat-card gmsays"><blockquote lang="en"><p>${text}</p></blockquote></div>`;
        const speaker = game.user?.isGM
            ? ChatMessageHM3.getSpeaker({alias: 'Simon says...', user: game.user})
            : ChatMessageHM3.getSpeaker({token});
        const msg = {
            content,
            speaker,
            type: CONST.CHAT_MESSAGE_STYLES.OTHER
        };

        // If the message is GM only, send it to the GM users
        if (gmonly && game.user?.isGM) {
            msg['whisper'] = gmUsers;
            console.info(
                `HM3 [GmSays] | GM only: ${text
                    .replaceAll('<b>', '')
                    .replaceAll('</b>', '')
                    .replaceAll('<h4>', '')
                    .replaceAll('</h4>', '')
                    .replaceAll('<p>', '')
                    .replaceAll('</p>', '')}`
            );
            return await ChatMessage.create(msg);
        }

        // If the message is not GM only, send it to all users
        else if (!gmonly) {
            console.info(
                `HM3 [GmSays] | ${text
                    .replaceAll('<b>', '')
                    .replaceAll('</b>', '')
                    .replaceAll('<h4>', '')
                    .replaceAll('</h4>', '')
                    .replaceAll('<p>', '')
                    .replaceAll('</p>', '')}`
            );
            return await ChatMessage.create(msg);
        }
    }
};

Hooks.once('init', async function () {
    // @ts-expect-error
    globalThis.hm3 = game.hm3 = Object.assign(game.system, globalThis.hm3);
    console.info(`HM3 | Initializing the HM3 Game System\n${HM3.ASCII}`);

    CONFIG.ActiveEffect.legacyTransferral = false;

    // @ts-expect-error
    window.customElements.define('slide-toggle', SlideToggleElement);

    /**
     * Set an initiative formula for the system
     */
    CONFIG.Combat.initiative = {
        formula: '@initiative',
        decimals: 1
    };

    // Set Combat Time Length
    CONFIG.time.roundTime = 10;
    CONFIG.time.turnTime = 0;

    // Set System Globals
    // @ts-expect-error
    CONFIG.HM3 = HM3;

    CONFIG.canvasTextStyle = new PIXI.TextStyle({
        fontFamily: 'Amasis MT Medium',
        fontSize: 36,
        fill: '#FFFFFF',
        stroke: '#111111',
        strokeThickness: 1,
        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowBlur: 2,
        dropShadowAngle: 0,
        dropShadowDistance: 0,
        align: 'center',
        wordWrap: false,
        padding: 1
    });

    // Register system settings
    registerSystemSettings();

    // Define custom ActiveEffect class
    //CONFIG.ActiveEffect.sheetClass = HM3ActiveEffectConfig;

    // Define custom Document classes
    CONFIG.Actor.documentClass = ActorHM3;
    CONFIG.Actor.typeLabels = {
        base: 'Base',
        character: 'Character',
        creature: 'Creature',
        container: 'Container'
    };
    // CONFIG.Actor.dataModels = {
    //     character: ActorDataModel,
    //     creature: ActorDataModel,
    //     container: ActorDataModel
    // };

    CONFIG.Item.documentClass = ItemHM3;
    CONFIG.Item.typeLabels = {
        base: 'Base',
        armorgear: 'Armor',
        armorlocation: 'Armor Location',
        companion: 'Companion',
        containergear: 'Container',
        effectgear: 'Effect',
        injury: 'Injury',
        invocation: 'Invocation',
        miscgear: 'Misc. Gear',
        missilegear: 'Missile Weapon',
        psionic: 'Psionic',
        skill: 'Skill',
        spell: 'Spell',
        trait: 'Trait',
        weapongear: 'Melee Weapon'
    };
    CONFIG.Item.dataModels = {
        armorgear: ArmorDataModel,
        armorlocation: ArmorlocationDataModel,
        companion: CompanionDataModel,
        containergear: ContainerDataModel,
        effectgear: EffectDataModel,
        injury: InjuryDataModel,
        invocation: InvocationDataModel,
        miscgear: MiscgearDataModel,
        missilegear: MissileDataModel,
        psionic: PsionicDataModel,
        skill: SkillDataModel,
        spell: SpellDataModel,
        trait: TraitDataModel,
        weapongear: WeaponDataModel
    };

    CONFIG.Combat.documentClass = CombatHM3;
    CONFIG.TinyMCE.style_formats[0].items.push({
        title: 'Highlight',
        block: 'section',
        classes: 'highlight',
        wrapper: true
    });

    CONFIG.ActiveEffect.documentClass = ActiveEffectHM3;
    CONFIG.AmbientLight.objectClass = AmbientLightHM3;
    CONFIG.AmbientSound.objectClass = AmbientSoundHM3;
    CONFIG.ChatMessage.documentClass = ChatMessageHM3;
    CONFIG.Combatant.documentClass = CombatantHM3;
    CONFIG.Dice.rolls[0] = RollHM3;
    CONFIG.Drawing.objectClass = DrawingHM3;
    CONFIG.Macro.documentClass = MacroHM3;
    CONFIG.Note.objectClass = NoteHM3;
    CONFIG.Region.objectClass = RegionHM3;
    CONFIG.Tile.objectClass = TileHM3;
    CONFIG.Token.documentClass = TokenDocumentHM3;
    CONFIG.Token.objectClass = TokenHM3;
    CONFIG.Wall.objectClass = WallHM3;

    // Register sheet application classes
    Actors.unregisterSheet('core', ActorSheet);
    // Actors.registerSheet('hm3', CharacterSheetHM3, {
    //     types: ['character'],
    //     label: 'HM3 Character Sheet'
    // });
    Actors.registerSheet('hm3', CharacterSheetHM3v2, {
        types: ['character'],
        makeDefault: true,
        label: 'HM3 Character Sheet v2'
    });
    // Actors.registerSheet('hm3', CreatureSheetHM3, {
    //     types: ['creature'],
    //     label: 'HM3 Creature Sheet'
    // });
    Actors.registerSheet('hm3', CreatureSheetHM3v2, {
        types: ['creature'],
        makeDefault: true,
        label: 'HM3 Creature Sheet v2'
    });
    // Actors.registerSheet('hm3', ContainerSheetHM3, {
    //     types: ['container'],
    //     label: 'HM3 Container Sheet'
    // });
    Actors.registerSheet('hm3', ContainerSheetHM3v2, {
        types: ['container'],
        makeDefault: true,
        label: 'HM3 Container Sheet v2'
    });

    DocumentSheetConfig.unregisterSheet(ActiveEffect, 'core', ActiveEffectConfig);
    DocumentSheetConfig.registerSheet(ActiveEffect, 'hm3', ActiveEffectConfigHM3, {
        makeDefault: true,
        label: 'Default HarnMaster Active Effect Sheet'
    });

    DocumentSheetConfig.unregisterSheet(Macro, 'core', MacroConfig);
    DocumentSheetConfig.registerSheet(Macro, 'hm3', MacroConfigHM3, {
        makeDefault: true,
        label: 'Default HarnMaster Macro Sheet'
    });

    Items.unregisterSheet('core', ItemSheet);
    Items.registerSheet('hm3', ItemSheetHM3, {label: 'HM3 Item Sheet'});
    Items.registerSheet('hm3', ItemSheetHM3v2, {label: 'HM3 Item Sheet v2', makeDefault: true});

    // Add a font selector dropdown to the TineMCE editor
    //CONFIG.TinyMCE.toolbar = "styleselect forecolor backcolor bullist numlist image table hr link removeformat code fontselect fontsizeselect save";
    //CONFIG.TinyMCE.toolbar = "styles bullist numlist image table hr link removeformat code fontselect save";
    // Register the Hârnic fonts with Foundry and TinyMCE
    // These are the default fonts for browsers
    let defaultFonts =
        'Andale Mono=andale mono,times; Arial=arial,helvetica,sans-serif; Arial Black=arial black,avant garde; Book Antiqua=book antiqua,palatino; Comic Sans MS=comic sans ms,sans-serif; Courier New=courier new,courier; Georgia=georgia,palatino; Helvetica=helvetica; Impact=impact,chicago; Signika=Signika,sans-serif;Symbol=symbol; Tahoma=tahoma,arial,helvetica,sans-serif; Terminal=terminal,monaco; Times New Roman=times new roman,times; Trebuchet MS=trebuchet ms,geneva; Verdana=verdana,geneva; Webdings=webdings; Wingdings=wingdings,zapf dingbats';
    // These are the fonts we add
    let extraFonts =
        'Martel=Martel;Roboto=Roboto;Lakise=Lakise;Runic=Runic;Lankorian Blackhand=Lankorian Blackhand;Amasis MT Medium=Amasis MT Medium';
    // Configure the TinyMCE font drop-down (note: Monk's Enhanced Journal will overwrite this)
    CONFIG.TinyMCE.font_formats =
        (CONFIG.TinyMCE.font_formats ? CONFIG.TinyMCE.font_formats : defaultFonts) + ';' + extraFonts;
    // Register the extra fonts within Foundry itsel (e.g. Text drawing tool)
    //    let fontFamilies = extraFonts.split(";").map(f => f.split("=")[0]).filter(f => f.length);
    //    fontFamilies.forEach(f => CONFIG.fontFamilies.push(f));
    Object.assign(CONFIG.fontDefinitions, {
        'Lakise': {editor: true, fonts: [{urls: ['./systems/hm3/fonts/Harn-Lakise-Normal.otf']}]},
        'Runic': {editor: true, fonts: [{urls: ['./systems/hm3/fonts/Harn-Runic-Normal.otf']}]},
        'Lankorian Blackhand': {editor: true, fonts: [{urls: ['./systems/hm3/fonts/Lankorian-Blackhand.otf']}]},
        'Amasis MT Medium': {
            editor: true,
            fonts: [
                {urls: ['./systems/hm3/fonts/amasis-mt-medium.ttf', './systems/hm3/fonts/amasis-mt-medium-italic.ttf']}
            ]
        }
    });

    registerDragRulerHook();
    registerHandlebars();
    registerFoundryHooks();
    registerHM3Hooks();
});

Hooks.once('setup', async function () {
    registerFoundryGMHooks();
    registerHM3GMHooks();
});

/**
 * Once the entire VTT framework is initialized, check to see if
 * we should perform a data migration.
 */
Hooks.once('ready', async function () {
    // @ts-expect-error
    hm3['socket'] = socketlib.registerSystem('hm3');

    if (game.settings?.get('hm3', 'debugMode')) {
        CONFIG.debug.hm3 = true;
        // CONFIG.debug.hooks = true;
        hm3.runner = runner;
        hm3.socket.register('defButtonsFromChatMsg', BaseTestHM3.DefButtonsFromChatMsgProxy);
        hm3.socket.register('defAction', BaseTestHM3.DefActionProxy);
        console.clear();
    } else {
        CONFIG.debug.hm3 = false;
        CONFIG.debug.hooks = false;
        console.log = () => {};
        console.debug = () => {};
        console.trace = () => {};
        hm3.runner = () => ui.notifications?.info('Please turn on Debug Mode.');
        console.clear();
    }

    // Determine whether a system migration is required
    const currentMigrationVersion = game.settings?.get('hm3', 'systemMigrationVersion');
    const NEEDS_MIGRATION_VERSION = '12.0.99'; // Anything older than this must be migrated

    if (currentMigrationVersion) {
        let needMigration = foundry.utils.isNewerVersion(NEEDS_MIGRATION_VERSION, currentMigrationVersion);
        if (needMigration && game.user?.isGM) {
            await migrations.migrateWorld();
        }
    } else {
        game.settings?.set('hm3', 'systemMigrationVersion', game.system.version);
    }

    // if not exists, create and set
    if (
        !game.settings?.get('hm3', 'actorMacrosFolderId') ||
        (game.actors?.contents.length > 0 && !game.actors?.contents[0].macrofolder)
    ) {
        const folder = await Folder.create({
            name: 'Actor Macros (DO NOT DELETE)',
            type: 'Macro',
            color: 0x999999
        });
        await game.settings?.set('hm3', 'actorMacrosFolderId', folder?.id);
    }

    await registerHooks();

    if (await Weather.Initialize()) {
        Weather.Render();
        Hooks.on('updateWorldTime', () => {
            Weather.Render();
        });
    }

    const addEvent = (element, eventName, callback) => {
        if (element.addEventListener) {
            element.addEventListener(eventName, callback, false);
        } else if (element.attachEvent) {
            element.attachEvent('on' + eventName, callback);
        } else {
            element['on' + eventName] = callback;
        }
    };

    addEvent(document, 'keypress', function (e) {
        e = e || window.event;
        // use e.keyCode
        // var doubleClickEvent = new MouseEvent('dblclick', {
        //     'view': window,
        //     'bubbles': true
        //     // 'cancelable': true
        // });
        if (e.key === 'Enter' && !e.shiftKey) {
            var doubleClickEvent = document.createEvent('MouseEvents');
            doubleClickEvent.initEvent('dblclick', true, true);
            e.currentTarget.dispatchEvent(doubleClickEvent);
        }
    });

    const socket = hm3.socket;
    socket.register('isFirstTA', isFirstTA);
    socket.register('setTAFlag', setTAFlag);
    socket.register('unsetTAFlag', unsetTAFlag);
    socket.register('weaponBroke', weaponBroke);
    socket.register('improveFlag', improveFlag);
    socket.register('fatigueReceived', fatigueReceived);
    socket.register('GmSays', gmSays);
    socket.register('gmConsole', gmConsole);
    socket.register('callAllUsers', callAllUsers);
    socket.register('cheating', cheating);

    // @ts-expect-error
    Hooks.callAllUsers = (hook, ...args) => {
        hm3.socket.executeForEveryone('callAllUsers', hook, ...args);
    };

    if (game.settings?.get('hm3', 'showWelcomeDialog')) {
        welcomeDialog().then((showAgain) => {
            game.settings?.set('hm3', 'showWelcomeDialog', showAgain);
        });
    }

    if (!game.user?.can('MACRO_SCRIPT')) {
        ui.notifications?.warn(
            'You do not have permission to run JavaScript macros, so all skill and esoterics macros have been disabled.'
        );
    }

    HM3.ready = true;
});

/**
 *
 * @returns {boolean}
 */
function isFirstTA() {
    return !game.combats?.active?.getFlag('hm3', 'TA');
}

/**
 * Set the TA flag for the active combat proxy for socketlib
 * @returns {Promise<*>}
 */
async function setTAFlag() {
    return game.combats?.active?.setFlag('hm3', 'TA', true);
}

/**
 * Unset the TA flag for the active combat proxy for socketlib
 * @returns {Promise<*>}
 */
async function unsetTAFlag() {
    return game.combats?.active?.unsetFlag('hm3', 'TA');
}

/**
 * Mark a weapon as broken proxy for socketlib
 * @param {string} itemUuid - The ID of the weapon
 * @param {number} diff - The difference in weapon quality
 * @returns {Promise<void>}
 */
async function weaponBroke(itemUuid, diff) {
    /** @type {ItemHM3} */
    const item = fromUuidSync(itemUuid);
    if (item) {
        await item.update({
            'system.isEquipped': false,
            'system.notes': ('Weapon is damaged! ' + item.system.notes).trim(),
            'system.wqModifier': (item.system.wqModifier || 0) - diff
        });
        console.info(`HM3 | Weapon '${item.name}' from actor '${item.actor.name}' broke by -${diff}.`);
    }
}

/**
 *
 * @param {string} itemUuid
 * @param {boolean} success
 */
async function improveFlag(itemUuid, success) {
    /** @type {ItemHM3} */
    const item = fromUuidSync(itemUuid);
    if (item) {
        const old = item.system.improveFlag;
        await item.update({'system.improveFlag': item.system.improveFlag + (success ? 1 : 2)});
        console.info(
            `HM3 | Skill '${item.name}' from actor '${item.actor.name}' improvement flag increased by ${
                success ? 1 : 2
            } from ${old} to ${item.system.improveFlag}.`
        );
    }
}

/**
 *
 * @param {string} actorUuid
 * @param {number} fatigue
 */
async function fatigueReceived(actorUuid, fatigue) {
    /** @type {ActorHM3} */
    const actor = fromUuidSync(actorUuid);
    if (actor) {
        await actor.update({
            'system.fatigue': (actor.system.fatigue || 0) + fatigue
        });
        console.info(`HM3 | Actor '${actor.name}' received ${fatigue} Fatigue Level(s).`);
    }
}

/**
 * Send a message to the GM as GM proxy for socketlib
 * @param {Object} options
 * @param {boolean} [options.gmonly]
 * @param {string} [options.sendingUserId='']
 * @param {string} [options.source]
 * @param {string} [options.text]
 * @param {string} [options.tokenId='']
 * @returns
 */
async function gmSays({gmonly, sendingUserId = '', source, text, tokenId = ''}) {
    return hm3.GmSays({
        gmonly,
        sendingUser: game.users?.get(sendingUserId),
        source,
        text,
        token: canvas?.tokens?.get(tokenId)
    });
}

/**
 * Log a message to the console as GM proxy for socketlib
 * @param {string} user - The name of the user
 * @param {string} level - The log level (trace, debug, info, warn, error)
 * @param {string} msg - The message to log
 * @param {Error} error - The error object (if any)
 * @returns {void}
 */
function gmConsole(user, level, msg, error) {
    const message = `\n\nUSER ERROR\nMsg....: ${msg}\nUser...: ${user}\nError..: ${error.message}\n\n%O`;

    switch (level) {
        case 'trace':
            if (game.settings?.get('hm3', 'debugMode')) {
                console.trace(message, error);
            }
            break;
        case 'debug':
            if (game.settings?.get('hm3', 'debugMode')) {
                console.debug(message, error);
            }
            break;
        case 'info':
        case 'log':
            console.info(message, error);
            ui.notifications?.info(`${user} logged a GM message: ${msg}`, {permanent: true});
            break;
        case 'warn':
            console.warn(message, error);
            ui.notifications?.warn(`${user} logged a GM message: ${msg}`, {permanent: true});
            break;
        case 'error':
            console.error(message, error);
            ui.notifications?.error(`${user} logged a GM message: ${msg}`, {permanent: true});
            break;
        default:
            console.warn(`Unknown log level: ${level}.`, error);
            break;
    }
}

/**
 *
 * @param {string} hook
 * @param  {...any} args
 */
function callAllUsers(hook, ...args) {
    Hooks.callAll(hook, ...args);
}

/**
 *
 * @param {string} check
 * @param {string} name
 * @param {string} type
 * @param {string} formula
 * @param {number} minimum
 * @param {number} maximum
 * @param {string} target
 * @returns
 */
async function cheating(check, name, type, formula, minimum, maximum, target) {
    let dlgTemplate = 'systems/hm3/templates/dialog/cheat-dialog.hbs';
    let dialogData = {check, name, type, formula, minimum, maximum, target};

    const html = await renderTemplate(dlgTemplate, dialogData);

    if (check !== 'roll')
        return new Promise((resolve) =>
            new Dialog({
                content: html.trim(),
                title: `${check} Cheat Roll`,
                buttons:
                    check === 'd100'
                        ? {
                              cs: {
                                  label: 'CS',
                                  callback: async (html) => {
                                      resolve({targetSuccess: true, targetCritical: true});
                                  }
                              },
                              ss: {
                                  label: 'SS',
                                  callback: async (html) => {
                                      resolve({targetSuccess: true, targetCritical: false, targetSubstantial: true});
                                  }
                              },
                              ms: {
                                  label: 'MS',
                                  callback: async (html) => {
                                      resolve({targetSuccess: true, targetCritical: false, targetSubstantial: false});
                                  }
                              },
                              mf: {
                                  label: 'MF',
                                  callback: async (html) => {
                                      resolve({targetSuccess: false, targetCritical: false, targetSubstantial: false});
                                  }
                              },
                              sf: {
                                  label: 'SF',
                                  callback: async (html) => {
                                      resolve({targetSuccess: false, targetCritical: false, targetSubstantial: true});
                                  }
                              },
                              cf: {
                                  label: 'CF',
                                  callback: async (html) => {
                                      resolve({targetSuccess: false, targetCritical: true});
                                  }
                              },
                              success: {
                                  label: 'Success',
                                  callback: async (html) => {
                                      resolve({targetSuccess: true});
                                  }
                              },
                              failure: {
                                  label: 'Failure',
                                  callback: async (html) => {
                                      resolve({targetSuccess: false});
                                  }
                              }
                          }
                        : {
                              success: {
                                  label: 'Success',
                                  callback: async (html) => {
                                      resolve({targetSuccess: true});
                                  }
                              },
                              failure: {
                                  label: 'Failure',
                                  callback: async (html) => {
                                      resolve({targetSuccess: false});
                                  }
                              }
                          }
            }).render(true)
        );
    else
        return new Promise((resolve) =>
            new Dialog(
                {
                    content: html.trim(),
                    title: `${check} Cheat Roll`,
                    buttons: {
                        minimum: {
                            label: `Minimum (${minimum})`,
                            callback: async (html) => {
                                resolve({targetValue: minimum});
                            }
                        },
                        average: {
                            label: `Average (${Math.round((minimum + maximum) / 2)})`,
                            callback: async (html) => {
                                resolve({targetValue: Math.round((minimum + maximum) / 2)});
                            }
                        },
                        maximum: {
                            label: `Maximum (${maximum})`,
                            callback: async (html) => {
                                resolve({targetValue: maximum});
                            }
                        },
                        random: {
                            label: `Random`,
                            callback: async (html) => {
                                resolve({targetValue: null});
                            }
                        }
                    }
                },
                {width: 500}
            ).render(true)
        );
}

async function welcomeDialog() {
    const dlgTemplate = 'systems/hm3/templates/dialog/welcome.html';
    const html = await renderTemplate(dlgTemplate, {});

    // Create the dialog window
    return Dialog.prompt({
        title: 'Welcome!',
        content: html,
        label: 'OK',
        callback: (html) => {
            const form = html.querySelector('#welcome');
            const fd = new FormDataExtended(form);
            const data = fd.object;
            return data.showOnStartup;
        },
        options: {jQuery: false}
    });
}
