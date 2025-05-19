// Import Modules
import {HarnMasterBaseTest} from '../tests/hm3-basetest.js';
import {RollMock} from '../tests/rollmock.js';
import {runner} from '../tests/runner.js';
import {HarnMasterActor} from './actor/actor.js';
import {HarnMasterCharacterSheet} from './actor/character-sheet.js';
import {HarnMasterContainerSheet} from './actor/container-sheet.js';
import {HarnMasterCreatureSheet} from './actor/creature-sheet.js';
import * as combat from './combat.js';
import {HM3} from './config.js';
import {DiceHM3} from './dice-hm3.js';
import * as effect from './effect.js';
import {HM3ActiveEffectConfig} from './hm3-active-effect-config.js';
import {HarnMasterActiveEffect} from './hm3-active-effect.js';
import {HarnMasterAmbientLight} from './hm3-ambient-light.js';
import {HarnMasterAmbientSound} from './hm3-ambient-sound.js';
import {HarnMasterCombat} from './hm3-combat.js';
import {HarnMasterCombatant} from './hm3-combatant.js';
import {HarnMasterDrawing} from './hm3-drawing.js';
import {HM3MacroConfig} from './hm3-macro-config.js';
import {HarnMasterMacro} from './hm3-macro.js';
import {HarnMasterNote} from './hm3-note.js';
import {HarnMasterRegion} from './hm3-region.js';
import {HarnMasterTile} from './hm3-tile.js';
import {HarnMasterToken, HarnMasterTokenDocument} from './hm3-token.js';
import {ActorType, Aspect, Condition, Hook, InjuryType, ItemType, Location, MiscItemType, Range, SkillType} from './hm3-types.js';
import {HarnMasterWall} from './hm3-wall.js';
import {HarnMasterItemSheet} from './item/item-sheet.js';
import {HarnMasterItem} from './item/item.js';
import {registerHooks} from './macro.js';
import * as macros from './macros.js';
import * as migrations from './migrations.js';
import {Mutex} from './mutex.js';
import {registerSystemSettings} from './settings.js';
import {Weather} from './weather.js';

