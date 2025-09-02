// Import Modules
import {BaseTestHM3} from '../tests/hm3-basetest.js';
import {runner} from '../tests/runner.js';
import {ActorHM3} from './actor/actor.js';
import {CharacterSheetHM3v2} from './actor/character-sheet-v2.js';
import {CharacterSheetHM3} from './actor/character-sheet.js';
import {ContainerSheetHM3v2} from './actor/container-sheet-v2.js';
import {ContainerSheetHM3} from './actor/container-sheet.js';
import {CreatureSheetHM3v2} from './actor/creature-sheet-v2.js';
import {CreatureSheetHM3} from './actor/creature-sheet.js';
import * as combat from './combat.js';
import {HM3} from './config.js';
import * as effect from './effect.js';
import {ActiveEffectHM3} from './hm3-active-effect.js';
import {ChatMessageHM3} from './hm3-chatmessage.js';
import {CombatHM3} from './hm3-combat.js';
import {CombatantHM3} from './hm3-combatant.js';
import {DiceHM3} from './hm3-dice.js';
import {MacroHM3} from './hm3-macro.js';
import {RollHM3} from './hm3-roll.js';
import {TokenDocumentHM3, TokenHM3} from './hm3-token.js';
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
} from './hm3-types.js';
import {ActiveEffectConfigHM3} from './hm3/hm3-active-effect-config.js';
import {AmbientLightHM3} from './hm3/hm3-ambient-light.js';
import {AmbientSoundHM3} from './hm3/hm3-ambient-sound.js';
import {DrawingHM3} from './hm3/hm3-drawing.js';
import {MacroConfigHM3} from './hm3/hm3-macro-config.js';
import {NoteHM3} from './hm3/hm3-note.js';
import {RegionHM3} from './hm3/hm3-region.js';
import {TileHM3} from './hm3/hm3-tile.js';
import {WallHM3} from './hm3/hm3-wall.js';
import {ItemSheetHM3v2} from './item/item-sheet-v2.js';
import {ItemSheetHM3} from './item/item-sheet.js';
import {ItemHM3} from './item/item.js';
import {WeaponItem} from './item/weapon-item.js';
import {registerHooks} from './macro.js';
import * as macros from './macros.js';
import * as migrations from './migrations.js';
import {Mutex} from './mutex.js';
import {registerSystemSettings} from './settings.js';
import {SlideToggleElement} from './toggle.js';
import * as utility from './utility.js';
import {Weather} from './weather.js';

