import {onManageActiveEffect} from '../effect.js';
import {ItemType} from '../hm3-types.js';
import * as utility from '../utility.js';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ItemSheetHM3 extends ItemSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['hm3', 'sheet', 'item'],
            width: 605,
            height: 560,
            tabs: [{navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'properties'}]
        });
    }

    /** @override */
    get template() {
        const path = 'systems/hm3/templates/item';
        return `${path}/${this.item.type}-sheet.hbs`;
    }

    /* -------------------------------------------- */

    /** @override */
    async getData(options = {}) {
        const data = super.getData(options);
        data.hasDescription = 'description' in this.object.system;
        if (data.hasDescription) {
            data.descriptionHTML = await TextEditor.enrichHTML(this.object.system.description, {
                secrets: game.user.isGM,
                relativeTo: this.object.system
            });
        }

        // Re-define the template data references (backwards compatible)
        data.item = this.item;
        data.idata = this.item.system;
        data.config = CONFIG.HM3;
        data.itemType = this.item.type;
        data.hasActor = this.actor && true;
        data.hasCombatSkills = false;
        data.hasRitualSkills = false;
        data.hasMagicSkills = false;
        data.isGM = game.user.isGM;
        data.strictMode = game.settings.get('hm3', 'strictGmMode');
        data.hasRwPermission = data.isGM || !data.strictMode;
        data.isGridDistanceUnits = game.settings.get('hm3', 'distanceUnits') === 'grid';
        data.idata.wqModifier = data.idata.wqModifier | 0;

        // if (data.itemType === ItemType.ARMORGEAR) {
        //     if (!data.idata.baseValue) data.idata.baseValue = data.idata.value;
        //     data.idata.value = Math.ceil(data.idata.baseValue * 2 ** data.idata.armorQuality * game.hm3.config.sizes[data.idata.size]);
        // }

        data.macroTypes = [
            {key: 'chat', label: 'Chat'},
            {key: 'script', label: 'Script'}
        ];

        data.containers = [{label: 'On Person', key: 'on-person'}];
        // Containers are not allowed in other containers.  So if this item is a container,
        // don't show any other containers.

        if (this.actor && this.item.type !== ItemType.CONTAINERGEAR) {
            this.actor.items.forEach((it) => {
                if (it.type === 'containergear') {
                    data.containers.push({label: it.name, key: it.id});
                }
            });
        }

        // Fill appropriate lists for individual item sheets
        if (this.item.type === ItemType.SPELL) {
            // Spells need a list of convocations
            data.convocations = [];
            if (this.actor) {
                this.actor.itemTypes.skill.forEach((it) => {
                    if (it.system.type === 'Magic') {
                        data.convocations.push(it.name);
                        data.hasMagicSkills = true;
                    }
                });
            }
        } else if (this.item.type === ItemType.INVOCATION) {
            // Invocations need a list of dieties
            data.dieties = [];
            if (this.actor) {
                this.actor.itemTypes.skill.forEach((it) => {
                    if (it.system.type === 'Ritual') {
                        data.dieties.push(it.name);
                        data.hasRitualSkills = true;
                    }
                });
            }
        } else if (this.item.type === ItemType.WEAPONGEAR || this.item.type === ItemType.MISSILEGEAR) {
            // Weapons need a list of combat skills
            data.combatSkills = [];

            if (this.actor) {
                if (this.item.type === ItemType.WEAPONGEAR) {
                    // For weapons, we add a "None" item to the front of the list
                    // as a default (in case no other combat skill applies)
                    data.combatSkills.push({key: 'None'});
                } else {
                    // For missiles, we add the "Throwing" skill to the front
                    // of the list as a default (in case no other combat
                    // skill applies)
                    data.combatSkills.push({key: 'Throwing'});
                }

                this.actor.itemTypes.skill.forEach((it) => {
                    if (it.system.type === 'Combat') {
                        const lcName = it.name.toLowerCase();
                        // Ignore the 'Dodge' and 'Initiative' skills,
                        // since you never want a weapon based on those skills.
                        if (!(lcName === 'initiative' || lcName === 'dodge')) {
                            data.combatSkills.push({key: it.name});
                            data.hasCombatSkills = true;
                        }
                    }
                });
            }
        } else if (this.item.type === ItemType.TRAIT) {
            if (data.idata.type === 'Psyche') {
                data.isPsycheTrait = true;
                if (isNaN(parseInt(data.idata.severity))) data.idata.severity = 5;
            }
        } else if (this.item.type === ItemType.CONTAINERGEAR) {
            if (data.idata.type === undefined) data.idata.type = 'Container';
        } else if (this.item.type === ItemType.SKILL) {
            if (this.item.name.includes('Riding')) {
                const ridingImg = new Map(game.hm3.config.combatSkillIcons).get('riding');
                const steeds = this.actor.getSteeds();
                data.steeds = [
                    {key: '', label: `No Steed`},
                    ...steeds.map((steed) => {
                        return {key: steed.uuid, label: steed.name};
                    })
                ];
                data.isRiding = true;
                data.mounted = this.actor.system.mounted;

                // Steed linked to Riding skill according to COMBAT 20
                if (!!this.item.system.actorUuid && this.item.img === ridingImg) {
                    const steed = fromUuidSync(this.item.system.actorUuid);
                    if (steed) {
                        this.item.img = steed.img;
                        this.item.name += '/' + steed.name;
                    }
                } else if (!this.item.system.actorUuid && this.item.img !== ridingImg) {
                    this.item.img = ridingImg;
                    this.item.name = 'Riding';
                    this.item.actor.update({'system.mounted': false});
                }
            }
        }

        if (data.isGridDistanceUnits && !!data.idata.range) {
            data.rangeGrid = {
                short: data.idata.range.short / canvas.dimensions.distance,
                medium: data.idata.range.medium / canvas.dimensions.distance,
                long: data.idata.range.long / canvas.dimensions.distance,
                extreme: data.idata.range.extreme / canvas.dimensions.distance
            };
        }

        data.effects = {};
        this.item.effects.forEach((effect) => {
            data.effects[effect.id] = {
                'changes': utility.aeChanges(effect),
                'disabled': effect.disabled,
                'duration': utility.aeDuration(effect),
                'id': effect.id,
                'img': effect.img,
                'name': effect.name,
                'sourceName': effect.sourceName
            };
        });

        if (
            game.hm3.config.esotericCombatItems.attack.includes(this.item.name) ||
            game.hm3.config.esotericCombatItems.defense.includes(this.item.name)
        ) {
            data.isEsotericCombat = true;
        }

        return data;
    }

    /* -------------------------------------------- */

    /** @override */
    setPosition(options = {}) {
        const position = super.setPosition(options);
        const sheetBody = this.element.find('.sheet-body');
        const bodyHeight = position.height - 192;
        sheetBody.css('height', bodyHeight);
        return position;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        if (!game.user.isGM) {
            html.find('.profile-img').click(async (ev) => {
                new ImagePopout(this.item.img, {
                    title: this.item.name,
                    uuid: this.item.uuid
                }).render(true);
            });
        }

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // Roll handlers, click handlers, etc. go here.

        html.on('click', "input[type='number']", (ev) => {
            ev.currentTarget.select();
        });

        html.on('click', "input[type='text']", (ev) => {
            ev.currentTarget.select();
        });

        html.on('keypress', '.properties', (ev) => {
            var keycode = ev.keyCode ? ev.keyCode : ev.which;
            if (keycode == '13') {
                super.close();
            }
        });

        html.find('.effect-control').click((ev) => {
            onManageActiveEffect(ev, this.item);
        });

        // Add Inventory Item
        html.find('.armorgear-location-add').click(this._armorgearLocationAdd.bind(this));

        // Delete Inventory Item
        html.find('.armorgear-location-delete').click(this._armorgearLocationDelete.bind(this));
    }

    async _armorgearLocationAdd(event) {
        const dataset = event.currentTarget.dataset;
        const itemData = this.item.system;

        await this._onSubmit(event); // Submit any unsaved changes

        // Clone the existing locations list if it exists, otherwise set to empty array
        let locations = [];
        if (typeof itemData.locations != 'undefined') {
            locations = [...itemData.locations];
        }

        // Only add location to list if it is unique
        if (locations.indexOf(dataset.location) === -1) {
            locations.push(dataset.location);
        }

        // Update the list on the server
        return this.item.update({'system.locations': locations});
    }

    async _armorgearLocationDelete(event) {
        const dataset = event.currentTarget.dataset;
        const itemData = this.item.system;

        await this._onSubmit(event); // Submit any unsaved changes

        // Clone the location list (we don't want to touch the actual list)
        let locations = [...itemData.locations];

        // find the index of the item to remove, and if found remove it from list
        let removeIndex = locations.indexOf(dataset.location);
        if (removeIndex >= 0) {
            locations.splice(removeIndex, 1);
        }

        // Update the list on the server
        return this.item.update({'system.locations': locations});
    }
}