Hooks.once('init', async function () {
    console.info(`HM3 | Initializing the HM3 Game System\n${HM3.ASCII}`);

    CONFIG.ActiveEffect.legacyTransferral = false;

    game.hm3 = {
        DiceHM3,
        HarnMasterActor,
        HarnMasterItem,
        Roll,

        config: HM3,
        macros,
        migrations,

        ActorType,
        Aspect,
        Condition,
        Hook,
        InjuryType,
        ItemType,
        Location,
        MiscItemType,
        Range,
        SkillType,

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

        combatMutex: new Mutex(),

        Gm2GmSays: async (text, source) => {
            return game.hm3.socket.executeAsGM('GmSays', text, source, true);
        },
        GmSays: async (text, source, gmonly = false) => {
            const gmUsers = game.users.filter((user) => user.isGM).map((user) => user.id);
            const content = !!source
                ? `<div class="chat-card gmsays"><blockquote lang="en"><p>${text}</p><cite>&ndash; ${source}</cite></blockquote></div>`
                : `<div class="chat-card gmsays"><blockquote lang="en"><p>${text}</p></blockquote></div>`;
            const msg = {
                content,
                speaker: ChatMessage.getSpeaker({alias: 'Gamemaster says...'}),
                type: CONST.CHAT_MESSAGE_STYLES.OTHER
            };

            // If the message is GM only, send it to the GM users
            if (gmonly && game.user.isGM) {
                msg['whisper'] = gmUsers;
                console.info(`HM3 | GM only: ${text.replaceAll('<b>', '').replaceAll('</b>', '')}`);
                return ChatMessage.create(msg);
            }

            // If the message is not GM only, send it to all users
            else if (!gmonly) {
                console.info(`HM3 | ${text.replaceAll('<b>', '').replaceAll('</b>', '')}`);
                return ChatMessage.create(msg);
            }
        }
    };

    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    CONFIG.Combat.initiative = {
        formula: '@initiative',
        decimals: 1
    };

    // Set Combat Time Length
    CONFIG.time.roundTime = 10;
    CONFIG.time.turnTime = 0;

    // Set System Globals
    CONFIG.HM3 = HM3;

    // Register system settings
    registerSystemSettings();

    // Define custom ActiveEffect class
    //CONFIG.ActiveEffect.sheetClass = HM3ActiveEffectConfig;

    // Define custom Document classes
    CONFIG.Actor.documentClass = HarnMasterActor;
    CONFIG.Actor.typeLabels = {
        base: 'Base',
        character: 'Character',
        creature: 'Creature',
        container: 'Container'
    };
    CONFIG.Item.documentClass = HarnMasterItem;
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
    CONFIG.Combat.documentClass = HarnMasterCombat;
    CONFIG.TinyMCE.style_formats[0].items.push({
        title: 'Highlight',
        block: 'section',
        classes: 'highlight',
        wrapper: true
    });

    CONFIG.ActiveEffect.documentClass = HarnMasterActiveEffect;
    CONFIG.AmbientLight.objectClass = HarnMasterAmbientLight;
    CONFIG.AmbientSound.objectClass = HarnMasterAmbientSound;
    CONFIG.Combatant.documentClass = HarnMasterCombatant;
    CONFIG.Drawing.objectClass = HarnMasterDrawing;
    CONFIG.Macro.documentClass = HarnMasterMacro;
    CONFIG.Note.objectClass = HarnMasterNote;
    CONFIG.Region.objectClass = HarnMasterRegion;
    CONFIG.Tile.objectClass = HarnMasterTile;
    CONFIG.Token.documentClass = HarnMasterTokenDocument;
    CONFIG.Token.objectClass = HarnMasterToken;
    CONFIG.Wall.objectClass = HarnMasterWall;

    // Register sheet application classes
    Actors.unregisterSheet('core', ActorSheet);
    Actors.registerSheet('hm3', HarnMasterCharacterSheet, {
        types: ['character'],
        makeDefault: true,
        label: 'Default HarnMaster Character Sheet'
    });
    Actors.registerSheet('hm3', HarnMasterCreatureSheet, {
        types: ['creature'],
        makeDefault: true,
        label: 'Default HarnMaster Creature Sheet'
    });
    Actors.registerSheet('hm3', HarnMasterContainerSheet, {
        types: ['container'],
        makeDefault: true,
        label: 'Default HarnMaster Container Sheet'
    });

    DocumentSheetConfig.unregisterSheet(ActiveEffect, 'core', ActiveEffectConfig);
    DocumentSheetConfig.registerSheet(ActiveEffect, 'hm3', HM3ActiveEffectConfig, {
        makeDefault: true,
        label: 'Default HarnMaster Active Effect Sheet'
    });

    DocumentSheetConfig.unregisterSheet(Macro, 'core', MacroConfig);
    DocumentSheetConfig.registerSheet(Macro, 'hm3', HM3MacroConfig, {
        makeDefault: true,
        label: 'Default HarnMaster Macro Sheet'
    });

    Items.unregisterSheet('core', ItemSheet);
    Items.registerSheet('hm3', HarnMasterItemSheet, {makeDefault: true});

    // If you need to add Handlebars helpers, here are a few useful examples:
    Handlebars.registerHelper('concat', function () {
        var outStr = '';
        for (var arg in arguments) {
            if (typeof arguments[arg] != 'object') {
                outStr += arguments[arg];
            }
        }
        return outStr;
    });

    Handlebars.registerHelper('toLowerCase', function (str) {
        return str.toLowerCase();
    });

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
    CONFIG.TinyMCE.font_formats = (CONFIG.TinyMCE.font_formats ? CONFIG.TinyMCE.font_formats : defaultFonts) + ';' + extraFonts;
    // Register the extra fonts within Foundry itsel (e.g. Text drawing tool)
    //    let fontFamilies = extraFonts.split(";").map(f => f.split("=")[0]).filter(f => f.length);
    //    fontFamilies.forEach(f => CONFIG.fontFamilies.push(f));
    Object.assign(CONFIG.fontDefinitions, {
        'Lakise': {editor: true, fonts: [{urls: ['./systems/hm3/fonts/Harn-Lakise-Normal.otf']}]},
        'Runic': {editor: true, fonts: [{urls: ['./systems/hm3/fonts/Harn-Runic-Normal.otf']}]},
        'Lankorian Blackhand': {editor: true, fonts: [{urls: ['./systems/hm3/fonts/Lankorian-Blackhand.otf']}]},
        'Amasis MT Medium': {
            editor: true,
            fonts: [{urls: ['./systems/hm3/fonts/amasis-mt-medium.ttf', './systems/hm3/fonts/amasis-mt-medium-italic.ttf']}]
        }
    });

    // Actors also have a Bio image
    Hooks.on('getActorDirectoryEntryContext', (html, menuItems) => {
        menuItems.unshift({
            name: 'View Bio Artwork',
            icon: `<i class="fas fa-image"></i>`,
            callback: async (html) => {
                const actor = game.actors.get(html.data('documentId'));
                new ImagePopout(actor.system.bioImage, {
                    title: actor.name,
                    uuid: actor.uuid
                }).render(true);
            },
            condition: (html) => {
                const actor = game.actors.get(html.data('documentId'));
                return game.user.isGM && actor?.system?.bioImage;
            }
        });
    });
});