Hooks.once('init', async function () {
    console.info(`HM3 | Initializing the HM3 Game System\n${HM3.ASCII}`);

    CONFIG.ActiveEffect.legacyTransferral = false;

    globalThis.WeaponItem = WeaponItem;

    window.customElements.define('slide-toggle', SlideToggleElement);

    game.hm3 = {
        DiceHM3,
        ActorHM3,
        ItemHM3,

        config: HM3,
        macros,
        migrations,

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

        gmconsole: async (level, msg, error) => {
            return game.hm3.socket.executeAsGM('gmConsole', game.user.name, level, msg, error);
        },
        Gm2GmSays: async (text, source, token = null) => {
            return game.hm3.socket.executeAsGM('GmSays', {
                gmonly: true,
                sendingUserId: game.user.id,
                source,
                text,
                tokenId: token ? token.id : null
            });
        },
        GmSays: async ({gmonly = false, sendingUser = null, source = null, text = null, token = null}) => {
            console.assert(text, 'Parameter text not set');
            console.assert(game.user.isGM ? true : token, 'Parameter token not set');
            if (!text) return;

            const gmUsers = game.users.filter((user) => user.isGM).map((user) => user.id);
            const content = !!source
                ? `<div class="chat-card gmsays"><blockquote lang="en"><p>${text}</p><cite>&ndash; ${source}</cite></blockquote></div>`
                : `<div class="chat-card gmsays"><blockquote lang="en"><p>${text}</p></blockquote></div>`;
            const speaker = game.user.isGM
                ? ChatMessageHM3.getSpeaker({alias: 'Simon says...', user: game.user})
                : ChatMessageHM3.getSpeaker({token});
            const msg = {
                content,
                speaker,
                type: CONST.CHAT_MESSAGE_STYLES.OTHER
            };

            // If the message is GM only, send it to the GM users
            if (gmonly && game.user.isGM) {
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
    Actors.registerSheet('hm3', CharacterSheetHM3, {
        types: ['character'],
        label: 'HM3 Character Sheet'
    });
    Actors.registerSheet('hm3', CharacterSheetHM3v2, {
        types: ['character'],
        makeDefault: true,
        label: 'HM3 Character Sheet v2'
    });
    Actors.registerSheet('hm3', CreatureSheetHM3, {
        types: ['creature'],
        label: 'HM3 Creature Sheet'
    });
    Actors.registerSheet('hm3', CreatureSheetHM3v2, {
        types: ['creature'],
        makeDefault: true,
        label: 'HM3 Creature Sheet v2'
    });
    Actors.registerSheet('hm3', ContainerSheetHM3, {
        types: ['container'],
        label: 'HM3 Container Sheet'
    });
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

    Handlebars.registerHelper('not', function (obj) {
        return !obj;
    });

    Handlebars.registerHelper('getLabel', function (data, key) {
        var val = data.find((d) => d.key === key);
        return val.label;
    });

    const root = 'systems/hm3/templates/';
    Handlebars.registerPartial({
        //character
        char_esoteric_list_partial: await (await fetch(`${root}actor/partials/esoteric_list_partial.hbs`)).text(),
        char_fff_list_partial: await (await fetch(`${root}actor/partials/fff_list_partial.hbs`)).text(),
        char_layout_partial: await (await fetch(`${root}actor/partials/structure_partial.hbs`)).text(),
        char_skill_list_partial: await (await fetch(`${root}actor/partials/skill_list_partial.hbs`)).text(),
        // item
        item_artifact_partial: await (await fetch(`${root}item/partials/artifact_partial.hbs`)).text(),
        item_artifact_power_partial: await (await fetch(`${root}item/partials/artifact_power_partial.hbs`)).text(),
        item_esoteric_combat_partial: await (await fetch(`${root}item/partials/esoteric_combat_partial.hbs`)).text(),
        item_layout_partial: await (await fetch(`${root}item/partials/structure_partial.hbs`)).text(),
        item_quantity_partial: await (await fetch(`${root}item/partials/quantity_partial.hbs`)).text(),
        item_standard_partial: await (await fetch(`${root}item/partials/standard_partial.hbs`)).text(),
        item_unknown_value_partial: await (await fetch(`${root}item/partials/unknown_value_partial.hbs`)).text(),
        item_value_partial: await (await fetch(`${root}item/partials/value_partial.hbs`)).text(),
        item_weight_partial: await (await fetch(`${root}item/partials/weight_partial.hbs`)).text(),
        // global
        effects_partial: await (await fetch(`${root}partials/effects_partial.hbs`)).text(),
        legacy_macro_partial: await (await fetch(`${root}partials/legacy_macro_partial.hbs`)).text(),
        macros_partial: await (await fetch(`${root}partials/macros_partial.hbs`)).text()
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

Hooks.on('renderChatLog', (app, html, data) => ActorHM3.chatListeners(html));

Hooks.on('renderChatPopout', (app, html, data) => ActorHM3.chatListeners(html));

/**
 * Active Effects need to expire at certain times, so keep track of that here
 */
Hooks.on('updateWorldTime', async (currentTime, change) => {
    await effect.checkStartedActiveEffects();
    // Disable any expired active effects (WorldTime-based durations).
    await effect.checkExpiredActiveEffects();
});

Hooks.on('updateCombat', async (combat, updateData) => {
    await effect.checkStartedActiveEffects();
    // Called when the combat object is updated.  Possibly because of a change in round
    // or turn. updateData will have specifics of what changed.
    await effect.checkExpiredActiveEffects();
});

Hooks.on('hm3.onShockIndexReduced', async (actor, old, current) => {
    if (game.combat?.started && actor.parent instanceof TokenDocumentHM3 && !actor.parent.player) {
        if (actor.parent.hasCondition(game.hm3.Condition.UNCONSCIOUS) && actor.testUserPermission(game.user, 'OWNER')) {
            await actor.parent.deleteCondition(game.hm3.Condition.UNCONSCIOUS);
            await actor.parent.addCondition(game.hm3.Condition.UNCONSCIOUS);
            Hooks.call('hm3.onShockIndexReduced2', actor, old, current);
        }
    }
});

Hooks.on('hm3.onTotalInjuryLevelsChanged', async (actor, oldValue, newValue) => {
    const inanimate = actor.hasCondition(Condition.INANIMATE);
    if (inanimate) {
        actor.system.injuryLevels.max = actor.system.endurance;
    }

    actor.system.injuryLevels.value = newValue;
    if (actor.testUserPermission(game.user, 'OWNER')) {
        await actor.update({'system.injuryLevels': actor.system.injuryLevels});
        if (inanimate && newValue >= actor.system.injuryLevels.max) {
            await actor.token.addCondition(Condition.DYING);
        }
    }
});

Hooks.on('updateCombat', async (combat, updateData) => {
    return updateOutnumbered({hook: 'updateCombat'});
});

Hooks.on('updateCombatant', async (combatant, info, updateData, userId) => {
    return updateOutnumbered({hook: 'updateCombatant'});
});

Hooks.on('createActiveEffect', async (activeEffect, info, userId) => {
    return updateOutnumbered({aeName: activeEffect.name, hook: 'createActiveEffect'});
});

// Hooks.on('updateActiveEffect', async (activeEffect, info, userId) => {
//     return updateOutnumbered({aeName: activeEffect.name, hook: 'updateActiveEffect'});
// });

Hooks.on('deleteActiveEffect', async (activeEffect, info, userId) => {
    return updateOutnumbered({aeName: activeEffect.name, hook: 'deleteActiveEffect'});
});

Hooks.on('createItem', async (item, info, userId) => {
    if (item.type === ItemType.EFFECT) {
        if (item.system.selfDestroy && item.parent instanceof Actor) {
            item.effects.forEach((effect) => {
                if (!effect.getFlag('effectmacro', 'onDisable.script'))
                    effect.setFlag(
                        'effectmacro',
                        'onDisable.script',
                        utility.beautify(`
                  const item = fromUuidSync('${item.uuid}');
                  if (item) {
                    if (item.effects.contents.filter((e)=>e.disabled).length === item.effects.size) {
                      item.delete();
                    }
                  }`)
                    );
            });
        }
    }
});

Hooks.on('preUpdateMacro', async (macro, updateData, options, userId) => {
    if (updateData.command) updateData.command = utility.beautify(updateData.command);
});

Hooks.on('hm3.onMount', async (actor, steed) => {
    if (!actor.testUserPermission(game.user, 'OWNER') || !steed.testUserPermission(game.user, 'OWNER')) return;

    await actor.update({'system.mounted': true});
    actor.prepareData();
    const riding = actor.items.find((item) => item.type === game.hm3.ItemType.SKILL && item.name.includes('Riding'));
    riding.sheet.render();

    const rider = steed.items.find((item) => item.type === game.hm3.ItemType.MISCGEAR && item.name.includes('Rider'));
    await rider?.delete();
    await Item.create(
        {
            img: actor.img,
            name: 'Rider/' + actor.name,
            system: {actorUuid: actor.uuid, type: 'Rider', weight: actor.system.weight + actor.system.totalWeight},
            type: ItemType.MISCGEAR
        },
        {parent: steed}
    );
});

Hooks.on('hm3.onUnmount', async (actor, steed) => {
    if (!actor.testUserPermission(game.user, 'OWNER') || !steed.testUserPermission(game.user, 'OWNER')) return;

    await actor.update({'system.mounted': false});
    actor.prepareData();
    const riding = actor.items.find((item) => item.type === game.hm3.ItemType.SKILL && item.name.includes('Riding'));
    riding.sheet.render();

    const rider = steed.items.find((item) => item.type === game.hm3.ItemType.MISCGEAR && item.name.includes('Rider'));
    await rider?.delete();
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
    game.hm3['socket'] = socketlib.registerSystem('hm3');

    if (game.settings.get('hm3', 'debugMode')) {
        CONFIG.debug.hm3 = true;
        // CONFIG.debug.hooks = true;
        game.hm3.BaseTest = BaseTestHM3;
        game.hm3.runner = runner;
        game.hm3.socket.register('defButtonsFromChatMsg', game.hm3.BaseTest.DefButtonsFromChatMsgProxy);
        game.hm3.socket.register('defAction', game.hm3.BaseTest.DefActionProxy);
        console.clear();
    } else {
        CONFIG.debug.hm3 = false;
        CONFIG.debug.hooks = false;
        console.log = () => {};
        console.debug = () => {};
        console.trace = () => {};
        game.hm3.runner = () => ui.notifications.info('Please turn on Debug Mode.');
        console.clear();
    }

    // Determine whether a system migration is required
    const currentMigrationVersion = game.settings.get('hm3', 'systemMigrationVersion');
    const NEEDS_MIGRATION_VERSION = '12.0.99'; // Anything older than this must be migrated

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
    if (
        !game.settings.get('hm3', 'actorMacrosFolderId') ||
        (game.actors.contents.length > 0 && !game.actors.contents[0].macrofolder)
    ) {
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
        ui.notifications.warn(
            'You do not have permission to run JavaScript macros, so all skill and esoterics macros have been disabled.'
        );
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

// If the combatant is not already in combat, roll initiative
Hooks.on('createCombatant', (combatant, options, id) => {
    if (combatant.testUserPermission(game.user, 'OWNER')) combatant.rollInitiative();
});

Hooks.once('dragRuler.ready', (SpeedProvider) => {
    class HarnMaster3SpeedProvider extends SpeedProvider {
        get colors() {
            return [
                {
                    id: 'creep',
                    default: 0x000098, // dark blue
                    name: 'hm3.speed-provider.creep'
                },
                {
                    id: 'walk',
                    default: 0x1e88e5, // blue
                    name: 'hm3.speed-provider.walk'
                },
                {
                    id: 'jog',
                    default: 0x6aa84f, // green
                    name: 'hm3.speed-provider.jog'
                },
                {
                    id: 'run',
                    default: 0xffc107, // yellow
                    name: 'hm3.speed-provider.run'
                },
                {
                    id: 'sprint',
                    default: 0xf24d11, // orange
                    // default: 0xd81b60, // red
                    name: 'hm3.speed-provider.sprint'
                }
            ];
        }

        get defaultUnreachableColor() {
            return 0x000000;
        }

        /**
         * @param {TokenHM3} token - The token to check movement
         * */
        getRanges(token) {
            const move = Math.max(token.actor.system.move.effective, 1);
            const creep = {range: 5 * Math.max(Math.round(move / 3 + Number.EPSILON), 1), color: 'creep'};
            const walk = {range: 5 * Math.max(Math.round(move / 2 + Number.EPSILON), 2), color: 'walk'};
            const jog = {range: 5 * Math.max(Math.round(move + Number.EPSILON), 4), color: 'jog'};
            const run = {range: 5 * Math.max(Math.round(2 * move + Number.EPSILON), 8), color: 'run'};
            const sprint = {range: 5 * Math.max(Math.round(3 * move + Number.EPSILON), 12), color: 'sprint'};

            // Conditions
            const grappled = token.hasCondition(game.hm3.Condition.GRAPPLED);
            const inanimate = token.hasCondition(game.hm3.Condition.INANIMATE);
            const prone = token.hasCondition(game.hm3.Condition.PRONE);
            const shocked = token.hasCondition(game.hm3.Condition.SHOCKED);
            const stunned = token.hasCondition(game.hm3.Condition.STUNNED);
            const unconscious = token.hasCondition(game.hm3.Condition.UNCONSCIOUS);

            if (inanimate) {
                return [creep, walk, jog, run, sprint];
            }

            // No movement at all
            if (grappled || stunned || unconscious) {
                return [{range: -1, color: 'creep'}];
            }

            if (prone || shocked || token.actor.system.shockIndex.value < 20) {
                return [creep, walk];
            }

            if (token.hasGreviousLegInjuries()) {
                return [creep, walk, jog, run];
            }

            return [creep, walk, jog, run, sprint];
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

Hooks.once('ready', () => {
    Hooks.callAllUsers = (hook, ...args) => {
        game.hm3.socket.executeForEveryone('callAllUsers', hook, ...args);
    };

    const socket = game.hm3.socket;
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
 * @param {string} itemUuid - The ID of the weapon
 * @param {number} diff - The difference in weapon quality
 * @returns {Promise<void>}
 */
async function weaponBroke(itemUuid, diff) {
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

async function improveFlag(itemUuid, success) {
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

async function fatigueReceived(actorUuid, fatigue) {
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
 * @param {string} content - The message content
 * @param {string} source - The source of the message
 * @param {boolean} gmonly - If true, send the message only to the GM
 * @returns {Promise<ChatMessage>} - The created chat message
 */
async function gmSays({gmonly, sendingUserId, source, text, tokenId}) {
    return game.hm3.GmSays({
        gmonly,
        sendingUser: game.users.get(sendingUserId),
        source,
        text,
        token: canvas.tokens.get(tokenId)
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
            if (game.settings.get('hm3', 'debugMode')) {
                console.trace(message, error);
            }
            break;
        case 'debug':
            if (game.settings.get('hm3', 'debugMode')) {
                console.debug(message, error);
            }
            break;
        case 'info':
        case 'log':
            console.info(message, error);
            ui.notifications.info(`${user} logged a GM message: ${msg}`, {permanent: true});
            break;
        case 'warn':
            console.warn(message, error);
            ui.notifications.warn(`${user} logged a GM message: ${msg}`, {permanent: true});
            break;
        case 'error':
            console.error(message, error);
            ui.notifications.error(`${user} logged a GM message: ${msg}`, {permanent: true});
            break;
        default:
            console.warn(`Unknown log level: ${level}.`, error);
            break;
    }
}

function callAllUsers(hook, ...args) {
    Hooks.callAll(hook, ...args);
}

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

let outMutex = new Mutex();
/**
 * Update outnumbered status for combatants
 * @param {string} aeName - The name of the active effect
 * @returns {Promise<void>}
 */
async function updateOutnumbered({aeName = 'true', hook = 'nohook'} = {}) {
    if (game.combat?.started && game.user.isGM) {
        if (aeName === 'true' || combat.outnumberedConditions().includes(aeName)) {
            return outMutex.runExclusive(async () => {
                console.info(`HM3 | Run updateOutnumbered (aeName = ${aeName}, hook = ${hook})`);
                const {changed, tokens} = await combat.updateOutnumbered();
                if (changed) Hooks.call('hm3.onOutnumberedChanged', tokens, aeName, hook);
                Hooks.call('hm3.onOutnumbered', aeName, hook);
                return true;
            });
        }
        Hooks.call('hm3.onOutnumbered', aeName, hook);
    }

    return true;
}
