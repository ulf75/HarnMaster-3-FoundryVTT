// Import Modules
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
import {HarnMasterCombat} from './hm3-combat.js';
import {HM3MacroConfig} from './hm3-macro-config.js';
import {HarnMasterMacro} from './hm3-macro.js';
import {HarnMasterToken, HarnMasterTokenDocument} from './hm3-token.js';
import {ActorType, Aspect, Condition, Hook, ItemType, Location, Range, SkillType} from './hm3-types.js';
import {HarnMasterItemSheet} from './item/item-sheet.js';
import {HarnMasterItem} from './item/item.js';
import {registerHooks} from './macro.js';
import * as macros from './macros.js';
import * as migrations from './migrations.js';
import {registerSystemSettings} from './settings.js';

Hooks.once('init', async function () {
    console.log(`HM3 | Initializing the HM3 Game System\n${HM3.ASCII}`);

    // CONFIG.debug.hooks = true;

    game.hm3 = {
        HarnMasterActor,
        HarnMasterItem,
        DiceHM3,
        config: HM3,
        macros: macros,
        migrations: migrations,
        enums: {ActorType, Aspect, Hook, ItemType, Location, Range, SkillType}
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
        skill: 'Skill',
        spell: 'Spell',
        invocation: 'Invocation',
        psionic: 'Psionic',
        weapongear: 'Melee Weapon',
        containergear: 'Container',
        missilegear: 'Missile Weapon',
        armorgear: 'Armor',
        miscgear: 'Misc. Gear',
        injury: 'Injury',
        armorlocation: 'Armor Location',
        trait: 'Trait'
    };
    CONFIG.Combat.documentClass = HarnMasterCombat;
    CONFIG.TinyMCE.style_formats[0].items.push({
        title: 'Highlight',
        block: 'section',
        classes: 'highlight',
        wrapper: true
    });

    CONFIG.ActiveEffect.documentClass = HarnMasterActiveEffect;
    CONFIG.Macro.documentClass = HarnMasterMacro;
    CONFIG.Token.documentClass = HarnMasterTokenDocument;
    CONFIG.Token.objectClass = HarnMasterToken;

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

    // if blind Roll Mode, remove info from Chat Card
    if (html[0].innerHTML.includes('hm3 chat-card') && app.blind && !game.user.isGM) {
        const nodes = html[0].childNodes[3].childNodes[1];
        nodes.childNodes[3].innerText = 'Blind GM Roll';
        nodes.childNodes[5].remove();
        nodes.childNodes[5].remove();
        nodes.childNodes[5].remove();
        nodes.childNodes[5].remove();
    }
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

/**
 * Once the entire VTT framework is initialized, check to see if
 * we should perform a data migration.
 */
Hooks.once('ready', async function () {
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
         * @param {Token} token - The token to check movement
         * */
        getRanges(token) {
            const actor = token.actor;
            let move = actor.system.move.effective;

            // Conditions
            const grappled = token.hasCondition(Condition.GRAPPLED);
            const prone = token.hasCondition(Condition.PRONE);
            const shocked = token.hasCondition(Condition.SHOCKED);
            const stunned = token.hasCondition(Condition.STUNNED);
            const unconscious = token.hasCondition(Condition.UNCONSCIOUS);

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