Hooks.on('renderChatMessage', (app, html, data) => {
    // Display action buttons
    combat.displayChatActionButtons(app, html, data);
});

Hooks.on('renderChatLog', (app, html, data) => HarnMasterActor.chatListeners(html));

Hooks.on('renderChatPopout', (app, html, data) => HarnMasterActor.chatListeners(html));

/**
 * Active Effects need to expire at certain times, so keep track of that here
 */
Hooks.on('updateWorldTime', async (currentTime, change) => {
    // Disable any expired active effects (WorldTime-based durations).
    await effect.checkExpiredActiveEffects();
});

Hooks.on('updateCombat', async (combat, updateData) => {
    // Called when the combat object is updated.  Possibly because of a change in round
    // or turn. updateData will have specifics of what changed.
    await effect.checkExpiredActiveEffects();
});

Hooks.on('updateCombatant', async (combatant, info, updateData, userId) => {
    return game.hm3.socket.executeAsGM('updateOutnumbered');
});

Hooks.on('createActiveEffect', async (activeEffect, info, userId) => {
    return game.hm3.socket.executeAsGM('updateOutnumbered', activeEffect.name);
});

Hooks.on('updateActiveEffect', async (activeEffect, info, userId) => {
    return game.hm3.socket.executeAsGM('updateOutnumbered', activeEffect.name);
});

Hooks.on('deleteActiveEffect', async (activeEffect, info, userId) => {
    return game.hm3.socket.executeAsGM('updateOutnumbered', activeEffect.name);
});

Hooks.on('createItem', async (item, info, userId) => {
    if (item.type === ItemType.EFFECT) {
        if (item.system.selfDestroy && item.parent instanceof Actor) {
            item.effects.forEach((effect) => {
                if (!effect.getFlag('effectmacro', 'onDisable.script'))
                    effect.setFlag('effectmacro', 'onDisable.script', `(await fromUuid('${item.uuid}'))?.delete();`);
            });
        }
    }
});

Hooks.on('dropCanvasData', async (canvas, data) => {
    if (data.type === 'Item') {
        const targetToken = canvas.tokens.placeables.find((t) => t.bounds.contains(data.x, data.y));
        if (!targetToken) return;

        const actor = targetToken.actor;
        if (!actor) return;

        const item = await Item.fromDropData(data);
        if (!item) return;

        await actor.createEmbeddedDocuments('Item', [item.toObject()]);

        ui.notifications.info(`"${item.name}" was added to ${targetToken.name}.`);
    }
});

/**
 * Once the entire VTT framework is initialized, check to see if
 * we should perform a data migration.
 */
