import {HM3} from '../config.js';
import {DiceHM3} from '../hm3-dice.js';
import {Condition, ItemType, SkillType} from '../hm3-types.js';
import * as macros from '../macros.js';
import * as utility from '../utility.js';

/**
 * Extend the base Actor by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ActorHM3 extends Actor {
    get macrolist() {
        return game.macros.contents.filter((m) => m.getFlag('hm3', 'ownerId') === this.id) || [];
    }

    get macrofolder() {
        return game.folders.get(game.settings.get('hm3', 'actorMacrosFolderId')) || null;
    }

    get player() {
        return game.users.find((u) => !u.isGM && this.testUserPermission(u, 'OWNER')) || null;
    }

    /**
     * Mainly for the Party Sheet module.
     */
    get subtype() {
        if (!!this.player && this.type === 'character') return 'pc';
        else if (this.type === 'character') return 'npc';
        else return this.type;
    }

    pronoun(capital = false) {
        const p = () => {
            if (!this.system.gender) return 'It';
            return this.system.gender === 'Male' ? 'His' : 'Her';
        };
        return capital ? p() : p().toLowerCase();
    }

    hasLinkedSteed() {
        const riding = this.items.filter((item) => item.type === ItemType.SKILL && item.name.includes('Riding'));
        if (riding.length === 1 && riding[0].system.actorUuid) return true;
        return false;
    }

    getSteeds() {
        const steeds = this.items.contents.filter(
            (item) => item.type === ItemType.COMPANION && item.system.type === 'Steed'
        );
        return steeds.map((steed) => {
            return fromUuidSync(steed.system.actorUuid);
        });
    }

    getParty() {
        const party = this.items.contents.filter(
            (item) => item.type === ItemType.COMPANION && item.system.type === 'Party'
        );
        return [
            this,
            ...party.map((party) => {
                return fromUuidSync(party.system.actorUuid);
            })
        ];
    }

    getPartySkills(skill) {
        const party = this.getParty();
        return party
            .map((p) => {
                return p.items.getName(skill);
            })
            .filter((p) => !!p)
            .sort((a, b) => b.system.effectiveMasteryLevel - a.system.effectiveMasteryLevel);
    }

    /**
     * The original FVTT return of the applicable effects does not take the permissions into account.
     * With this implementation, a player must have at least LIMITED permission to see the active effect.
     * @override
     * @param {boolean} [override=false]
     * @returns
     */
    allApplicableEffects(override = false) {
        override ||= !game.settings.get('hm3', 'activeEffectPermissions');

        const effects = [];
        for (const effect of super.allApplicableEffects()) {
            if (override) {
                effects.push(effect);
            } else {
                const hidden = effect.hidden && !game.user.isGM;
                if (effect.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED) && !hidden) {
                    effects.push(effect);
                }
            }
        }

        return effects;
    }

    /**
     *
     * @param {Condition} condition
     * @returns
     */
    hasCondition(condition) {
        return macros.hasActiveEffect(this, condition, condition === Condition.OUTNUMBERED ? false : true);
    }

    static defaultName({type, parent, pack} = {}) {
        const documentName = this.metadata.name;
        let collection;
        if (parent) collection = parent.getEmbeddedCollection(documentName);
        else if (pack) collection = game.packs.get(pack);
        else collection = game.collections.get(documentName);
        const takenNames = new Set();
        for (const document of collection) takenNames.add(document.name);
        const baseName = CONFIG.Actor.typeLabels[type] ? CONFIG.Actor.typeLabels[type] : type;
        let name = baseName;
        let index = 1;
        while (takenNames.has(name)) name = `${baseName} (${++index})`;
        return name;
    }

    static async createDialog(data = {}, {parent = null, pack = null, types, ...options} = {}) {
        if (this.hasTypeData && types) {
            if (types.length === 0) throw new Error('The array of sub-types to restrict to must not be empty');
            for (const type of types) {
                if (type === CONST.BASE_DOCUMENT_TYPE || !this.TYPES.includes(type)) {
                    throw new Error(`Invalid ${this.documentName} sub-type: "${type}"`);
                }
            }
        }

        // Collect data
        const documentTypes = this.TYPES.filter((t) => t !== CONST.BASE_DOCUMENT_TYPE && types?.includes(t) !== false);
        let collection;
        if (!parent) {
            if (pack) collection = game.packs.get(pack);
            else collection = game.collections.get(this.documentName);
        }
        const folders = collection?._formatFolderSelectOptions() ?? [];
        const label = game.i18n.localize(this.metadata.label);
        const title = game.i18n.format('DOCUMENT.Create', {type: label});
        let defaultType = CONFIG[this.documentName]?.defaultType;
        if (!defaultType || types?.includes(defaultType) === false) defaultType = documentTypes[0];
        const type = data.type || defaultType;

        // Render the document creation form
        const html = await renderTemplate(`templates/sidebar/document-create.html`, {
            folders,
            name: data.name || '',
            defaultName: this.implementation.defaultName({type, parent, pack}),
            folder: data.folder,
            hasFolders: folders.length > 1,
            type,
            types: Object.fromEntries(
                documentTypes
                    .map((t) => {
                        const label = CONFIG[this.documentName]?.typeLabels?.[t] ?? t;
                        return [t, game.i18n.has(label) ? game.i18n.localize(label) : t];
                    })
                    .sort((a, b) => a[1].localeCompare(b[1], game.i18n.lang))
            ),
            hasTypes: this.hasTypeData,
            content: `<div class="form-group">
            <label class="init-checkbox">Initialize default skills &amp; locations</label>
            <input type="checkbox" name="initDefaults" checked />
            </div>
            <div class="form-group">
            <label class="location-dropdown">Locations</label>
            <select name="locations" id="locations">
              <option value="default-humanoid">Default Humanoid</option>
              <option value="simplified-humanoid">Simplified Humanoid</option>
              <option value="default-horse">Default Horse</option>
            </select>
            </div>`
        });

        // Render the confirmation dialog window
        return Dialog.prompt({
            title,
            content: html,
            label: title,
            render: (html) => {
                if (!this.hasTypeData) return;
                html[0].querySelector('[name="type"]').addEventListener('change', (e) => {
                    html[0].querySelector('[name="name"]').placeholder = this.implementation.defaultName({
                        type: e.target.value,
                        parent,
                        pack
                    });
                });
            },
            callback: (html) => {
                const form = html[0].querySelector('form');
                const fd = new FormDataExtended(form);
                foundry.utils.mergeObject(data, fd.object, {inplace: true});
                if (!data.folder) delete data['folder'];
                if (documentTypes.length === 1) data.type = documentTypes[0];
                if (!data.name?.trim()) data.name = this.implementation.defaultName({type: data.type, parent, pack});
                const createOptions = {parent, pack, renderSheet: true};
                return this.create(data, createOptions);
            },
            rejectClose: false,
            options
        });
    }

    /** @override */
    async _preUpdate(changes, options, user) {
        if (changes.system) {
            // Make sure, that fatigue is a positive number incl 0
            if (
                Object.hasOwn(changes.system, 'fatigue') &&
                (changes.system.fatigue === null || changes.system.fatigue === undefined || changes.system.fatigue < 0)
            ) {
                changes.system.fatigue = 0;
                options.diff = false;
            }
        }

        return super._preUpdate(changes, options, user);
    }

    /** @override */
    async _onCreate(data, options, userId) {
        await super._onCreate(data, options, userId);
        if (this.testUserPermission(game.user, 'OWNER')) await this.setFlag('hm3', 'CharacterMancer', true);
    }

    /** @override */
    async _preCreate(createData, options, user) {
        await super._preCreate(createData, options, user);

        // If the created actor has items (only applicable to duplicated actors) bypass the new actor creation logic
        if (!createData.initDefaults || createData.items) return;

        // Setup default Actor type specific data.

        const updateData = {};

        if (createData.type === 'character') {
            updateData['system.description'] = await (
                await fetch('systems/hm3/module/actor/character-description.html')
            ).text();
            updateData['system.biography'] =
                '<h1>Data</h1>\n<table style="width: 95%;" border="1">\n<tbody>\n<tr>\n<td style="padding: 2px; width: 143.6px;"><strong>Birthdate</strong></td>\n<td style="padding: 2px; width: 432px;">&nbsp;</td>\n</tr>\n<tr>\n<td style="padding: 2px; width: 143.6px;"><strong>Birthplace</strong></td>\n<td style="padding: 2px; width: 432px;">&nbsp;</td>\n</tr>\n<tr>\n<td style="padding: 2px; width: 143.6px;"><strong>Sibling Rank</strong></td>\n<td style="padding: 2px; width: 432px;">x of y</td>\n</tr>\n<tr>\n<td style="padding: 2px; width: 143.6px;"><strong>Parent(s)</strong></td>\n<td style="padding: 2px; width: 432px;">&nbsp;</td>\n</tr>\n<tr>\n<td style="padding: 2px; width: 143.6px;"><strong>Parent Occupation</strong></td>\n<td style="padding: 2px; width: 432px;">&nbsp;</td>\n</tr>\n<tr>\n<td style="padding: 2px; width: 143.6px;"><strong>Estrangement</strong></td>\n<td style="padding: 2px; width: 432px;">&nbsp;</td>\n</tr>\n<tr>\n<td style="padding: 2px; width: 143.6px;"><strong>Clanhead</strong></td>\n<td style="padding: 2px; width: 432px;">&nbsp;</td>\n</tr>\n<tr>\n<td style="padding: 2px; width: 143.6px;"><strong>Medical Traits</strong></td>\n<td style="padding: 2px; width: 432px;">&nbsp;</td>\n</tr>\n<tr>\n<td style="padding: 2px; width: 143.6px;"><strong>Psyche Traits</strong></td>\n<td style="padding: 2px; width: 432px;">&nbsp;</td>\n</tr>\n</tbody>\n</table>\n<h1>Life Story</h1>';
            updateData['system.bioImage'] = 'systems/hm3/images/svg/knight-silhouette.svg';
            updateData.items = [];

            // Add standard skills
            await ActorHM3.addItemsFromPack(HM3.defaultCharacterSkills, ['hm3.character'], updateData.items);

            switch (createData.locations) {
                case 'simplified-humanoid':
                    ActorHM3._createSimpleHumanoidLocations(updateData.items);
                    break;
                case 'default-horse':
                    ActorHM3._createHorseLocations(updateData.items);
                    break;
                case 'default-humanoid':
                default:
                    // Add standard armor locations
                    ActorHM3._createDefaultHumanoidLocations(updateData.items, false);
                    break;
            }
        } else if (createData.type === 'creature') {
            updateData['system.description'] = '';
            updateData['system.biography'] =
                '<h1>Data</h1>\n<table style="width: 95%;" border="1">\n<tbody>\n<tr>\n<td style="padding: 2px; width: 143.6px;"><strong>Habitat</strong></td>\n<td style="padding: 2px; width: 432px;">&nbsp;</td>\n</tr>\n<tr>\n<td style="padding: 2px; width: 143.6px;"><strong>Height</strong></td>\n<td style="padding: 2px; width: 432px;">&nbsp;</td>\n</tr>\n<tr>\n<td style="padding: 2px; width: 143.6px;"><strong>Weight</strong></td>\n<td style="padding: 2px; width: 432px;"></td>\n</tr>\n<tr>\n<td style="padding: 2px; width: 143.6px;"><strong>Diet</strong></td>\n<td style="padding: 2px; width: 432px;">&nbsp;</td>\n</tr>\n<tr>\n<td style="padding: 2px; width: 143.6px;"><strong>Lifespan</strong></td>\n<td style="padding: 2px; width: 432px;">&nbsp;</td>\n</tr>\n<tr>\n<td style="padding: 2px; width: 143.6px;"><strong>Group</strong></td>\n<td style="padding: 2px; width: 432px;">&nbsp;</td>\n</tr>\n</tbody>\n</table>\n<h1>Special Abilities</h1>\n<p>Describe any special abilities.</p>\n<h1>Attacks</h1>\n<p>Describe methods of attack.</p>\n<h1>Behavior</h1>\n<p>Describe behavioral aspects.</p>';
            updateData['system.bioImage'] = 'systems/hm3/images/svg/monster-silhouette.svg';
            updateData.items = [];

            // Add standard skills
            await ActorHM3.addItemsFromPack(HM3.defaultCreatureSkills, ['hm3.character'], updateData.items);

            switch (createData.locations) {
                case 'simplified-humanoid':
                    ActorHM3._createSimpleHumanoidLocations(updateData.items);
                    break;
                case 'default-horse':
                    ActorHM3._createHorseLocations(updateData.items);
                    break;
                case 'default-humanoid':
                default:
                    // Add standard armor locations
                    ActorHM3._createDefaultHumanoidLocations(updateData.items, false);
                    break;
            }
        } else if (createData.type === 'container') {
            updateData['system.capacity.max'] = 1;
            updateData['system.description'] = '';
            updateData['system.bioImage'] = 'systems/hm3/images/icons/svg/chest.svg';
            updateData['img'] = 'systems/hm3/images/icons/svg/chest.svg';
        }
        this.updateSource(updateData);

        // Sanity Check
        let totalWeightHigh = 0;
        let totalWeightMid = 0;
        let totalWeightLow = 0;
        let numArmorLocations = 0;
        updateData.items.forEach((it) => {
            if (it.type === ItemType.ARMORLOCATION) {
                totalWeightHigh += it.system.probWeight['high'];
                totalWeightMid += it.system.probWeight['mid'];
                totalWeightLow += it.system.probWeight['low'];
                numArmorLocations++;
            }
        });

        if (totalWeightHigh % 100 || totalWeightMid % 100 || totalWeightLow % 100) {
            if (game.user.isGM)
                ui.notifications.warn(
                    `Armor prob weight is NOT equal to 100, 1000 or 10000. ${this.name}: ${totalWeightHigh} | ${totalWeightMid} | ${totalWeightLow}`,
                    {permanent: true}
                );
        }
    }

    /**
     * Add all of the items from a pack with the specified names
     * @param {*} itemNames Array of item names to include
     * @param {*} packNames Array of packNames of compendium packs containing items
     * @param {*} items array of ItemData elements to populate
     */
    static async addItemsFromPack(itemNames, packNames, items) {
        let itNames = foundry.utils.deepClone(itemNames);
        const itemAry = [];
        for (let packName of packNames) {
            const pack = game.packs.get(packName);
            await pack.getDocuments().then((result) => {
                let chain = Promise.resolve();
                result.forEach(async (item, index) => {
                    chain = await chain.then(async () => {
                        if (itNames.includes(item.name)) {
                            const clone = item.toObject();
                            clone.effects = clone.effects.contents;
                            // Set the created time for added items
                            if (clone.system?.hasOwnProperty('createdTime'))
                                clone.system.createdTime = game.time.worldTime;
                            itemAry.push(clone);
                            // Ensure we don't continue looking for the itemName after we have found one
                            itNames = itNames.filter((i) => i !== item.name);
                        }
                    });
                });
            });
        }
        itemAry.sort((a, b) => itemNames.indexOf(a.name) - itemNames.indexOf(b.name));
        items.push(...itemAry);
    }

    /**
     * Create an armorlocation ItemData element
     *
     * @param {*} locName Location Name
     * @param {*} templateName Location Template Name
     * @returns an armorlocation ItemData
     */
    static _setupLocation(locName, templateName) {
        const armorLocationData = foundry.utils.deepClone(game.model.Item.armorlocation);
        foundry.utils.mergeObject(armorLocationData, HM3.injuryLocations[templateName]);
        armorLocationData.probWeight.high *= 10;
        armorLocationData.probWeight.mid *= 10;
        armorLocationData.probWeight.low *= 10;
        return {name: locName, type: ItemType.ARMORLOCATION, system: armorLocationData};
    }

    /**
     * Add armorlocation items to the items array for all of the locations for
     * a humanoid
     *
     * @param {*} items Array of ItemData elements
     */
    static _createDefaultHumanoidLocations(items, face = true) {
        items.push(ActorHM3._setupLocation('Skull', 'Skull'));
        face
            ? items.push(ActorHM3._setupLocation('Face', 'Face'))
            : ActorHM3._createDefaultHumanoidFaceLocations(items);
        items.push(ActorHM3._setupLocation('Neck', 'Neck'));
        items.push(ActorHM3._setupLocation('Left Shoulder', 'Shoulder'));
        items.push(ActorHM3._setupLocation('Right Shoulder', 'Shoulder'));
        items.push(ActorHM3._setupLocation('Left Upper Arm', 'Upper Arm'));
        items.push(ActorHM3._setupLocation('Right Upper Arm', 'Upper Arm'));
        items.push(ActorHM3._setupLocation('Left Elbow', 'Elbow'));
        items.push(ActorHM3._setupLocation('Right Elbow', 'Elbow'));
        items.push(ActorHM3._setupLocation('Left Forearm', 'Forearm'));
        items.push(ActorHM3._setupLocation('Right Forearm', 'Forearm'));
        items.push(ActorHM3._setupLocation('Left Hand', 'Hand'));
        items.push(ActorHM3._setupLocation('Right Hand', 'Hand'));
        items.push(ActorHM3._setupLocation('Thorax', 'Thorax'));
        items.push(ActorHM3._setupLocation('Abdomen', 'Abdomen'));
        items.push(ActorHM3._setupLocation('Groin', 'Groin'));
        items.push(ActorHM3._setupLocation('Left Hip', 'Hip'));
        items.push(ActorHM3._setupLocation('Right Hip', 'Hip'));
        items.push(ActorHM3._setupLocation('Left Thigh', 'Thigh'));
        items.push(ActorHM3._setupLocation('Right Thigh', 'Thigh'));
        items.push(ActorHM3._setupLocation('Left Knee', 'Knee'));
        items.push(ActorHM3._setupLocation('Right Knee', 'Knee'));
        items.push(ActorHM3._setupLocation('Left Calf', 'Calf'));
        items.push(ActorHM3._setupLocation('Right Calf', 'Calf'));
        items.push(ActorHM3._setupLocation('Left Foot', 'Foot'));
        items.push(ActorHM3._setupLocation('Right Foot', 'Foot'));
    }

    static _createDefaultHumanoidFaceLocations(items) {
        items.push(ActorHM3._setupLocation('Jaw', 'Jaw'));
        items.push(ActorHM3._setupLocation('Left Eye', 'Eye'));
        items.push(ActorHM3._setupLocation('Right Eye', 'Eye'));
        items.push(ActorHM3._setupLocation('Left Cheek', 'Cheek'));
        items.push(ActorHM3._setupLocation('Right Cheek', 'Cheek'));
        items.push(ActorHM3._setupLocation('Nose', 'Nose'));
        items.push(ActorHM3._setupLocation('Left Ear', 'Ear'));
        items.push(ActorHM3._setupLocation('Right Ear', 'Ear'));
        items.push(ActorHM3._setupLocation('Mouth', 'Mouth'));
    }

    /**
     * Add armorlocation items to the items array for all of the locations for
     * a humanoid, simplified
     *
     * @param {*} items Array of ItemData elements
     */
    static _createSimpleHumanoidLocations(items) {
        items.push(ActorHM3._setupLocation('Head', 'Head, humanoid simple'));
        items.push(ActorHM3._setupLocation('Neck', 'Neck, humanoid simple'));
        items.push(ActorHM3._setupLocation('Left Arm', 'Arm, humanoid simple'));
        items.push(ActorHM3._setupLocation('Right Arm', 'Arm, humanoid simple'));
        items.push(ActorHM3._setupLocation('Thorax', 'Thorax, humanoid simple'));
        items.push(ActorHM3._setupLocation('Abdomen', 'Abdomen, humanoid simple'));
        items.push(ActorHM3._setupLocation('Left Leg', 'Leg, humanoid simple'));
        items.push(ActorHM3._setupLocation('Right Leg', 'Leg, humanoid simple'));
    }

    /**
     * Add armorlocation items to the items array for all of the locations for
     * a horse
     *
     * @param {*} items Array of ItemData elements
     */
    static _createHorseLocations(items) {
        items.push(ActorHM3._setupLocation('Head', 'Head, horse'));
        items.push(ActorHM3._setupLocation('Neck', 'Neck, horse'));
        items.push(ActorHM3._setupLocation('Left Fore Leg', 'Fore Leg, horse'));
        items.push(ActorHM3._setupLocation('Right Fore Leg', 'Fore Leg, horse'));
        items.push(ActorHM3._setupLocation('Left Flank (Thorax)', 'Flank, horse'));
        items.push(ActorHM3._setupLocation('Right Flank (Thorax)', 'Flank, horse'));
        items.push(ActorHM3._setupLocation('Abdomen', 'Abdomen, horse'));
        items.push(ActorHM3._setupLocation('Left Quarter', 'Quarter, horse'));
        items.push(ActorHM3._setupLocation('Right Quarter', 'Quarter, horse'));
        items.push(ActorHM3._setupLocation('Left Hind Leg', 'Hind Leg, horse'));
        items.push(ActorHM3._setupLocation('Right Hind Leg', 'Hind Leg, horse'));
        items.push(ActorHM3._setupLocation('Tail', 'Tail, horse'));
    }

    /**
     * When prepareBaseData() runs, the Actor.items map is not available, or if it is, it
     * is not dependable.  The very next method will update the Actor.items map using
     * information from the Actor._source.items array.  So, at this point we may safely
     * use Actor._source.items, so long as we remember that that data is going to be going
     * through a prepareData() stage next.
     *
     * @override */
    prepareBaseData() {
        super.prepareBaseData();
        const actorData = this.system;
        const actorItems = this.items;

        // Ephemeral data is kept together with other actor data,
        // but it is not in the data model so it will not be saved.
        if (!actorData.eph) actorData.eph = {};
        const eph = actorData.eph;

        actorData.totalWeight = 0;

        this.calcTotalGearWeight();

        // Prepare data items unique to containers
        if (this.type === 'container') {
            actorData.capacity.value = actorData.totalWeight;
            actorData.capacity.pct = Math.round(
                ((actorData.capacity.max - actorData.capacity.value) / (actorData.capacity.max || 1)) * 100
            );
            actorData.capacity.pct = Math.max(Math.min(actorData.capacity.pct, 100), 0); // ensure value is between 0 and 100 inclusive)
            return;
        }

        // Initialize derived attributes
        actorData.abilities.strength.effective = 0;
        actorData.abilities.stamina.effective = 0;
        actorData.abilities.dexterity.effective = 0;
        actorData.abilities.agility.effective = 0;
        actorData.abilities.intelligence.effective = 0;
        actorData.abilities.aura.effective = 0;
        actorData.abilities.will.effective = 0;
        actorData.abilities.eyesight.effective = 0;
        actorData.abilities.hearing.effective = 0;
        actorData.abilities.smell.effective = 0;
        actorData.abilities.voice.effective = 0;
        actorData.abilities.comeliness.effective = 0;
        actorData.abilities.morality.effective = 0;
        actorData.abilities.strength.modified = 0;
        actorData.abilities.stamina.modified = 0;
        actorData.abilities.dexterity.modified = 0;
        actorData.abilities.agility.modified = 0;
        actorData.abilities.intelligence.modified = 0;
        actorData.abilities.aura.modified = 0;
        actorData.abilities.will.modified = 0;
        actorData.abilities.eyesight.modified = 0;
        actorData.abilities.hearing.modified = 0;
        actorData.abilities.smell.modified = 0;
        actorData.abilities.voice.modified = 0;
        actorData.abilities.comeliness.modified = 0;
        actorData.abilities.morality.modified = 0;
        actorData.dodge = 0;
        actorData.initiative = 0;
        actorData.endurance = 0;
        if (!actorData.shockIndex) actorData.shockIndex = {value: 100, max: 100};
        actorData.move.effective = 0;
        actorData.universalPenalty = 0;
        actorData.physicalPenalty = 0;
        actorData.totalInjuryLevels = 0;
        if (!actorData.injuryLevels) actorData.injuryLevels = {value: 0, max: 6};
        actorData.encumbrance = 0;
        actorData.condition = 0;
        actorData.mounted = !!actorData.mounted;

        // Setup temporary work values masking the base values
        eph.move = actorData.move.base;
        eph.fatigue = actorData.fatigue || 0;
        eph.strength = actorData.abilities.strength.base;
        eph.stamina = actorData.abilities.stamina.base;
        eph.dexterity = actorData.abilities.dexterity.base;
        eph.agility = actorData.abilities.agility.base;
        eph.eyesight = actorData.abilities.eyesight.base;
        eph.hearing = actorData.abilities.hearing.base;
        eph.smell = actorData.abilities.smell.base;
        eph.voice = actorData.abilities.voice.base;
        eph.intelligence = actorData.abilities.intelligence.base;
        eph.will = actorData.abilities.will.base;
        eph.aura = actorData.abilities.aura.base;
        eph.morality = actorData.abilities.morality.base;
        eph.comeliness = actorData.abilities.comeliness.base;
        eph.endurance = actorData.endurance;

        eph.meleeAMLMod = 0;
        eph.meleeDMLMod = 0;
        eph.missileAMLMod = 0;
        eph.outnumbered = 0;
        eph.commSkillsMod = 0;
        eph.physicalSkillsMod = 0;
        eph.combatSkillsMod = 0;
        eph.craftSkillsMod = 0;
        eph.ritualSkillsMod = 0;
        eph.magicSkillsMod = 0;
        eph.psionicTalentsMod = 0;
        eph.itemAMLMod = 0;
        eph.itemDMLMod = 0;
        eph.itemEMLMod = 0;
        eph.itemCustomMod = 0;
        eph.unhorsing = 0;

        // Calculate endurance (in case Condition not present)
        actorData.endurance = Math.round(
            (actorData.abilities.strength.base + actorData.abilities.stamina.base + actorData.abilities.will.base) / 3
        );

        const oldTotalInjuryLevels = actorData.injuryLevels.value;
        // Calculate values based on items
        actorItems.forEach((it) => {
            const itemData = it.system;
            if (it.type === ItemType.INJURY) {
                // Calculate total injury levels
                actorData.totalInjuryLevels += itemData.injuryLevel || 0;
            } else if (it.type === ItemType.SKILL && it.name.includes('Condition')) {
                // if Condition skill is present, use that for endurance instead
                if (!itemData.masteryLevel) {
                    actorData.abilities.strength.modified = eph.strength;
                    actorData.abilities.stamina.modified = eph.stamina;
                    actorData.abilities.will.modified = eph.will;
                    it.prepareData();
                    it.postProcessItems();
                }
                actorData.endurance = Math.round((itemData.masteryLevel || 5 * actorData.endurance) / 5);
                actorData.condition = itemData.masteryLevel;
            }
        });

        // Safety net: We divide things by endurance, so ensure it is > 0
        actorData.endurance = Math.max(actorData.endurance, 1);

        if (this.hasCondition(Condition.INANIMATE)) {
            // If the actor is Inanimate, ensure max injury levels is equal to endurance
            if (actorData.injuryLevels.max !== actorData.endurance) {
                setTimeout(() => this.update({'system.injuryLevels.max': actorData.endurance}), 500);
            }
        } else if (actorData.injuryLevels.max !== 6) {
            // If the actor is not Inanimate, ensure max injury levels is 6
            setTimeout(() => this.update({'system.injuryLevels.max': 6}), 500);
        }

        eph.totalInjuryLevels = actorData.totalInjuryLevels;
        eph.effectiveWeight = actorData.loadRating
            ? Math.max(actorData.totalWeight - actorData.loadRating, 0)
            : actorData.totalWeight;
        actorData.encumbrance = Math.floor(eph.effectiveWeight / actorData.endurance);

        if (oldTotalInjuryLevels !== actorData.totalInjuryLevels) {
            Hooks.call('hm3.onTotalInjuryLevelsChanged', this, oldTotalInjuryLevels, actorData.totalInjuryLevels);
        }

        Hooks.call('hm3.onActorPrepareBaseData', this);
    }

    /**
     * Perform data preparation after Items preparation and Active Effects have
     * been applied.
     *
     * Note that all Active Effects have already been applied by this point, so
     * nothing in this method will be affected further by Active Effects.
     *
     * @override */
    prepareDerivedData() {
        super.prepareDerivedData();
        const actorData = this.system;

        const eph = actorData.eph;

        this._calcGearWeightTotals();

        if (this.type === 'container') {
            return;
        }

        // store AE-affected ability scores
        actorData.abilities.strength.modified = eph.strength;
        actorData.abilities.stamina.modified = eph.stamina;
        actorData.abilities.dexterity.modified = eph.dexterity;
        actorData.abilities.agility.modified = eph.agility;
        actorData.abilities.eyesight.modified = eph.eyesight;
        actorData.abilities.hearing.modified = eph.hearing;
        actorData.abilities.smell.modified = eph.smell;
        actorData.abilities.voice.modified = eph.voice;
        actorData.abilities.intelligence.modified = eph.intelligence;
        actorData.abilities.will.modified = eph.will;
        actorData.abilities.aura.modified = eph.aura;
        actorData.abilities.morality.modified = eph.morality;
        actorData.abilities.comeliness.modified = eph.comeliness;

        // The effect of Load on a character’s physical activities. It is equal to Load ÷ Endurance, rounded off to the nearest whole number. (COMBAT 2)
        this.system.encumbrance = Math.floor(this.system.eph.effectiveWeight / this.system.endurance);
        if (this.system.mounted) {
            this.system.encumbrance = Math.round(this.system.encumbrance / 2 + Number.EPSILON);
            eph.fatigue = Math.round(eph.fatigue / 2 + Number.EPSILON) || 0;
        }
        // All common character and creature derived data below here

        // Since active effects may have modified these values, we must ensure
        // that they are integers and not floating values. Round to nearest integer.
        actorData.encumbrance = Math.max(Math.round(actorData.encumbrance + Number.EPSILON), 0);
        actorData.endurance = Math.max(Math.round(actorData.endurance + Number.EPSILON), 0);
        actorData.move.effective = Math.max(Math.round(eph.move + Number.EPSILON), 0);
        eph.totalInjuryLevels = Math.max(Math.round(eph.totalInjuryLevels + Number.EPSILON), 0);
        eph.fatigue = Math.max(Math.round(eph.fatigue + Number.EPSILON), 0) || 0;

        // Universal Penalty and Physical Penalty are used to calculate many
        // things, including effectiveMasteryLevel for all skills,
        // endurance, move, etc.
        ActorHM3.calcUniversalPenalty(this);
        this.applySpecificActiveEffect('system.universalPenalty');
        actorData.universalPenalty = Math.floor(Math.max(actorData.universalPenalty || 0, 0));

        ActorHM3.calcPhysicalPenalty(this);
        this.applySpecificActiveEffect('system.physicalPenalty');
        actorData.physicalPenalty = Math.floor(Math.max(actorData.physicalPenalty || 0, 0));

        ActorHM3.calcShockIndex(this);

        // Calculate current Move speed.  Cannot go below 0
        // HEURISTIC: Assume if base move < 25 that user is specifying hexes for movement (use PP as penalty);
        // 25+ means they are specifying feet (and use PP*5 as penalty); unlikely many characters will have
        // a base Agility of <= 4 and will want to specify the base move speed in feet.
        // Eventually we will standardize on "feet" and this heuristic can be removed.
        actorData.move.effective = Math.max(
            eph.move - (actorData.move.base < 25 ? actorData.physicalPenalty : actorData.physicalPenalty * 5),
            0
        );

        // Setup effective abilities (accounting for UP and PP)
        this._setupEffectiveAbilities(actorData);

        // Calculate Important Roll Targets
        eph.stumbleTarget = Math.max(actorData.abilities.agility.effective, 0);
        eph.fumbleTarget = Math.max(actorData.abilities.dexterity.effective, 0);

        // Process all the final post activities for each item
        this.items.forEach((it) => {
            it.postProcessItems();

            // Apply AE based on skill types (not based on individual skills, that comes later)
            if ([ItemType.SKILL, ItemType.PSIONIC].includes(it.type)) {
                this.applySkillTypeActiveEffect(it);
            }
        });

        // Apply the individual AE for skills
        this._applySkillActiveEffects();

        // Calculate spell effective mastery level values
        this._refreshSpellsAndInvocations();

        // Collect all combat skills into a map for use later
        let combatSkills = {};
        this.items.forEach((it) => {
            const itemData = it.system;
            if (
                it.type === ItemType.SKILL &&
                (itemData.type === SkillType.COMBAT || it.name.toLowerCase() === 'throwing')
            ) {
                combatSkills[it.name] = {
                    'name': it.name,
                    'eml': itemData.effectiveMasteryLevel
                };
            }
        });

        this._setupWeaponData(combatSkills);

        this._generateArmorLocationMap(actorData);

        // Ensure all EML, AML, and DML are min 5
        this._setMinMaxEML_AML_DML();

        // Store "special" skill properties
        this.items.forEach((it) => {
            const itemData = it.system;
            if (it.type === ItemType.SKILL) {
                switch (it.name.toLowerCase()) {
                    case 'dodge':
                        actorData.dodge = itemData.effectiveMasteryLevel;
                        break;

                    case 'initiative':
                        actorData.initiative = itemData.effectiveMasteryLevel;
                        break;

                    case 'condition':
                        actorData.condition = itemData.effectiveMasteryLevel;
                        break;
                }
            }
        });

        Hooks.call('hm3.onActorPrepareDerivedData', this);

        return;
    }

    /**
     * Calculate the total weight of all gear carried
     */
    calcTotalGearWeight() {
        const actorItems = this.items;
        const actorData = this.system;

        // If not the owner of this actor, then this method is useless
        if (!this.isOwner) return;

        // check to ensure items are available
        if (!actorItems) return;

        // Find all containergear, and track whether container is carried or not
        const containerCarried = {};
        actorItems.forEach((it) => {
            if (it.type === ItemType.CONTAINERGEAR) {
                containerCarried[it.id] = it.system.isCarried;
            }
        });

        let totalWeight = 0;
        actorItems.forEach((it) => {
            const itemData = it.system;
            if (it.type.endsWith('gear')) {
                // If gear is on-person, then check the carried flag to determine
                // whether the gear is carried. Otherwise, it must be in a container,
                // so check whether the container is carried.
                if (itemData.container === 'on-person') {
                    if (itemData.isCarried) {
                        totalWeight += itemData.weight * itemData.quantity;
                    }
                } else {
                    if (containerCarried[itemData.container]) {
                        totalWeight += itemData.weight * itemData.quantity;
                    }
                }
            }
        });

        // Normalize weight to two decimal points
        totalWeight = utility.truncate(totalWeight);

        actorData.totalWeight = totalWeight;

        return;
    }

    /**
     * Calculate the weight of the gear. Note that this is somewhat redundant
     * with the calculation being done during item create/update/delete,
     * but here we are generating a much more fine-grained set of data
     * regarding the weight distribution.
     */
    _calcGearWeightTotals() {
        const eph = this.system.eph;

        eph.totalWeaponWeight = 0;
        eph.totalMissileWeight = 0;
        eph.totalArmorWeight = 0;
        eph.totalMiscGearWeight = 0;

        let tempWeight = 0;

        // Initialize all container capacity values
        this.items.forEach((it) => {
            if (it.type === ItemType.CONTAINERGEAR) it.system.capacity.value = 0;
        });

        this.items.forEach((it) => {
            const itemData = it.system;
            tempWeight = 0;

            if (it.type.endsWith('gear')) {
                // If the gear is inside of a container, then the "carried"
                // flag is inherited from the container.
                if (itemData.container && itemData.container !== 'on-person') {
                    const container = this.items.find((i) => i.id === itemData.container);
                    if (container) itemData.isCarried = container.system.isCarried;
                }
            }

            switch (it.type) {
                case ItemType.WEAPONGEAR:
                    tempWeight = Math.max(itemData.weight * itemData.quantity, 0);
                    if (!itemData.isCarried) break;
                    eph.totalWeaponWeight += tempWeight;
                    break;

                case ItemType.MISSILEGEAR:
                    tempWeight = Math.max(itemData.weight * itemData.quantity, 0);
                    if (!itemData.isCarried) break;
                    eph.totalMissileWeight += tempWeight;
                    break;

                case ItemType.ARMORGEAR:
                    tempWeight = Math.max(itemData.weight * itemData.quantity, 0);
                    if (!itemData.isCarried) break;
                    eph.totalArmorWeight += tempWeight;
                    break;

                case ItemType.MISCGEAR:
                case ItemType.CONTAINERGEAR:
                    tempWeight = Math.max(itemData.weight * itemData.quantity, 0);
                    if (!itemData.isCarried) break;
                    eph.totalMiscGearWeight += tempWeight;
                    break;
            }

            if (it.type.endsWith('gear')) {
                const cid = itemData.container;
                if (cid && cid != 'on-person') {
                    const container = this.items.get(cid);
                    if (container) {
                        container.system.capacity.value = utility.truncate(
                            container.system.capacity.value + tempWeight
                        );
                    } else {
                        // If container is set and is not 'on-person', but if we can't find the container,
                        // move the item back to 'on-person'.
                        itemData.container = 'on-person';
                    }
                }
            }
        });

        // It seems whenever doing math on floating point numbers, very small
        // amounts get introduced creating very long decimal values.
        // Correct any math weirdness; keep to two decimal points
        eph.totalArmorWeight = utility.truncate(eph.totalArmorWeight);
        eph.totalWeaponWeight = utility.truncate(eph.totalWeaponWeight);
        eph.totalMissileWeight = utility.truncate(eph.totalMissileWeight);
        eph.totalMiscGearWeight = utility.truncate(eph.totalMiscGearWeight);

        eph.totalGearWeight =
            eph.totalWeaponWeight + eph.totalMissileWeight + eph.totalArmorWeight + eph.totalMiscGearWeight;
        eph.totalGearWeight = utility.truncate(eph.totalGearWeight);
    }

    _setupEffectiveAbilities(actorData) {
        const eph = this.system.eph;

        // Affected by physical penalty
        actorData.abilities.strength.effective = Math.max(
            Math.round(eph.strength + Number.EPSILON) - actorData.physicalPenalty,
            0
        );
        actorData.abilities.stamina.effective = Math.max(
            Math.round(eph.stamina + Number.EPSILON) - actorData.physicalPenalty,
            0
        );
        actorData.abilities.agility.effective = Math.max(
            Math.round(eph.agility + Number.EPSILON) - actorData.physicalPenalty,
            0
        );
        actorData.abilities.dexterity.effective = Math.max(
            Math.round(eph.dexterity + Number.EPSILON) - actorData.physicalPenalty,
            0
        );

        // Affected by universal penalty
        actorData.abilities.intelligence.effective = Math.max(
            Math.round(eph.intelligence + Number.EPSILON) - actorData.universalPenalty,
            0
        );
        actorData.abilities.aura.effective = Math.max(
            Math.round(eph.aura + Number.EPSILON) - actorData.universalPenalty,
            0
        );
        actorData.abilities.will.effective = Math.max(
            Math.round(eph.will + Number.EPSILON) - actorData.universalPenalty,
            0
        );
        actorData.abilities.eyesight.effective = Math.max(
            Math.round(eph.eyesight + Number.EPSILON) - actorData.universalPenalty,
            0
        );
        actorData.abilities.hearing.effective = Math.max(
            Math.round(eph.hearing + Number.EPSILON) - actorData.universalPenalty,
            0
        );
        actorData.abilities.smell.effective = Math.max(
            Math.round(eph.smell + Number.EPSILON) - actorData.universalPenalty,
            0
        );
        actorData.abilities.voice.effective = Math.max(
            Math.round(eph.voice + Number.EPSILON) - actorData.universalPenalty,
            0
        );

        // Not affected by any penalties
        actorData.abilities.comeliness.effective = Math.max(Math.round(eph.comeliness + Number.EPSILON), 0);
        actorData.abilities.morality.effective = Math.max(Math.round(eph.morality + Number.EPSILON), 0);
    }

    /**
     * Consolidated method to setup all gear, including misc gear, weapons,
     * and missiles.  (not armor yet)
     */
    _setupWeaponData(combatSkills) {
        const eph = this.system.eph;

        // Just ensure we take care of any NaN or other falsy nonsense
        if (!eph.missileAMLMod) eph.missileAMLMod = 0;
        if (!eph.weaponAMLMod) eph.weaponAMLMod = 0;
        if (!eph.weaponDMLMod) eph.weaponDMLMod = 0;

        this.items.forEach((it) => {
            const itemData = it.system;
            if (it.type === ItemType.MISSILEGEAR) {
                // Reset mastery levels in case nothing matches
                itemData.attackMasteryLevel = 5;

                // If the associated skill is in our combat skills list, get EML from there
                // and then calculate AML.
                let assocSkill = itemData.assocSkill;
                if (typeof combatSkills[assocSkill] !== 'undefined') {
                    let skillEml = combatSkills[assocSkill].eml;
                    itemData.attackMasteryLevel = (skillEml || 0) + (itemData.attackModifier || 0);
                }
            } else if (it.type === ItemType.WEAPONGEAR) {
                // Reset mastery levels in case nothing matches
                itemData.attackMasteryLevel = 5;
                itemData.defenseMasteryLevel = 5;
                let weaponName = itemData.name;

                // If associated skill is 'None', see if there is a skill with the
                // same name as the weapon; if so, then set it to that skill.
                if (itemData.assocSkill === 'None') {
                    // If no combat skill with this name exists, search for next weapon
                    if (typeof combatSkills[weaponName] === 'undefined') return;

                    // A matching skill was found, set associated Skill to that combat skill
                    itemData.assocSkill = combatSkills[weaponName].name;
                }

                // At this point, we know the Associated Skill is not blank. If that
                // associated skill is in our combat skills list, get EML from there
                // and then calculate AML and DML.
                let assocSkill = itemData.assocSkill;
                if (typeof combatSkills[assocSkill] !== 'undefined') {
                    let skillEml = combatSkills[assocSkill].eml;
                    itemData.attackMasteryLevel =
                        (skillEml || 0) + (itemData.attack || 0) + (itemData.attackModifier || 0);
                    itemData.defenseMasteryLevel = (skillEml || 0) + (itemData.defense || 0);
                }
            }
        });

        // Apply the individual AE for weapons
        this._applyWeaponActiveEffects();
    }

    _setMinEML_AML_DML() {
        this.items.forEach((it) => {
            const itemData = it.system;
            switch (it.type) {
                case ItemType.SKILL:
                case ItemType.PSIONIC:
                case ItemType.SPELL:
                case ItemType.INVOCATION:
                    itemData.effectiveMasteryLevel = Math.max(itemData.effectiveMasteryLevel, 5);
                    break;

                case ItemType.WEAPONGEAR:
                    itemData.attackMasteryLevel = Math.max(itemData.attackMasteryLevel, 5);
                    itemData.defenseMasteryLevel = Math.max(itemData.defenseMasteryLevel, 5);
                    break;

                case ItemType.MISSILEGEAR:
                    itemData.attackMasteryLevel = Math.max(itemData.attackMasteryLevel, 5);
                    break;
            }
        });
    }

    _setMinMaxEML_AML_DML() {
        this.items.forEach((it) => {
            const itemData = it.system;
            switch (it.type) {
                case ItemType.SKILL:
                case ItemType.PSIONIC:
                case ItemType.SPELL:
                case ItemType.INVOCATION:
                    itemData.effectiveMasteryLevel = Math.min(Math.max(itemData.effectiveMasteryLevel, 5), 95);
                    break;

                case ItemType.WEAPONGEAR:
                    itemData.attackMasteryLevel = Math.min(Math.max(itemData.attackMasteryLevel, 5), 95);
                    itemData.defenseMasteryLevel = Math.min(Math.max(itemData.defenseMasteryLevel, 5), 95);
                    break;

                case ItemType.MISSILEGEAR:
                    itemData.attackMasteryLevel = Math.min(Math.max(itemData.attackMasteryLevel, 5), 95);
                    break;
            }
        });
    }

    _refreshSpellsAndInvocations() {
        this._resetAllSpellsAndInvocations();
        this.items.forEach((it) => {
            const itemData = it.system;
            if (it.type === ItemType.SKILL && itemData.type === SkillType.MAGIC) {
                this._setConvocationSpells(
                    it.name,
                    itemData.skillBase.value,
                    itemData.masteryLevel,
                    itemData.effectiveMasteryLevel
                );
            } else if (it.type === ItemType.SKILL && itemData.type === SkillType.RITUAL) {
                this._setRitualInvocations(
                    it.name,
                    itemData.skillBase.value,
                    itemData.masteryLevel,
                    itemData.effectiveMasteryLevel
                );
            }
        });
    }

    _resetAllSpellsAndInvocations() {
        this.items.forEach((it) => {
            const itemData = it.system;
            if (it.type === ItemType.SPELL || it.type === ItemType.INVOCATION) {
                itemData.effectiveMasteryLevel = 0;
                itemData.skillIndex = 0;
                itemData.masteryLevel = 0;
                itemData.effectiveMasteryLevel = 0;
            }
        });
    }

    _setConvocationSpells(convocation, sb, ml, eml) {
        if (!convocation || convocation.length == 0) return;

        let lcConvocation = convocation.toLowerCase();
        this.items.forEach((it) => {
            const itemData = it.system;
            if (
                it.type === ItemType.SPELL &&
                itemData.convocation &&
                itemData.convocation.toLowerCase() === lcConvocation
            ) {
                itemData.effectiveMasteryLevel = eml - itemData.level * 5;
                itemData.skillIndex = Math.floor(ml / 10);
                itemData.masteryLevel = ml;
                itemData.skillBase = sb;
            }
        });
    }

    _setRitualInvocations(diety, sb, ml, eml) {
        if (!diety || diety.length == 0) return;

        let lcDiety = diety.toLowerCase();
        this.items.forEach((it) => {
            const itemData = it.system;
            if (it.type === ItemType.INVOCATION && itemData.diety && itemData.diety.toLowerCase() === lcDiety) {
                itemData.effectiveMasteryLevel = eml - itemData.circle * 5;
                itemData.skillIndex = Math.floor(ml / 10);
                itemData.masteryLevel = ml;
                itemData.skillBase = sb;
            }
        });
    }

    _generateArmorLocationMap(data) {
        // If there is no armor gear, don't make any changes to the armorlocations;
        // leave all custom values alone.  But if there is even one piece
        // of armor, then these calculations take over.
        if (!this.itemTypes.armorgear.length) return;

        // Initialize
        const armorMap = {};
        const ilMap = HM3.injuryLocations;
        Object.keys(ilMap).forEach((ilName) => {
            const name = ilMap[ilName].impactType;
            if (name != 'base' && name != 'custom') {
                armorMap[ilName] = {
                    name: name,
                    blunt: 0,
                    edged: 0,
                    piercing: 0,
                    fire: 0,
                    squeeze: 0,
                    tear: 0,
                    layers: ''
                };
            }
        });

        this.items.forEach((it) => {
            const itemData = it.system;

            if (it.type === ItemType.ARMORGEAR && itemData.isCarried && itemData.isEquipped) {
                // Go through all of the armor locations for this armor,
                // applying this armor's settings to each location

                // If locations doesn't exist, then just abandon and continue
                if (!itemData.hasOwnProperty('locations')) {
                    return;
                }

                itemData.locations.forEach((l) => {
                    // If the location is unknown, skip the rest
                    if (typeof armorMap[l] != 'undefined') {
                        const AQ = itemData.armorQuality | 0;
                        // Add this armor's protection to the location
                        if (itemData.hasOwnProperty('protection')) {
                            armorMap[l].blunt += Math.min(
                                2 * itemData.protection.blunt,
                                itemData.protection.blunt + AQ
                            );
                            armorMap[l].edged += Math.min(
                                2 * itemData.protection.edged,
                                itemData.protection.edged + AQ
                            );
                            armorMap[l].piercing += Math.min(
                                2 * itemData.protection.piercing,
                                itemData.protection.piercing + AQ
                            );
                            armorMap[l].fire += Math.min(2 * itemData.protection.fire, itemData.protection.fire + AQ);
                            armorMap[l].squeeze += Math.min(
                                2 * itemData.protection.squeeze,
                                itemData.protection.squeeze + AQ
                            );
                            armorMap[l].tear += Math.min(2 * itemData.protection.tear, itemData.protection.tear + AQ);
                        } else {
                            console.warn(`HM3 | item has no 'protection' property`);
                        }

                        // if a material has been specified, add it to the layers
                        if (itemData.material.length > 0) {
                            if (armorMap[l].layers.length > 0) {
                                armorMap[l].layers += ', ';
                            }
                            let AQBonus = '';
                            if (AQ !== 0) AQBonus = (AQ > 0 ? '+' : '-') + Math.abs(AQ);
                            armorMap[l].layers += itemData.material + AQBonus;
                        }
                    }
                });
            }
        });

        // Remove empty items from armormap

        // For efficiency, convert the map into an Array
        const armorArray = Object.values(armorMap);

        // We now have a full map of all of the armor, let's apply it to
        // existing armor locations
        this.items.forEach((it) => {
            const itemData = it.system;
            if (it.type === ItemType.ARMORLOCATION) {
                let armorProt = armorArray.find((a) => a.name === itemData.impactType);

                // We will ignore any armorProt if there is no armor values specified
                if (armorProt) {
                    itemData.blunt = armorProt.blunt;
                    itemData.edged = armorProt.edged;
                    itemData.piercing = armorProt.piercing;
                    itemData.fire = armorProt.fire;
                    itemData.layers = armorProt.layers;
                }
            }
        });
    }

    async skillDevRoll(item, showChatMsg = true) {
        const result = await DiceHM3.sdrRoll(item, showChatMsg);

        if (result?.sdrIncr) {
            // Characters may begin selecting specialties when a skill reaches ML 40 (SKILLS 2)
            if (item.type === ItemType.SKILL && result.sdrIncr === 2) {
                if (item.system.masteryLevel < 40) {
                    await game.hm3.GmSays({
                        text: `<h4>${this.name}: ${item.name}</h4>` + game.i18n.localize('hm3.SDR.SkillSpecialty'),
                        source: 'SKILLS 2'
                    });
                    return false;
                }
            }

            await item.update({
                'system.improveFlag': 0,
                'system.masteryLevel': +item.system.masteryLevel + (result.sdrIncr === 2 ? 2 : 1)
            });
            return true;
        } else {
            await item.update({'system.improveFlag': 0});
            return false;
        }
    }

    static chatListeners(html) {
        html.on('click', '.card-buttons button', this._onChatCardAction.bind(this));
    }

    static async _onChatCardAction(event) {
        event.preventDefault();
        const button = event.currentTarget;
        button.disabled = true;
        const action = button.dataset.action;
        const injuryLevel = button.dataset.injuryLevel;

        let actor = null;
        if (button.dataset.actorId) {
            actor = game.actors.get(button.dataset.actorId);
            if (!actor) {
                console.warn(`HM3 | Action=${action}; Cannot find actor ${button.dataset.actorId}`);
                button.disabled = false;
                return null;
            }
        }
        let token = null;
        if (button.dataset.tokenId) {
            token = canvas.tokens.get(button.dataset.tokenId);
            if (!token) {
                console.warn(`HM3 | Action=${action}; Cannot find token ${button.dataset.tokenId}`);
                button.disabled = false;
                return null;
            }
        }

        if (!actor && token) {
            actor = token.actor;
        }

        let atkToken = null;
        if (button.dataset.atkTokenId) {
            atkToken = canvas.tokens.get(button.dataset.atkTokenId);
            if (!atkToken) {
                console.warn(`HM3 | Action=${action}; Cannot find attack token ${button.dataset.atkTokenId}`);
                button.disabled = false;
                return null;
            }
        }

        let defToken = null;
        if (button.dataset.defTokenId) {
            defToken = canvas.tokens.get(button.dataset.defTokenId);
            if (!defToken) {
                console.warn(`HM3 | Action=${action}; Cannot find defense token ${button.dataset.defTokenId}`);
                button.disabled = false;
                return null;
            }
        }

        let opponentToken = null;
        if (button.dataset.opponentTokenId) {
            opponentToken = canvas.tokens.get(button.dataset.opponentTokenId);
            if (!opponentToken) {
                console.warn(`HM3 | Action=${action}; Cannot find opponent token ${button.dataset.opponentTokenId}`);
                button.disabled = false;
                return null;
            }
        }

        switch (action) {
            case 'injury':
                macros.injuryRoll(token.actor, {
                    actor: token.actor,
                    aim: button.dataset.aim,
                    aspect: button.dataset.aspect,
                    atkToken,
                    attackerId: button.dataset.atkTokenId,
                    attackWeapon: button.dataset.attackWeapon,
                    impact: button.dataset.impact,
                    items: token.actor.items,
                    token,
                    tokenId: token.id
                });
                break;

            case 'ata-attack':
            case 'dta-attack':
            case 'ota-attack':
                macros.weaponAttack(null, false, atkToken, true);
                break;

            case 'dodge':
                return macros.dodgeResume(
                    atkToken.id,
                    defToken.id,
                    button.dataset.weaponType,
                    button.dataset.weapon,
                    button.dataset.effAml,
                    button.dataset.aim,
                    button.dataset.aspect,
                    button.dataset.impactMod,
                    button.dataset.grappleAtk === 'true',
                    event.shiftKey || event.ctrlKey || event.altKey
                );
                break;

            case 'ignore':
                macros.ignoreResume(
                    atkToken.id,
                    defToken.id,
                    button.dataset.weaponType,
                    button.dataset.weapon,
                    button.dataset.effAml,
                    button.dataset.aim,
                    button.dataset.aspect,
                    button.dataset.impactMod,
                    button.dataset.grappleAtk === 'true',
                    event.shiftKey || event.ctrlKey || event.altKey
                );
                break;

            case 'block':
                macros.blockResume(
                    atkToken.id,
                    defToken.id,
                    button.dataset.weaponType,
                    button.dataset.weapon,
                    button.dataset.effAml,
                    button.dataset.aim,
                    button.dataset.aspect,
                    button.dataset.impactMod,
                    button.dataset.grappleAtk === 'true',
                    event.shiftKey || event.ctrlKey || event.altKey
                );
                break;

            case 'counterstrike':
                macros.meleeCounterstrikeResume(
                    atkToken.id,
                    defToken.id,
                    button.dataset.weapon,
                    button.dataset.effAml,
                    button.dataset.aim,
                    button.dataset.aspect,
                    button.dataset.impactMod,
                    button.dataset.grappleAtk === 'true',
                    event.shiftKey || event.ctrlKey || event.altKey
                );
                break;

            case 'esoteric':
                macros.esotericResume(
                    atkToken.id,
                    defToken.id,
                    button.dataset.weapon,
                    button.dataset.effAml,
                    event.shiftKey || event.ctrlKey || event.altKey
                );
                break;

            case 'shock':
                macros.shockRoll(false, actor, token);
                break;

            case 'willshock':
                macros.willShockRoll({
                    atkToken,
                    attackerId: button.dataset.atkTokenId,
                    attackWeapon: button.dataset.attackWeapon,
                    impact: button.dataset.impact,
                    items: token.actor.items,
                    myActor: token.actor,
                    noDialog: event.shiftKey || event.ctrlKey || event.altKey,
                    token,
                    tokenId: token.id
                });
                break;

            case 'kill':
                macros.killRoll({myActor: actor, token, injuryLevel});
                break;

            case 'stumble':
                macros.stumbleRoll(false, actor, opponentToken, token);
                break;

            case 'fumble':
                macros.fumbleRoll(false, actor, opponentToken, token);
                break;

            case 'throwdown':
                macros.throwDownRoll(
                    atkToken.id,
                    defToken.id,
                    Number(button.dataset.atkDice),
                    Number(button.dataset.defDice)
                );
                break;

            case 'falling':
                macros.fallingRoll(false, actor, token);
                break;

            default:
                console.warn(`HM3 | Action=${action}; No handler for this action`);
                break;
        }

        button.disabled = false;
    }

    /**
     * This method implements Item-based effects.  It applies three types of AE:
     *   Skill EML - Modifies the EML of a specific Skill (or Psionic talent)
     *
     * Note that unlike normal Active Effects, these effects apply to the Itens data model,
     * not the Actor's data model.
     *
     * The "value" field should look like "<item name>:<magnitude>"
     */
    _applySkillActiveEffects() {
        const ownedItems = this.items;
        const changes = this.allApplicableEffects(true).reduce((chgs, e) => {
            if (e.disabled || e.duration?.startTime > game.time.worldTime) return chgs;
            const emlChanges = e.changes.filter((chg) => {
                if (chg.key === 'system.eph.itemEMLMod') {
                    const val = utility.parseAEValue(chg.value);
                    if (val.length != 2) return false;
                    const magnitude = Number.parseFloat(val[1]);
                    if (isNaN(magnitude)) return false;
                    const skillName = val[0];
                    return Array.from(ownedItems).some(
                        (i) => i.name === skillName && (i.type === ItemType.SKILL || i.type === ItemType.PSIONIC)
                    );
                } else {
                    return false;
                }
            });

            return chgs.concat(
                emlChanges.map((c) => {
                    c = foundry.utils.duplicate(c);
                    const val = utility.parseAEValue(c.value);
                    const itemName = val[0];
                    c.value = utility.truncate(Number.parseFloat(val[1]));
                    c.key = 'system.effectiveMasteryLevel';
                    c.item = this.itemTypes.skill.find((it) => it.name === itemName);
                    if (!c.item) c.item = this.itemTypes.psionic.find((it) => it.name === itemName);
                    c.effect = e;
                    c.priority = c.priority ?? c.mode * 10;
                    return c;
                })
            );
        }, []);
        changes.sort((a, b) => a.priority - b.priority);

        // Apply all changes
        for (let change of changes) {
            if (!change.item) continue; // THIS IS AN ERROR; Should generate an error
            change.effect.apply(change.item, change);
            this.roundChange(change.item, change);
        }
    }

    /**
     * This method implements Item-based weapon effects.  It applies two types of AE:
     *   Weapon Attack ML - Modifies the AML of a single weapon
     *   Weapon Defense ML - Modifies the DML of a single weapon
     *
     * Note that unlike normal Active Effects, these effects apply to the Items data model,
     * not the Actor's data model.
     *
     * The "value" field should look like "<item name>:<magnitude>"
     */
    _applyWeaponActiveEffects() {
        const changes = this.allApplicableEffects(true).reduce((chgs, e) => {
            if (e.disabled || e.duration?.startTime > game.time.worldTime) return chgs;
            const amlChanges = e.changes.filter((chg) => {
                if (chg.key === 'system.eph.itemAMLMod') {
                    const val = utility.parseAEValue(chg.value);
                    if (val.length != 2) return false;
                    const magnitude = Number.parseInt(val[1], 10);
                    if (isNaN(magnitude)) return false;
                    const skillName = val[0];
                    for (let item of this.items.contents) {
                        if (
                            item.name === skillName &&
                            (item.type === ItemType.WEAPONGEAR || item.type === ItemType.MISSILEGEAR)
                        )
                            return true;
                    }
                }

                return false;
            });

            const dmlChanges = e.changes.filter((chg) => {
                if (chg.key === 'system.eph.itemDMLMod') {
                    const val = utility.parseAEValue(chg.value);
                    if (val.length != 2) return false;
                    const magnitude = Number.parseInt(val[1], 10);
                    if (isNaN(magnitude)) return false;
                    const skillName = val[0];
                    for (let item of this.items.contents) {
                        if (item.name === skillName && item.type === ItemType.WEAPONGEAR) return true;
                    }
                }

                return false;
            });

            const allChanges = amlChanges.concat(dmlChanges);
            return chgs.concat(
                allChanges.map((c) => {
                    c = foundry.utils.duplicate(c);
                    const val = utility.parseAEValue(c.value);
                    const itemName = val[0];
                    c.value = Number.parseInt(val[1], 10);
                    switch (c.key) {
                        case 'system.eph.itemAMLMod':
                            c.key = 'system.attackMasteryLevel';
                            c.item = this.itemTypes.weapongear.find((it) => it.name === itemName);
                            if (!c.item) c.item = this.itemTypes.missilegear.find((it) => it.name === itemName);
                            break;

                        case 'system.eph.itemDMLMod':
                            c.key = 'system.defenseMasteryLevel';
                            c.item = this.itemTypes.weapongear.find((it) => it.name === itemName);
                            break;
                    }

                    c.effect = e;
                    c.priority = c.priority ?? c.mode * 10;
                    return c;
                })
            );
        }, []);
        changes.sort((a, b) => a.priority - b.priority);

        // Apply all changes
        for (let change of changes) {
            if (!change.item) continue; // THIS IS AN ERROR; Should generate an error
            change.effect.apply(change.item, change);
            this.roundChange(change.item, change);
        }
    }

    roundChange(item, change) {
        const current = foundry.utils.getProperty(item, change.key) ?? null;
        const ct = foundry.utils.getType(current);
        if (ct === 'number' && !Number.isInteger(current)) {
            const update = Math.round(current + Number.EPSILON);
            foundry.utils.setProperty(item, change.key, update);
            return update;
        } else {
            return current;
        }
    }

    /**
     * This method searches through all the active effects on this actor and applies
     * only that active effect whose key matches the specified 'property' value.
     *
     * The purpose is to allow an active effect to be applied after normal active effect
     * processing is complete.
     *
     * @param {String} property The Actor data model property to apply
     */
    applySpecificActiveEffect(property) {
        const overrides = {};

        // Organize non-disabled effects by their application priority
        const changes = this.allApplicableEffects(true).reduce((chgs, e) => {
            if (e.disabled || e.duration?.startTime > game.time.worldTime) return chgs;
            const chgList = e.changes.filter((chg) => chg.key === property);
            return chgs.concat(
                chgList.map((c) => {
                    c = foundry.utils.duplicate(c);
                    c.effect = e;
                    c.priority = c.priority ?? c.mode * 10;
                    return c;
                })
            );
        }, []);
        changes.sort((a, b) => a.priority - b.priority);

        // Apply all changes
        for (let change of changes) {
            change.effect.apply(this, change);
            const result = this.roundChange(this, change);
            if (result !== null) overrides[change.key] = result;
        }

        // Expand the set of final overrides
        foundry.utils.mergeObject(this.overrides, foundry.utils.expandObject(overrides));
    }

    /**
     * This method applys a blanket skill AE modifier to all skills of a particular type.
     * For instance, if the skill is a communication skill, then it will apply the
     * data.eph.commSkillsMod modifier to the effectiveMasteryLevel for that skill.
     *
     * @param {ItemHM3} skill The item representing the skill to apply the active effect to.
     */
    applySkillTypeActiveEffect(skill) {
        const skillData = skill.system;
        // Organize non-disabled effects by their application priority
        const changes = this.allApplicableEffects(true).reduce((chgs, e) => {
            if (e.disabled || e.duration?.startTime > game.time.worldTime) return chgs;
            if (![ItemType.SKILL, ItemType.PSIONIC].includes(skill.type)) return chgs;
            const skillChanges = e.changes.filter(
                (chg) =>
                    (chg.key === 'system.eph.commSkillsMod' && skillData.type === SkillType.COMMUNICATION) ||
                    (chg.key === 'system.eph.physicalSkillsMod' && skillData.type === SkillType.PHYSICAL) ||
                    (chg.key === 'system.eph.combatSkillsMod' && skillData.type === SkillType.COMBAT) ||
                    (chg.key === 'system.eph.craftSkillsMod' && skillData.type === SkillType.CRAFT) ||
                    (chg.key === 'system.eph.ritualSkillsMod' && skillData.type === SkillType.RITUAL) ||
                    (chg.key === 'system.eph.magicSkillsMod' && skillData.type === SkillType.MAGIC) ||
                    (chg.key === 'system.eph.psionicTalentsMod' && skill.type === ItemType.PSIONIC)
            );
            return chgs.concat(
                skillChanges.map((c) => {
                    c = foundry.utils.duplicate(c);
                    c.key = 'system.effectiveMasteryLevel';
                    c.effect = e;
                    c.priority = c.priority ?? c.mode * 10;
                    return c;
                })
            );
        }, []);
        changes.sort((a, b) => a.priority - b.priority);

        // Apply all changes
        for (let change of changes) {
            change.effect.apply(skill, change);
            this.roundChange(skill, change);
        }
    }

    /*    applyWeaponActiveEffect(weapon) {
        // Organize non-disabled effects by their application priority
        const changes = this.effects.reduce((chgs, e) => {
            if (e.disabled) return chgs;
            if (![ItemType.WEAPONGEAR, ItemType.MISSILEGEAR].includes(weapon.type)) return chgs;
            const weaponChanges = e.changes.filter(
                chg => ['system.eph.meleeAMLMod', 'system.eph.meleeDMLMod', 'system.eph.missileAMLMod'].includes(chg.key));
            return chgs.concat(weaponChanges.map(c => {
                c = foundry.utils.duplicate(c);
                c.key = c.key === 'system.eph.meleeDMLMod' ? 'system.defenseMasteryLevel' : 'system.attackMasteryLevel';
                c.effect = e;
                c.priority = c.priority ?? (c.mode * 10);
                return c;
            }));
        }, []);
        changes.sort((a, b) => a.priority - b.priority);

        // Apply all changes
        for (let change of changes) {
            change.effect.apply(weapon, change);
            this.roundChange(weapon, change);
        }
    }
*/

    /**
     * Run a custom macro assigned to this item.
     *
     * Returns an object with the following fields:
     *
     * type: type of roll (ability-d6, ability-d100, shock, stumble, fumble, dodge, healing)
     * title: Chat label for Roll,
     * origTarget: Unmodified target value,
     * modifier: Modifier added to origTarget value,
     * modifiedTarget: Final modified target value,
     * rollValue: roll number,
     * isSuccess: is roll successful,
     * isCritical: is roll critical,
     * result: 'MS', 'CS', 'MF', 'CF',
     * description: textual description of roll success or failure,
     * notes: rendered notes,
     */
    async runCustomMacro(rollInput) {
        if (!rollInput) return null;

        const actorData = this.system;
        const rollResult = {
            type: rollInput.type,
            title: rollInput.title,
            origTarget: rollInput.origTarget,
            modifier: (rollInput.plusMinus === '-' ? -1 : 1) * rollInput.modifier,
            modifiedTarget: rollInput.modifiedTarget,
            rollValue: rollInput.rollValue,
            isSuccess: rollInput.isSuccess,
            isCritical: rollInput.isCritical,
            result: rollInput.isSuccess ? (rollInput.isCritical ? 'CS' : 'MS') : rollInput.isCritical ? 'CF' : 'MF',
            description: rollInput.description,
            notes: rollInput.notes
        };

        if (!actorData.macros.command) return null;

        const macro = await Macro.create(
            {
                name: `${this.name} ${this.type} macro`,
                type: actorData.macros.type,
                scope: 'global',
                command: actorData.macros.command
            },
            {temporary: true}
        );
        if (!macro) {
            console.error(
                `HM3 | Failure initializing macro '${this.name} ${this.type} macro', type=${actorData.system.macros.type}, command='${actorData.system.macros.command}'`
            );
            return null;
        }

        const token = this.isToken ? this.token : null;

        return utility.executeMacroScript(macro, {
            actor: this,
            token: token,
            rollResult: rollResult
        });
    }

    static _normalcdf(x) {
        var t = 1 / (1 + 0.2316419 * Math.abs(x));
        var d = 0.3989423 * Math.exp((-x * x) / 2);
        var prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        if (x > 0) {
            prob = 1 - prob;
        }
        return prob;
    }

    static normProb(z, mean, sd) {
        let prob;
        if (sd == 0) {
            prob = z < mean ? 0 : 100;
        } else {
            prob = Math.round(ActorHM3._normalcdf((z - mean) / sd) * 100);
        }

        return prob;
    }

    static calcUniversalPenalty(actor) {
        const data = actor.system;
        data.universalPenalty = data.eph.totalInjuryLevels + (data.eph.fatigue || 0);
        return data.universalPenalty;
    }

    static calcPhysicalPenalty(actor) {
        const data = actor.system;
        data.physicalPenalty = data.universalPenalty + data.encumbrance;
        return data.physicalPenalty;
    }

    static calcShockIndex(actor) {
        const data = actor.system;
        const old = data.shockIndex.value;

        if (actor.hasCondition(Condition.INANIMATE)) {
            data.shockIndex.value = Math.max(100 - Math.round(100 * (data.totalInjuryLevels / data.endurance)), 0);
        } else {
            data.shockIndex.value = ActorHM3.normProb(
                data.endurance,
                data.universalPenalty * 3.5,
                data.universalPenalty
            );
        }

        if (actor.testUserPermission(game.user, 'OWNER')) {
            if (data.shockIndex.value !== old) {
                actor.update({'system.shockIndex': data.shockIndex}).then(() => {
                    Hooks.call('hm3.onCalcShockIndex', actor, old, data.shockIndex.value);
                    Hooks.call('hm3.onShockIndexChanged', actor, old, data.shockIndex.value);
                    if (data.shockIndex.value < old) {
                        Hooks.call('hm3.onShockIndexReduced', actor, old, data.shockIndex.value);
                    } else if (data.shockIndex.value > old) {
                        Hooks.call('hm3.onShockIndexIncreased', actor, old, data.shockIndex.value);
                    }
                });
            } else {
                Hooks.call('hm3.onCalcShockIndex', actor, old, data.shockIndex.value);
            }
        }
    }
}