Hooks.once('ready', async function () {
    if (game.settings.get('hm3', 'debugMode')) {
        CONFIG.debug.hm3 = true;
        // CONFIG.debug.hooks = true;
        game.hm3.Roll = RollMock;
        game.hm3.BaseTest = HarnMasterBaseTest;
        game.hm3.runner = runner;
    } else {
        CONFIG.debug.hm3 = false;
        CONFIG.debug.hooks = false;
        console.log = () => {};
        console.debug = () => {};
        console.trace = () => {};
    }

    // Determine whether a system migration is required
    const currentMigrationVersion = game.settings.get('hm3', 'systemMigrationVersion');
    const NEEDS_MIGRATION_VERSION = '1.2.19'; // Anything older than this must be migrated

    if (currentMigrationVersion) {
        let needMigration = foundry.utils.isNewerVersion(NEEDS_MIGRATION_VERSION, currentMigrationVersion);
        if (needMigration && game.user.isGM) {
            await migrations.migrateWorld();
        }
    } else {
        game.settings.set('hm3', 'systemMigrationVersion', game.system.version);
    }

    Hooks.on('hotbarDrop', (bar, data, slot) => macros.createHM3Macro(data, slot));

    // if not exists, create and set
    if (!game.settings.get('hm3', 'actorMacrosFolderId') || (game.actors.contents.length > 0 && !game.actors.contents[0].macrofolder)) {
        const folder = await Folder.create({
            name: 'Actor Macros (DO NOT DELETE)',
            type: 'Macro',
            color: 0x999999
        });
        await game.settings.set('hm3', 'actorMacrosFolderId', folder.id);
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

    HM3.ready = true;

    if (game.settings.get('hm3', 'showWelcomeDialog')) {
        welcomeDialog().then((showAgain) => {
            game.settings.set('hm3', 'showWelcomeDialog', showAgain);
        });
    }

    if (!game.user.can('MACRO_SCRIPT')) {
        ui.notifications.warn('You do not have permission to run JavaScript macros, so all skill and esoterics macros have been disabled.');
    }
});

Hooks.on('renderPause', (_app, html) => html.find('img').attr('src', 'systems/hm3/images/png/HMLogo.png'));

// Since HM3 does not have the concept of rolling for initiative,
// this hook simply prepopulates the initiative value. This ensures
// that no die roll is needed.
Hooks.on('preCreateCombatant', (combat, combatant, options, id) => {
    if (!combatant.initiative) {
        let token = canvas.tokens.get(combatant.tokenId);
        combatant.initiative = token.actor.system.initiative;
    }
});

Hooks.on('renderSceneConfig', (app, html, data) => {
    const scene = app.object;
    if (app.renderTOTMScene) return;
    app.renderTOTMScene = true;

    let isTotm = scene.getFlag('hm3', 'isTotm');
    if (typeof isTotm === 'undefined') {
        if (!scene.compendium) {
            scene.setFlag('hm3', 'isTotm', false);
        }
        isTotm = false;
    }

    const totmHtml = `
    <div class="form-group">
        <label>Theatre of the Mind</label>
        <input id="hm3-totm" type="checkbox" name="hm3Totm" data-dtype="Boolean" ${isTotm ? 'checked' : ''}>
        <p class="notes">Configure scene for Theatre of the Mind (e.g., no range calcs).</p>
    </div>
    `;

    const totmFind = html.find("input[name = 'gridAlpha']");
    const formGroup = totmFind.closest('.form-group');
    formGroup.after(totmHtml);
});

Hooks.on('closeSceneConfig', (app, html, data) => {
    const scene = app.object;
    app.renderTOTMScene = false;
    if (!scene.compendium) {
        scene.setFlag('hm3', 'isTotm', html.find("input[name='hm3Totm']").is(':checked'));
    }
});

Hooks.once('dragRuler.ready', (SpeedProvider) => {
    class HarnMaster3SpeedProvider extends SpeedProvider {
        get colors() {
            return [
                {
                    id: 'walk',
                    default: 0x6aa84f,
                    name: 'hm3.speed-provider.walk'
                },
                {
                    id: 'jog',
                    default: 0x1e88e5,
                    name: 'hm3.speed-provider.jog'
                },
                {
                    id: 'run',
                    default: 0xffc107,
                    name: 'hm3.speed-provider.run'
                },
                {
                    id: 'sprint',
                    default: 0xd81b60,
                    name: 'hm3.speed-provider.sprint'
                }
            ];
        }

        get defaultUnreachableColor() {
            return 0x000000;
        }

        /**
         * @param {HarnMasterToken} token - The token to check movement
         * */
        getRanges(token) {
            const actor = token.actor;
            let move = actor.system.move.effective;

            // Conditions
            const grappled = token.hasCondition(game.hm3.Condition.GRAPPLED);
            const prone = token.hasCondition(game.hm3.Condition.PRONE);
            const shocked = token.hasCondition(game.hm3.Condition.SHOCKED);
            const stunned = token.hasCondition(game.hm3.Condition.STUNNED);
            const unconscious = token.hasCondition(game.hm3.Condition.UNCONSCIOUS);

            if (grappled || stunned || unconscious) {
                return [{range: -1, color: 'walk'}];
            }

            if (prone || shocked) {
                return [{range: Math.round(move / 2 + Number.EPSILON) * 5, color: 'walk'}];
            }

            return [
                {range: Math.round(move / 2 + Number.EPSILON) * 5, color: 'walk'},
                {range: move * 5, color: 'jog'},
                {range: 2 * move * 5, color: 'run'},
                {range: 3 * move * 5, color: 'sprint'}
            ];
        }
    }

    dragRuler.registerSystem('hm3', HarnMaster3SpeedProvider);
});

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

/*-------------------------------------------------------*/
/*            Handlebars FUNCTIONS                       */
/*-------------------------------------------------------*/
Handlebars.registerHelper('multiply', function (op1, op2) {
    return op1 * op2;
});

Handlebars.registerHelper('endswith', function (op1, op2) {
    return op1.endsWith(op2);
});

let socket;

Hooks.once('ready', () => {
    socket = socketlib.registerSystem('hm3');
    socket.register('isFirstTA', isFirstTA);
    socket.register('setTAFlag', setTAFlag);
    socket.register('unsetTAFlag', unsetTAFlag);
    socket.register('weaponBroke', weaponBroke);
    socket.register('GmSays', gmSays);
    socket.register('updateOutnumbered', updateOutnumbered);

    game.hm3['socket'] = socket;
});

function isFirstTA() {
    return !game.combats?.active?.getFlag('hm3', 'TA');
}

/**
 * Set the TA flag for the active combat proxy for socketlib
 * @returns {Promise<void>}
 */
async function setTAFlag() {
    return game.combats?.active?.setFlag('hm3', 'TA', true);
}

/**
 * Unset the TA flag for the active combat proxy for socketlib
 * @returns {Promise<void>}
 */
async function unsetTAFlag() {
    return game.combats?.active?.unsetFlag('hm3', 'TA');
}

/**
 * Mark a weapon as broken proxy for socketlib
 * @param {string} tokenId - The ID of the token
 * @param {string} weaponId - The ID of the weapon
 * @param {number} atkWeaponDiff - The difference in weapon quality
 * @returns {Promise<void>}
 */
async function weaponBroke(tokenId, weaponId, atkWeaponDiff) {
    const t = canvas.tokens.get(tokenId);
    const item = t.actor.items.get(weaponId);
    return item.update({
        'system.isEquipped': false,
        'system.notes': ('Weapon is damaged! ' + item.system.notes).trim(),
        'system.wqModifier': (item.system.wqModifier | 0) - atkWeaponDiff
    });
}

/**
 * Send a message to the GM as GM proxy for socketlib
 * @param {string} content - The message content
 * @param {string} source - The source of the message
 * @param {boolean} gmonly - If true, send the message only to the GM
 * @returns {Promise<ChatMessage>} - The created chat message
 */
async function gmSays(content, source, gmonly) {
    return game.hm3.GmSays(content, source, gmonly);
}

let outMutex = new Mutex();
/**
 * Update outnumbered status for combatants
 * @param {string} aeName - The name of the active effect
 * @returns {Promise<void>}
 */
async function updateOutnumbered(aeName = 'true') {
    if (!game.combat?.started) return;
    if (
        aeName === 'true' ||
        [
            game.hm3.Condition.CAUTIOUS,
            game.hm3.Condition.DISTRACTED,
            game.hm3.Condition.DYING,
            game.hm3.Condition.GRAPPLED,
            game.hm3.Condition.INCAPACITATED,
            game.hm3.Condition.PRONE,
            game.hm3.Condition.SHOCKED,
            game.hm3.Condition.UNCONSCIOUS
        ].includes(aeName)
    ) {
        console.debug(`HM3 | Run updateOutnumbered(aeName = ${aeName})`);
        await outMutex.runExclusive(async () => await combat.updateOutnumbered());
    }
}
