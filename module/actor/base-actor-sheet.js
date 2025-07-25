import {onManageActiveEffect} from '../effect.js';
import {ActorType, ItemType} from '../hm3-types.js';
import {onManageMacro} from '../macro.js';
import * as macros from '../macros.js';
import * as utility from '../utility.js';

/**
 * Extend the basic ActorSheet with some common capabilities
 * @extends {ActorSheet}
 */
export class HarnMasterBaseActorSheet extends ActorSheet {
    /** @override */
    async getData(options = {}) {
        if (!this.actor.system.eph.stumbleTarget) {
            // sometimes it is not initialized correctly
            this.actor.prepareDerivedData();
        }

        let isOwner = this.document.isOwner;
        const data = {
            config: CONFIG.HM3,
            cssClass: isOwner ? 'editable' : 'locked',
            editable: this.isEditable,
            isCharacter: this.document.type === 'character',
            isCharacterMancer: this.actor.getFlag('hm3', 'CharacterMancer') || false,
            isContainer: this.document.type === 'container',
            isCreature: this.document.type === 'creature',
            limited: this.document.limited,
            options: this.options,
            owner: isOwner
        };

        data.hasDescription = 'description' in this.object.system;
        if (data.hasDescription) {
            data.descriptionHTML = await TextEditor.enrichHTML(this.object.system.description, {
                secrets: game.user.isGM,
                relativeTo: this.object.system
            });
        }

        data.isGM = game.user.isGM;
        data.strictMode = game.settings.get('hm3', 'strictGmMode');
        data.hasRwPermission = data.isGM || !data.strictMode;
        data.isGridDistanceUnits = game.settings.get('hm3', 'distanceUnits') === 'grid';
        data.customSunSign = game.settings.get('hm3', 'customSunSign');
        data.actor = foundry.utils.deepClone(this.actor);

        let totalWeightHigh = 0;
        let totalWeightMid = 0;
        let totalWeightLow = 0;
        this.actor.items.forEach((it) => {
            if (it.type === ItemType.ARMORLOCATION) {
                totalWeightHigh += it.system.probWeight['high'];
                totalWeightMid += it.system.probWeight['mid'];
                totalWeightLow += it.system.probWeight['low'];
            }
        });
        totalWeightHigh /= 100;
        totalWeightMid /= 100;
        totalWeightLow /= 100;

        data.items = (
            await Promise.all(
                this.actor.items.map(async (i) => {
                    // A new, truncated number is created so that weights with many decimal places (e.g. dram) are also displayed nicely.
                    if (
                        [
                            ItemType.ARMORGEAR,
                            ItemType.CONTAINERGEAR,
                            ItemType.EFFECT,
                            ItemType.MISCGEAR,
                            ItemType.MISSILEGEAR,
                            ItemType.WEAPONGEAR
                        ].includes(i.type)
                    ) {
                        i.system.weightT = utility.truncate(i.system.weight, 3);
                    }
                    //
                    if (i.type === ItemType.ARMORLOCATION) {
                        i.probHigh = utility.truncate(i.system.probWeight.high / totalWeightHigh, 1);
                        i.probMid = utility.truncate(i.system.probWeight.mid / totalWeightMid, 1);
                        i.probLow = utility.truncate(i.system.probWeight.low / totalWeightLow, 1);
                    }
                    // Dormant psionic talents may be invisible for players (ML20 or less (Psionics 3))
                    if (i.type === ItemType.PSIONIC) {
                        i.system.visible = String(
                            !game.settings.get('hm3', 'dormantPsionicTalents') ||
                                i.system.masteryLevel > 20 ||
                                game.user.isGM
                        );
                    }
                    //
                    if (i.type === ItemType.TRAIT) {
                        if (i.system.type === 'Psyche') {
                            const sev =
                                data.config.psycheSeverity.find((v) => v.key === parseInt(i.system.severity))?.label ||
                                'Mild';
                            i.psycheName = sev + ' ' + i.name;
                        }
                    }
                    //
                    if (i.type === ItemType.COMPANION) {
                        const companion = fromUuidSync(i.system.actorUuid);
                        if (companion) {
                            i.gender = companion.system.gender || 'Male';
                            i.img = companion.img;
                            i.linkToActor = companion.link;
                            i.name = companion.name;
                            i.occupation = companion.system.occupation || 'Unknown';
                            i.species = companion.system.species || 'Unknown';
                        }
                    }

                    // The range can also be displayed in grids (hex). Can be changed in the settings.
                    if (i.type === ItemType.MISSILEGEAR) {
                        if (data.isGridDistanceUnits) {
                            i.system.rangeGrid = {
                                short: i.system.range.short / canvas.dimensions.distance,
                                medium: i.system.range.medium / canvas.dimensions.distance,
                                long: i.system.range.long / canvas.dimensions.distance,
                                extreme: i.system.range.extreme / canvas.dimensions.distance
                            };
                        }
                    }

                    if (i.type === ItemType.WEAPONGEAR) {
                        i.wq = i.system.weaponQuality + (i.system.wqModifier | 0);
                    }

                    return i;
                })
            )
        ).filter((item) => item.type !== ItemType.EFFECT || game.user.isGM);
        data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

        data.adata = data.actor.system;
        data.labels = this.actor.labels || {};
        data.filters = this._filters;

        data.macroTypes = [
            {key: 'chat', label: 'Chat'},
            {key: 'script', label: 'Script'}
        ];

        data.dtypes = ['String', 'Number', 'Boolean'];
        let capacityMax = 0;
        let capacityVal = 0;
        if (this.actor.type === ActorType.CHARACTER) {
            capacityMax = data.adata.endurance * 10;
            if (data.adata.eph) {
                capacityVal = data.adata.eph.totalGearWeight;
            }
        } else if (this.actor.type === ActorType.CREATURE) {
            capacityMax = data.adata.loadRating + data.adata.endurance * 10;
            if (data.adata.eph) {
                capacityVal = data.adata.eph.totalGearWeight;
            }
        } else if (this.actor.type === ActorType.CONTAINER) {
            capacityMax = data.adata.capacity.max;
            capacityVal = data.adata.capacity.value;
        }

        // Setup the fake container entry for "On Person" container
        data.containers = {
            'on-person': {
                'name': 'On Person',
                'type': ItemType.CONTAINERGEAR,
                'system': {
                    'container': 'on-person',
                    'collapsed': this.actor.getFlag('hm3', 'onPersonContainerCollapsed') || false,
                    'capacity': {
                        'max': capacityMax,
                        'value': capacityVal
                    }
                }
            }
        };

        this.actor.items.forEach((it) => {
            if (it.type === ItemType.CONTAINERGEAR) {
                data.containers[it.id] = it;
            }
        });

        data.gearTypes = {
            'armorgear': 'Armour',
            'containergear': 'Container',
            'effectgear': 'Effect',
            'miscgear': 'Misc. Gear',
            'missilegear': 'Missile Wpn',
            'weapongear': 'Melee Wpn'
        };

        // get active effects
        data.effects = {};
        this.actor.allApplicableEffects().forEach((effect) => {
            data.effects[effect.id] = {
                'changes': utility.aeChanges(effect),
                'disabled': effect.disabled,
                'duration': utility.aeDuration(effect),
                'id': effect.id,
                'img': effect.img,
                'name': effect.name,
                'source': effect,
                'sourceName': effect.sourceName
            };
        });

        // migrate legacy macro
        let macro = this.actor.macrolist.find((m) => m.getFlag('hm3', 'trigger') === 'legacy');
        if (!macro) {
            (async () => {
                macro = await Macro.create({
                    name: `${this.actor.name} Legacy Macro`,
                    type: this.actor.system.macros.type,
                    command: this.actor.system.macros.command,
                    folder: this.actor.macrofolder
                });
                await macro.setFlag('hm3', 'trigger', 'legacy');
                await macro.setFlag('hm3', 'ownerId', this.actor.id);
                this.actor.sheet.render();
            })();
        }

        // get macros
        data.adata.macrolist = this.actor.macrolist;
        data.adata.macrolist.map((m) => {
            m.trigger = game.macros.get(m.id)?.getFlag('hm3', 'trigger');
            m.ownerId = game.macros.get(m.id)?.getFlag('hm3', 'ownerId'); // currently not needed
        });
        data.adata.macrolist.sort((a, b) =>
            a?.name.toLowerCase() > b?.name.toLowerCase() ? 1 : b?.name.toLowerCase() > a?.name.toLowerCase() ? -1 : 0
        );

        // default species for character is 'Human'
        if (this.actor.type === ActorType.CHARACTER && data.adata.species.length === 0) data.adata.species = 'Human';

        // default size is '6'
        if (data.adata.size === undefined) data.adata.size = '6';

        data.hasSteed = this.actor.hasLinkedSteed();

        // Check for esoteric attack options
        data.esotericAtkOptions = [];
        const mc = this.actor.items.find(
            (item) => item.type === ItemType.SKILL && item.name.includes('Mental Conflict') && item.system.isEquipped
        );
        data.hasEsotericAtk = !!mc; // TODO more to come
        if (data.hasEsotericAtk) {
            if (mc) data.esotericAtkOptions.push(mc);
        }

        return data;
    }

    /** @override */
    _onSortItem(event, itemData) {
        // TODO - for now, don't allow sorting for Synthetic Actors
        if (this.actor.isToken) return;

        if (!itemData.type.endsWith('gear')) return super._onSortItem(event, itemData);

        // Get the drag source and its siblings
        const source = this.actor.items.get(itemData._id);
        const siblings = this.actor.items.filter((i) => {
            return i.type.endsWith('gear') && i.id !== source.id;
        });

        // Get the drop target
        const dropTarget = event.target.closest('.item');
        const targetId = dropTarget ? dropTarget.dataset.itemId : null;
        const target = siblings.find((s) => s.id === targetId);

        // Ensure we are only sorting like-types
        if (target && !target.type.endsWith('gear')) return;

        // Perform the sort
        const sortUpdates = SortingHelpers.performIntegerSort(source, {target: target, siblings});
        const updateData = sortUpdates.map((u) => {
            const update = u.update;
            update._id = u.target._id;
            return update;
        });

        // Perform the update
        return this.actor.updateEmbeddedDocuments('Item', updateData);
    }

    /** @override */
    async _onDropActor(event, data) {
        if (!this.actor.isOwner) return false;

        const companion = await Actor.fromDropData(data);
        if (!companion || companion?.type === 'container') return false;
        if (this.actor.id === companion.id) {
            ui.notifications.warn('You cannot add yourself.');
            return false;
        }

        await this.actor.createEmbeddedDocuments('Item', [
            {
                name: companion.name,
                type: 'companion',
                system: {
                    actorUuid: companion.uuid
                }
            }
        ]);

        return true;
    }

    /** @override */
    async _onDropItem(event, data) {
        if (!this.actor.isOwner) return false;

        const droppedItem = await Item.fromDropData(data);

        // Check if coming from a compendium pack ||
        // Skills, spells, etc. (non-gear) ||
        // Gear coming from world items list
        if (droppedItem.pack || !droppedItem.type?.endsWith('gear') || !droppedItem.parent) {
            const closestContainer = event.target.closest('[data-container-id]');
            const destContainer = closestContainer?.dataset.containerId
                ? closestContainer.dataset.containerId
                : 'on-person';

            let newItem = await super._onDropItem(event, data);
            if (!newItem) return;
            newItem = newItem[0];
            // If the item is some type of gear (other than containergear), then
            // make sure we set the container to the same as the dropped location
            // (this allows people to move items into containers easily)
            if (newItem?.type?.endsWith('gear') && newItem?.type !== 'containergear') {
                if (newItem.system.container !== destContainer) {
                    await newItem.update({'system.container': destContainer});
                }
            }
        } else {
            // At this point we know the item is some sort of gear, and coming from an actor

            // Destination containerid: set to 'on-person' if a containerid can't be found
            const closestContainer = event.target.closest('[data-container-id]');
            const destContainer = closestContainer?.dataset.containerId
                ? closestContainer.dataset.containerId
                : 'on-person';

            // Dropping an item into the same actor (Token or Linked)
            if (
                (droppedItem.parent.isToken && this.actor.token?.id === droppedItem.parent.token.id) ||
                (!droppedItem.parent.isToken && !this.actor.isToken && droppedItem.parent.id === this.actor.id)
            ) {
                // If the item is some type of gear (other than containergear), then
                // make sure we set the container to the same as the dropped location
                // (this allows people to move items into containers easily)
                if (droppedItem.type.endsWith('gear') && droppedItem.type !== 'containergear') {
                    if (droppedItem.system.container !== destContainer) {
                        await droppedItem.update({'system.container': destContainer});
                    }
                }

                return super._onDropItem(event, data);
            }

            // At this point we know this dropped item is Gear coming from an actor,

            // Containers are a special case, and they need to be processed specially
            if (droppedItem.type === ItemType.CONTAINERGEAR) return this._moveContainer(event, droppedItem);

            // Set the destination container to the closest drop containerid
            droppedItem.system.container = destContainer;

            const quantity = droppedItem.system.quantity;

            // Source quantity really should never be 0 or negative; if so, just decline
            // the drop request.
            if (quantity <= 0) return false;

            if (quantity > 1) {
                // Ask how many to move
                return this._moveQtyDialog(event, droppedItem);
            } else {
                return this._moveItems(droppedItem, 1);
            }
        }
    }

    async _moveContainer(event, item) {
        // create new container

        if (!item.parent) {
            ui.notifications.warn(`Error accessing actor where container is coming from, move aborted`);
            throw Error(`Error accessing actor where container is coming from, move aborted`);
        }

        let itData = item.toObject;
        delete itData._id;
        const containerResult = await Item.create(itData, {parent: this.actor});
        if (!containerResult) {
            ui.notifications.warn(`Error while moving container, move aborted`);
            return null;
        }

        // move all items into new container
        let failure = false;
        for (let it of item.parent.items.values()) {
            if (!failure && it.system.container === data.id) {
                itData = it.toObject();
                delete itData._id;
                itData.system.container = containerResult.id;
                const result = await Item.create(itData, {parent: this.actor});
                if (result) {
                    await Item.deleteDocuments([it.id], {parent: item.parent});
                } else {
                    failure = true;
                }
            }
        }

        if (failure) {
            ui.notifications.error(
                `Error duing move of items from source to destination, container has been only partially moved!`
            );
            return null;
        }

        // delete old container
        await Item.deleteDocuments([data._id], {parent: item.parent});
        return containerResult;
    }

    async _moveQtyDialog(event, item) {
        // Get source actor
        if (!item.parent) {
            ui.notifications.warn(`Error accessing actor where container is coming from, move aborted`);
            throw Error(`Error accessing actor where container is coming from, move aborted`);
        }

        // Render modal dialog
        let dlgTemplate = 'systems/hm3/templates/dialog/item-qty.hbs';
        let dialogData = {
            itemName: item.name,
            sourceName: item.parent.name,
            targetName: this.actor.name,
            maxItems: item.system.quantity
        };

        const dlghtml = await renderTemplate(dlgTemplate, dialogData);

        // Create the dialog window
        return Dialog.prompt({
            title: 'Move Items',
            content: dlghtml,
            label: 'OK',
            callback: async (html) => {
                const form = html.querySelector('#items-to-move');
                const fd = new FormDataExtended(form);
                const formdata = fd.object;
                let formQtyToMove = parseInt(formdata.itemstomove);

                if (formQtyToMove <= 0) {
                    return false;
                } else {
                    return this._moveItems(item, formQtyToMove);
                }
            },
            options: {jQuery: false}
        });
    }

    async _moveItems(item, moveQuantity) {
        const sourceName = item.name;
        const sourceType = item.type;
        const sourceQuantity = item.system.quantity;

        if (!item.parent) {
            ui.notifications.warn(`Error accessing actor where container is coming from, move aborted`);
            return null;
        }

        // Look for a similar item locally
        let result = this.actor.items.find((it) => it.type === sourceType && it.name === sourceName);

        if (result) {
            // update quantity
            const newTargetQuantity = result.system.quantity + moveQuantity;
            await result.update({'system.quantity': newTargetQuantity});
        } else {
            // Create an item
            const itData = item.toObject();
            delete itData._id;

            itData.system.quantity = moveQuantity;
            itData.system.container = 'on-person';
            result = await Item.create(itData, {parent: this.actor});
        }

        if (result) {
            if (moveQuantity >= sourceQuantity) {
                await Item.deleteDocuments([item.id], {parent: item.parent});
            } else {
                const newSourceQuantity = sourceQuantity - moveQuantity;
                await item.update({'system.quantity': newSourceQuantity});
            }
        }
        return result;
    }

    /** @override */
    async _onDropItemCreate(itemData) {
        const actor = this.actor;
        if (!actor.isOwner) return false;

        if (!itemData.type.endsWith('gear')) {
            if (actor.type === ActorType.CONTAINER) {
                ui.notifications.warn(
                    `You may only place physical objects in a container; drop of ${itemData.name} refused.`
                );
                return false;
            }

            actor.items.forEach((it) => {
                // Generally, if the items have the same type and name,
                // then merge the dropped item onto the existing item.
                if (it.type === itemData.type && it.name === itemData.name) {
                    this.mergeItem(it, itemData);

                    // Don't actually allow the new item
                    // to be created.
                    return false;
                }
            });

            return Item.create(itemData, {parent: this.actor});
        }

        return super._onDropItemCreate(itemData);
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        if (!game.user.isGM) {
            html.find('.facade-image').click(async (ev) => {
                new ImagePopout(this.actor.system.bioImage, {
                    title: this.actor.name,
                    uuid: this.actor.uuid
                }).render(true);
            });

            html.find('.profile-img').click(async (ev) => {
                new ImagePopout(this.actor.img, {
                    title: this.actor.name,
                    uuid: this.actor.uuid
                }).render(true);
            });
        }

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        html.find('.character-mancer').click(async (ev) => {
            await this.actor.unsetFlag('hm3', 'CharacterMancer');
            this.actor.sheet.render();
        });

        // Add Inventory Item
        html.find('.item-create').click(this._onItemCreate.bind(this));

        // Update Inventory Item
        html.find('.item-edit, .gear-name').click((ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const item = this.actor.items.get(li.data('itemId'));
            item.sheet.render(true);
        });

        // Delete Inventory Item
        html.find('.item-delete').click(this._onItemDelete.bind(this));

        // Dump Esoteric Description to Chat
        html.find('.item-dumpdesc').click(this._onDumpEsotericDescription.bind(this));

        html.find('.item-minimize, .item-maximize').click(this._onContainerCollapse.bind(this));

        html.on('click', '.fff-name', (ev) => {
            const el = ev.currentTarget.querySelector('#companion'); //.dataset; // .innerText;
            if (!el) return;
            const uuid = el.dataset.itemActorUuid;
            const actor = fromUuidSync(uuid);
            actor.sheet.render(true);
        });

        html.on('click', '.item-name, .spell-name', (ev) => {
            switch (ev.currentTarget.innerText) {
                case 'Magic Spells':
                    ui.notifications.info('Magic Spells sorted!');
                    const convocations = new Map([
                        ['Fyvria', 1],
                        ['Jmorvi', 2],
                        ['Lyahvi', 3],
                        ['Odivshe', 4],
                        ['Peleahn', 5],
                        ['Savorya', 6],
                        ['Neutral', 7]
                    ]);
                    this.object.items.forEach(async (i) => {
                        if (i.type === ItemType.SPELL) {
                            await i.update({
                                'sort': Number(
                                    convocations.get(i.system.convocation).toString() +
                                        i.system.level.toString() +
                                        (i.name.toLowerCase().charCodeAt(0) - 87).toString() +
                                        (i.name.toLowerCase().charCodeAt(1) - 87).toString() +
                                        (i.name.toLowerCase().charCodeAt(2) - 87).toString() +
                                        ((i.name.toLowerCase().charCodeAt(3) | 97) - 87).toString() +
                                        ((i.name.toLowerCase().charCodeAt(4) | 97) - 87).toString()
                                )
                            });
                        }
                    });
                    break;

                case 'Ritual Invocations':
                    ui.notifications.info('Ritual Invocations sorted!');
                    this.object.items.forEach(async (i) => {
                        if (i.type === ItemType.INVOCATION) {
                            await i.update({
                                'sort': Number(
                                    i.system.circle.toString() +
                                        (i.name.toLowerCase().charCodeAt(0) - 87).toString() +
                                        (i.name.toLowerCase().charCodeAt(1) - 87).toString() +
                                        (i.name.toLowerCase().charCodeAt(2) - 87).toString() +
                                        ((i.name.toLowerCase().charCodeAt(3) | 97) - 87).toString() +
                                        ((i.name.toLowerCase().charCodeAt(4) | 97) - 87).toString()
                                )
                            });
                        }
                    });
                    break;

                case 'Psionic Talents':
                    ui.notifications.info('Psionic Talents sorted!');
                    this.object.items.forEach(async (i) => {
                        if (i.type === ItemType.PSIONIC) {
                            await i.update({
                                'sort': Number(
                                    (i.name.toLowerCase().charCodeAt(0) - 87).toString() +
                                        (i.name.toLowerCase().charCodeAt(1) - 87).toString() +
                                        (i.name.toLowerCase().charCodeAt(2) - 87).toString() +
                                        ((i.name.toLowerCase().charCodeAt(3) | 97) - 87).toString() +
                                        ((i.name.toLowerCase().charCodeAt(4) | 97) - 87).toString()
                                )
                            });
                        }
                    });
                    break;
            }
        });

        // Active Effect management
        html.find('.effect-control, .effect-name').click((ev) => onManageActiveEffect(ev, this.document));

        // Macro management
        html.find('.macro-control, .macro-name').click((ev) => onManageMacro(ev, this.document));

        // Ensure all text is selected when entering number input field
        html.on('click', "input[type='number']", (ev) => {
            ev.currentTarget.select();
        });

        // Ensure all text is selected when entering text input field
        html.on('click', "input[type='text']", (ev) => {
            ev.currentTarget.select();
        });

        html.on('change', "input[type='text']", (ev) => {
            if (ev.target.name === 'item-quantity-special') {
                this._handleQtyInput(ev.target.id.slice(0, 16), ev.target.value);
            } else if (ev.target.name === 'item-sbx-special') {
                this._handleSbxInput(ev.target.id.slice(0, 16), ev.target.value);
            } else if (ev.target.name === 'item-op-special') {
                this._handleOpInput(ev.target.id.slice(0, 16), ev.target.value);
            }
        });

        // Filter on name for Skills
        html.on('keyup', '.skill-name-filter', (ev) => {
            this.skillNameFilter = $(ev.currentTarget).val();
            const lcSkillNameFilter = this.skillNameFilter.toLowerCase();
            let skills = html.find('.skill-item');
            for (let skill of skills) {
                const skillName = skill.getAttribute('data-item-name');
                if (lcSkillNameFilter) {
                    if (skillName.toLowerCase().includes(lcSkillNameFilter)) {
                        $(skill).show();
                    } else {
                        $(skill).hide();
                    }
                } else {
                    $(skill).show();
                }
            }
        });

        // Filter on name for gear
        html.on('keyup', '.gear-name-filter', (ev) => {
            this.gearNameFilter = $(ev.currentTarget).val();
            const lcGearNameFilter = this.gearNameFilter.toLowerCase();
            let gearItems = html.find('.gear-item');
            for (let gear of gearItems) {
                const gearName = gear.getAttribute('data-item-name');
                if (lcGearNameFilter) {
                    if (gearName.toLowerCase().includes(lcGearNameFilter)) {
                        $(gear).show();
                    } else {
                        $(gear).hide();
                    }
                } else {
                    $(gear).show();
                }
            }
        });

        // Filter on name for macros
        html.on('keyup', '.macros-name-filter', (ev) => {
            this.macrosNameFilter = $(ev.currentTarget).val();
            const lcMacrosNameFilter = this.macrosNameFilter.toLowerCase();
            let macroItems = html.find('.macro');
            for (let macro of macroItems) {
                const macroName = macro.getAttribute('data-macro-name');
                if (lcMacrosNameFilter) {
                    if (macroName.toLowerCase().includes(lcMacrosNameFilter)) {
                        $(macro).show();
                    } else {
                        $(macro).hide();
                    }
                } else {
                    $(macro).show();
                }
            }
        });

        // Filter on name for effects
        html.on('keyup', '.effects-name-filter', (ev) => {
            this.effectsNameFilter = $(ev.currentTarget).val();
            const lcEffectsNameFilter = this.effectsNameFilter.toLowerCase();
            let effectItems = html.find('.effect');
            for (let effect of effectItems) {
                const effectName = effect.getAttribute('data-effect-name');
                if (lcEffectsNameFilter) {
                    if (effectName.toLowerCase().includes(lcEffectsNameFilter)) {
                        $(effect).show();
                    } else {
                        $(effect).hide();
                    }
                } else {
                    $(effect).show();
                }
            }
        });

        // Standard 1d100 Skill Roll
        html.find('.skill-roll').click((ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const fastforward = ev.shiftKey || ev.altKey || ev.ctrlKey;
            const item = this.actor.items.get(li.data('itemId'));
            macros.skillRoll(item?.uuid, fastforward, this.actor);
        });

        // Standard 1d100 Spell Casting Roll
        html.find('.spell-roll').click((ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const fastforward = ev.shiftKey || ev.altKey || ev.ctrlKey;
            const item = this.actor.items.get(li.data('itemId'));
            macros.castSpellRoll(item?.uuid, fastforward, this.actor);
        });

        // Standard 1d100 Ritual Invocation Roll
        html.find('.invocation-roll').click((ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const fastforward = ev.shiftKey || ev.altKey || ev.ctrlKey;
            const item = this.actor.items.get(li.data('itemId'));
            macros.invokeRitualRoll(item?.uuid, fastforward, this.actor);
        });

        // Standard 1d100 Psionic Talent Roll
        html.find('.psionic-roll').click((ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const fastforward = ev.shiftKey || ev.altKey || ev.ctrlKey;
            const item = this.actor.items.get(li.data('itemId'));
            macros.usePsionicRoll(item?.uuid, fastforward, this.actor);
        });

        // d6 Ability Score Roll
        html.find('.ability-d6-roll').click((ev) => {
            const ability = ev.currentTarget.dataset.ability;
            const fastforward = ev.shiftKey || ev.altKey || ev.ctrlKey;
            macros.testAbilityD6Roll(ability, fastforward, this.actor);
        });

        // d100 Ability Score Roll
        html.find('.ability-d100-roll').click((ev) => {
            const ability = ev.currentTarget.dataset.ability;
            const fastforward = ev.shiftKey || ev.altKey || ev.ctrlKey;
            macros.testAbilityD100Roll(ability, fastforward, this.actor);
        });

        // Weapon Damage Roll
        html.find('.weapon-damage-roll').click((ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const aspect = ev.currentTarget.dataset.aspect;
            const item = this.actor.items.get(li.data('itemId'));
            macros.weaponDamageRoll(item?.uuid, aspect, this.actor);
        });

        // Missile Damage Roll
        html.find('.missile-damage-roll').click((ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const range = ev.currentTarget.dataset.range;
            const item = this.actor.items.get(li.data('itemId'));
            macros.missileDamageRoll(item?.uuid, range, this.actor);
        });

        // Melee Weapon Attack
        html.find('.melee-weapon-attack').click((ev) => {
            // If we are a synthetic actor, token will be set
            let token = this.actor.token;
            if (!token) {
                // We are not a synthetic actor, so see if there is exactly one linked actor on the canvas
                const tokens = this.actor.getActiveTokens(true);
                if (tokens.length == 0) {
                    ui.notifications.warn(
                        `There are no tokens linked to this actor on the canvas, double-click on a specific token on the canvas.`
                    );
                    return null;
                } else if (tokens.length > 1) {
                    ui.notifications.warn(
                        `There are ${tokens.length} tokens linked to this actor on the canvas, so the attacking token can't be identified.`
                    );
                    return null;
                }
                token = tokens[0];
            }

            const li = $(ev.currentTarget).parents('.item');
            const item = this.actor.items.get(li.data('itemId'));
            macros.weaponAttack(item?.uuid, false, token);
        });

        // Missile Weapon Attack
        html.find('.missile-weapon-attack').click((ev) => {
            // If we are a synthetic actor, token will be set
            let token = this.actor.token;
            if (!token) {
                // We are not a synthetic actor, so see if there is exactly one linked actor on the canvas
                const tokens = this.actor.getActiveTokens(true);
                if (tokens.length == 0) {
                    ui.notifications.warn(
                        `There are no tokens linked to this actor on the canvas, double-click on a specific token on the canvas.`
                    );
                    return null;
                } else if (tokens.length > 1) {
                    ui.notifications.warn(
                        `There are ${tokens.length} tokens linked to this actor on the canvas, so the attacking token can't be identified.`
                    );
                    return null;
                }
                token = tokens[0];
            }

            const li = $(ev.currentTarget).parents('.item');
            const item = this.actor.items.get(li.data('itemId'));
            macros.missileAttack(item?.uuid, false, token);
        });

        // Esoteric Attack
        html.find('.esoteric-attack').click((ev) => {
            // If we are a synthetic actor, token will be set
            let token = this.actor.token;
            if (!token) {
                // We are not a synthetic actor, so see if there is exactly one linked actor on the canvas
                const tokens = this.actor.getActiveTokens(true);
                if (tokens.length == 0) {
                    ui.notifications.warn(
                        `There are no tokens linked to this actor on the canvas, double-click on a specific token on the canvas.`
                    );
                    return null;
                } else if (tokens.length > 1) {
                    ui.notifications.warn(
                        `There are ${tokens.length} tokens linked to this actor on the canvas, so the attacking token can't be identified.`
                    );
                    return null;
                }
                token = tokens[0];
            }

            const li = $(ev.currentTarget).parents('.item');
            const item = this.actor.items.get(li.data('itemId'));
            macros.esotericAttack(item?.uuid, false, token);
        });

        // Weapon Attack Roll
        html.find('.weapon-attack-roll').click((ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const fastforward = ev.shiftKey || ev.altKey || ev.ctrlKey;
            const item = this.actor.items.get(li.data('itemId'));
            macros.weaponAttackRoll(item?.uuid, fastforward, this.actor);
        });

        // Weapon Defend Roll
        html.find('.weapon-defend-roll').click((ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const fastforward = ev.shiftKey || ev.altKey || ev.ctrlKey;
            const item = this.actor.items.get(li.data('itemId'));
            macros.weaponDefendRoll(item?.uuid, fastforward, this.actor);
        });

        // Missile Attack Roll
        html.find('.missile-attack-roll').click((ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const item = this.actor.items.get(li.data('itemId'));
            macros.missileAttackRoll(item?.uuid, this.actor);
        });

        // Injury Roll
        html.find('.injury-roll').click((ev) => macros.injuryRoll(this.actor));

        // Healing Roll
        html.find('.healing-roll').click((ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const fastforward = ev.shiftKey || ev.altKey || ev.ctrlKey;
            const item = this.actor.items.get(li.data('itemId'));
            macros.healingRoll(item?.uuid, fastforward, this.actor);
            //const ifff = new ImportFFF();
            //ifff.importFromJSON('test.json');
        });

        // Dodge Roll
        html.find('.dodge-roll').click((ev) => macros.dodgeRoll(ev.shiftKey || ev.altKey || ev.ctrlKey, this.actor));

        // Shock Roll
        html.find('.shock-roll').click((ev) => macros.shockRoll(ev.shiftKey || ev.altKey || ev.ctrlKey, this.actor));

        // Stumble Roll
        html.find('.stumble-roll').click((ev) =>
            macros.stumbleRoll(ev.shiftKey || ev.altKey || ev.ctrlKey, this.actor)
        );

        // Fumble Roll
        html.find('.fumble-roll').click((ev) => macros.fumbleRoll(ev.shiftKey || ev.altKey || ev.ctrlKey, this.actor));

        // Generic Damage Roll
        html.find('.damage-roll').click((ev) => macros.genericDamageRoll(this.actor));

        // Falling Roll
        html.find('.falling-roll').click((ev) => macros.fallingRoll(false, this.actor));

        // Morale Roll
        html.find('.morale-roll').click((ev) => macros.moraleRoll(ev.shiftKey || ev.altKey || ev.ctrlKey, this.actor));

        // Mount / Dismount
        html.find('.mount-action').click(this._onToggleMount.bind(this));

        // Steed Command Check
        html.find('.steedcommand-roll').click((ev) =>
            macros.steedCommandRoll(ev.shiftKey || ev.altKey || ev.ctrlKey, this.actor)
        );

        // Unhorsing Roll
        html.find('.unhorsing-roll').click((ev) =>
            macros.unhorsingRoll(ev.shiftKey || ev.altKey || ev.ctrlKey, this.actor)
        );

        // Toggle carry state
        html.find('.item-carry').click(this._onToggleCarry.bind(this));

        // Toggle equip state
        html.find('.item-equip').click(this._onToggleEquip.bind(this));

        // Toggle improve state
        html.find('.item-improve').click(this._onToggleImprove.bind(this));

        // More Info
        html.find('.more-info').click(this._onMoreInfo.bind(this));
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    // async activateEditor(name, options = {}, initialContent = '') {
    //     options.relativeLinks = true;
    //     options.plugins = {
    //         menu: ProseMirror.ProseMirrorMenu.build(ProseMirror.defaultSchema, {
    //             compact: true,
    //             destroyOnSave: false,
    //             onSave: () => this.saveEditor(name, {remove: false})
    //         })
    //     };
    //     return super.activateEditor(name, options, initialContent);
    // }

    async _onItemDelete(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const data = foundry.utils.deepClone(header.dataset);
        const li = $(header).parents('.item');
        const itemId = li.data('itemId');
        if (itemId) {
            const item = this.actor.items.get(itemId);
            if (!item) {
                console.error(`HM3 | Delete aborted, item ${itemId} in actor ${this.actor.name} was not found.`);
                return;
            }

            let title = `Delete ${data.label}`;
            let content;
            if (item.type === 'containergear') {
                title = 'Delete Container';
                content = '<p>WARNING: All items in this container will be deleted as well!</p><p>Are you sure?</p>';
            } else {
                content = '<p>Are you sure?</p>';
            }

            // Create the dialog window
            let agree = false;
            await Dialog.confirm({
                title: title,
                content: content,
                yes: () => (agree = true)
            });

            if (agree) {
                const deleteItems = [];

                // Add all items in the container to the delete list
                if (item.type === 'containeritem') {
                    this.actor.items.forEach((it) => {
                        if (item.type.endsWith('gear') && it.systemn.container === itemId) deleteItems.push(it.id);
                    });
                }

                deleteItems.push(itemId); // ensure we delete the container last

                for (let it of deleteItems) {
                    await Item.deleteDocuments([it], {parent: this.actor});
                    li.slideUp(200, () => this.render(false));
                }
            }
        }
    }

    async _onContainerCollapse(ev) {
        const el = ev.currentTarget.dataset;
        if (!el) return;
        const container = fromUuidSync(el.cuuid);
        if (container) {
            if (el.action === 'minimize') {
                container.update({'system.collapsed': true});
            } else if (el.action === 'maximize') {
                container.update({'system.collapsed': false});
            }
        } else if (el.containerId === 'on-person') {
            if (el.action === 'minimize') {
                this.actor.setFlag('hm3', 'onPersonContainerCollapsed', true);
            } else if (el.action === 'maximize') {
                this.actor.setFlag('hm3', 'onPersonContainerCollapsed', false);
            }
        }
    }

    async mergeItem(item, other) {
        if (item.type != other.type) {
            return;
        }

        const data = item.system;
        const otherData = other.system;
        const updateData = {};

        if (!data.notes) updateData['system.notes'] = otherData.notes;
        if (!data.source) updateData['system.source'] = otherData.source;
        if (!data.description) updateData['system.description'] = otherData.description;
        if (!data.macros.type || data.macros.type !== otherData.macros.type)
            updateData['system.macros.type'] = otherData.macros.type;
        if (!data.macros.command) updateData['system.macros.command'] = otherData.macros.command;
        updateData['img'] = other.img;

        switch (item.type) {
            case 'skill':
                // If the skill types don't match, return without change
                if (data.type != otherData.type) {
                    return;
                }

                // NOTE: We never copy over the skillbase value or
                // the Piety value, those must always be set in the
                // actor's sheet.

                // If the skillbase is blank, copy it over from dropped item
                if (!data.skillBase.formula) {
                    updateData['system.skillBase.formula'] = otherData.skillBase.formula;
                    updateData['system.skillBase.isFormulaValid'] = otherData.skillBase.isFormulaValid;
                }
                break;

            case 'spell':
                updateData['system.convocation'] = otherData.convocation;
                updateData['system.level'] = otherData.level;
                break;

            case 'invocation':
                updateData['system.diety'] = otherData.diety;
                updateData['system.circle'] = otherData.circle;
                break;

            case 'psionic':
                // If the skillbase is blank, copy it over from dropped item
                if (!data.skillBase.formula) {
                    updateData['system.skillBase.formula'] = otherData.skillBase.formula;
                    updateData['system.skillBase.isFormulaValid'] = otherData.skillBase.isFormulaValid;
                }
                updateData['system.fatigue'] = otherData.fatigue || 0;
                break;
        }

        await item.update(updateData);

        return;
    }

    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        // Grab any data associated with this control.
        const dataset = foundry.utils.deepClone(header.dataset);

        let extraList = [];
        let extraLabel = null;

        let name;

        // Ask type
        // Initialize a default name.
        if (dataset.type === 'skill' && dataset.skilltype) {
            name = utility.createUniqueName(`New ${dataset.skilltype} Skill`, this.actor.itemTypes.skill);
        } else if (dataset.type == 'trait' && dataset.traittype) {
            name = utility.createUniqueName(`New ${dataset.traittype} Trait`, this.actor.itemTypes.trait);
        } else if (dataset.type.endsWith('gear')) {
            name = 'New Gear';
            extraList = ['Misc. Gear', 'Armor', 'Melee Weapon', 'Missile Weapon', 'Container'];
            extraLabel = 'Gear Type';
        } else {
            switch (dataset.type) {
                case ItemType.ARMORLOCATION:
                    name = utility.createUniqueName('New Location', this.actor.itemTypes.armorlocation);
                    break;

                case 'injury':
                    name = utility.createUniqueName('New Injury', this.actor.itemTypes.injury);
                    break;

                case 'spell':
                    name = utility.createUniqueName('New Spell', this.actor.itemTypes.spell);
                    break;

                case 'invocation':
                    name = utility.createUniqueName('New Invocation', this.actor.itemTypes.invocation);
                    break;

                case 'psionic':
                    name = utility.createUniqueName('New Psionic', this.actor.itemTypes.psionic);
                    break;

                default:
                    console.error(`HM3 | Can't create item: unknown item type '${dataset.type}'`);
                    return null;
            }
        }

        // Render modal dialog
        let dlgTemplate = 'systems/hm3/templates/dialog/create-item.hbs';
        let dialogData = {
            type: dataset.type,
            title: name,
            placeholder: name,
            extraList: extraList,
            extraLabel: extraLabel
        };

        const dlghtml = await renderTemplate(dlgTemplate, dialogData);

        // Create the dialog window
        return Dialog.prompt({
            title: dialogData.title,
            content: dlghtml,
            label: 'Create',
            callback: async (html) => {
                const form = html.querySelector('#create-item');
                const fd = new FormDataExtended(form);
                const formdata = fd.object;
                let itemName = formdata.name;
                let extraValue = formdata.extra_value;

                const updateData = {name: itemName, type: dataset.type};
                if (dataset.type === 'gear') {
                    if (extraValue === 'Container') updateData.type = 'containergear';
                    else if (extraValue === 'Armor') updateData.type = 'armorgear';
                    else if (extraValue === 'Melee Weapon') updateData.type = 'weapongear';
                    else if (extraValue === 'Missile Weapon') updateData.type = 'missilegear';
                    else updateData.type = 'miscgear';
                }

                // Item Data
                if (dataset.type === 'skill') updateData['system.type'] = dataset.skilltype;
                else if (dataset.type === 'trait') updateData['system.type'] = dataset.traittype;
                else if (dataset.type.endsWith('gear')) updateData['system.container'] = dataset.containerId;
                else if (dataset.type === 'spell') updateData['system.convocation'] = extraValue;
                else if (dataset.type === 'invocation') updateData['system.diety'] = extraValue;

                // Finally, create the item!
                const result = await Item.create(updateData, {parent: this.actor});

                if (!result) {
                    throw new Error(
                        `Error creating item '${updateData.name}' of type '${updateData.type}' on character '${this.actor.name}'`
                    );
                }

                // Bring up edit dialog to complete creating item
                const item = this.actor.items.get(result.id);
                item.sheet.render(true);

                return result;
            },
            options: {jQuery: false}
        });
    }

    async _onToggleMount(event) {
        event.preventDefault();
        await this.actor.update({'system.mounted': !this.actor.system.mounted});
        this.actor.prepareData();
        const riding = this.actor.items.filter(
            (item) => item.type === game.hm3.ItemType.SKILL && item.name.includes('Riding')
        );
        riding[0].sheet.render();
    }

    /**
     * Handle toggling the carry state of an Owned Item within the Actor
     * @param {Event} event   The triggering click event
     * @private
     */
    async _onToggleCarry(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        // Only process inventory ("gear") items, otherwise ignore
        if (item.type.endsWith('gear')) {
            const attr = 'system.isCarried';
            const ret = await item.update({[attr]: !getProperty(item, attr)});

            for (const effect of item.effects.contents) {
                await effect.update({disabled: !item.system.isEquipped || !item.system.isCarried});
            }

            return ret;
        }

        return null;
    }

    /**
     * Handle toggling the carry state of an Owned Item within the Actor
     * @param {Event} event   The triggering click event
     * @private
     */
    async _onToggleEquip(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        // Only process inventory ("gear") items, otherwise ignore
        if (item.type.endsWith('gear')) {
            const attr = 'system.isEquipped';
            const ret = await item.update({[attr]: !getProperty(item, attr)});

            for (const effect of item.effects.contents) {
                await effect.update({disabled: !item.system.isEquipped || !item.system.isCarried});
            }

            return ret;
        }

        return null;
    }

    /**
     * Handle toggling the improve state of an Owned Item within the Actor
     * @param {Event} event   The triggering click event
     * @private
     */
    async _onToggleImprove(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        // Only process skills and psionics, otherwise ignore
        if (item.type === 'skill' || item.type === 'psionic') {
            if (!item.system.improveFlag) {
                return item.update({'system.improveFlag': 1});
            } else {
                return this._improveToggleDialog(item);
            }
        }

        return null;
    }

    async _onMoreInfo(event) {
        event.preventDefault();
        const journalEntry = event.currentTarget.dataset.journalEntry;

        const helpJournal = await game.packs.find((p) => p.collection === `hm3.system-help`).getDocuments();
        const article = helpJournal.find((i) => i.name === journalEntry);
        //const article = game.journal.getName(journalEntry);
        if (!article) {
            console.error(`HM3 | Can't find journal entry with name "${journalEntry}".`);
            return null;
        }
        article.sheet.render(true, {editable: false});
        return null;
    }

    async _improveToggleDialog(item) {
        // Condition skill is maxed out (SKILLS 9)
        if (item.type === 'skill' && item.name === 'Condition') {
            if (item.system.masteryLevel >= 7 * item.system.skillBase.value) {
                await game.hm3.GmSays({
                    text: `<h4>${this.actor.name}: ${item.name}</h4>` + game.i18n.localize('hm3.SDR.ConditionSkillMax'),
                    source: 'SKILLS 9'
                });
                return;
            }
        }

        let dlghtml = game.i18n.localize('hm3.SDR.MainDlgHtml');
        // Create the dialog window
        return new Promise((resolve) => {
            new Dialog(
                {
                    title: game.i18n.localize('hm3.SDR.Toggle'),
                    content: dlghtml.trim(),
                    buttons: {
                        performSDR: {
                            label: game.i18n.localize('hm3.SDR.Perform'),
                            callback: async () => {
                                let num = item.system.improveFlag;

                                if (num <= 2) num = 1; // 1, 2
                                else if (num <= 5) num = 2; // 3, 4, 5
                                else if (num <= 9) num = 3; // 6, 7, 8, 9
                                else if (num <= 14) num = 4; // 10, 11, 12, 13, 14
                                else num = 5; // 15, 16, ...

                                for (let i = 0; i < num; i++) {
                                    await this.actor.skillDevRoll(item);
                                }
                                resolve(true);
                            }
                        },
                        performTrainingSDR: {
                            label: game.i18n.localize('hm3.SDR.PerformTraining'),
                            callback: async (html) => {
                                // Special rules for combat skills
                                if (item.type === 'skill' && item.system.type === 'Combat') {
                                    // Once opened, Development Rolls are made only for Combat Experience (SKILLS 18)
                                    if (item.name === 'Initiative') {
                                        await game.hm3.GmSays({
                                            text:
                                                `<h4>${this.actor.name}: ${item.name}</h4>` +
                                                game.i18n.localize('hm3.SDR.InitiativeExperience'),
                                            source: 'SKILLS 18'
                                        });
                                        return;
                                    }
                                    // Weapon Skills may be developed by practice/training as normal, but no weapon skill
                                    // can be increased beyond ML70 except by actual combat experience (SKILLS 18)
                                    else if (item.system.masteryLevel >= 70) {
                                        await game.hm3.GmSays({
                                            text:
                                                `<h4>${this.actor.name}: ${item.name}</h4>` +
                                                game.i18n.localize('hm3.SDR.CombatExperience'),
                                            source: 'SKILLS 18'
                                        });
                                        return;
                                    }
                                }
                                dlghtml = game.i18n.localize('hm3.SDR.TrainingDlgHtml');
                                return new Promise((resolve) => {
                                    new Dialog({
                                        title: game.i18n.localize('hm3.SDR.SDRs'),
                                        content: dlghtml.trim(),
                                        buttons: {
                                            roll: {
                                                label: game.i18n.localize('hm3.SDR.Roll'),
                                                callback: async (html) => {
                                                    const num = Number(html.find('#sdr')[0].value);
                                                    let success = 0;
                                                    for (let i = 0; i < num; i++) {
                                                        // Condition skill is maxed out (SKILLS 9)
                                                        if (item.type === 'skill' && item.name === 'Condition') {
                                                            if (
                                                                item.system.masteryLevel >=
                                                                7 * item.system.skillBase.value
                                                            ) {
                                                                await game.hm3.GmSays({
                                                                    text:
                                                                        `<h4>${this.actor.name}: ${item.name}</h4>` +
                                                                        game.i18n.localize(
                                                                            'hm3.SDR.ConditionSkillMax'
                                                                        ) +
                                                                        `<p>(${num - i} SDRs left)</p>`,
                                                                    source: 'SKILLS 9'
                                                                });
                                                                break;
                                                            }
                                                        }
                                                        if (item.type === 'skill' && item.system.type === 'Combat') {
                                                            if (item.system.masteryLevel >= 70) {
                                                                await game.hm3.GmSays({
                                                                    text:
                                                                        `<h4>${this.actor.name}: ${item.name}</h4>` +
                                                                        game.i18n.localize('hm3.SDR.CombatExperience') +
                                                                        `<p>(${num - i} SDRs left)</p>`,
                                                                    source: 'SKILLS 18'
                                                                });
                                                                break;
                                                            }
                                                        }

                                                        if (await this.actor.skillDevRoll(item, false)) success++;
                                                    }
                                                    await game.hm3.GmSays({
                                                        text: `<h4>${this.actor.name}: ${item.name}</h4>${success}/${num} SDRs succeeded`
                                                    });
                                                    resolve(true);
                                                }
                                            }
                                        },
                                        default: 'roll',
                                        close: () => resolve(false)
                                    }).render(true);
                                });
                            }
                        },
                        disableFlag: {
                            label: game.i18n.localize('hm3.SDR.DisableFlag'),
                            callback: async () => {
                                return item.update({'system.improveFlag': 0});
                            }
                        }
                    },
                    default: 'performSDR',
                    close: () => resolve(false)
                },
                {width: 550}
            ).render(true);
        });
    }

    async _onDumpEsotericDescription(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const li = $(header).parents('.item');
        const itemId = li.data('itemId');

        if (itemId) {
            const item = this.actor.items.get(itemId);
            if (!item) {
                return;
            }

            const itemData = item.system;

            if (['spell', 'invocation', 'psionic'].includes(item.type)) {
                const chatData = {
                    name: item.name,
                    desc: itemData.description,
                    notes: itemData.notes || null,
                    fatigue: item.type === 'psionic' ? itemData.fatigue : null
                };

                if (item.type === 'spell') {
                    chatData.level = utility.romanize(itemData.level);
                    chatData.title = `${itemData.convocation} Spell`;
                } else if (item.type === 'invocation') {
                    chatData.level = utility.romanize(itemData.circle);
                    chatData.title = `${itemData.diety} Invocation`;
                } else if (item.type === 'psionic') {
                    chatData.level = `F${itemData.fatigue}`;
                    chatData.title = `Psionic Talent`;
                }

                const chatTemplate = 'systems/hm3/templates/chat/esoteric-desc-card.hbs';

                const html = await renderTemplate(chatTemplate, chatData);

                const messageData = {
                    user: game.user.id,
                    speaker: ChatMessage.getSpeaker({actor: this.object}),
                    content: html.trim(),
                    type: CONST.CHAT_MESSAGE_STYLES.OTHER
                };

                // Create a chat message
                return ChatMessage.create(messageData);
            }
        }
    }

    /**
     * Handles the quantity input field. You can also write + or - in front of the number
     * and everything will be calculated accordingly.
     * @param {string} itemId - The item id.
     * @param {string} newValue - The newly entered value.
     */
    async _handleQtyInput(itemId, newValue) {
        const item = this.actor.items.find((i) => i.id === itemId);

        // Ensure that at least something has been entered
        if (newValue.length === 0) {
            document.getElementById(itemId).value = item.system.quantity;
            return;
        }

        const firstChar = Array.from(newValue)[0];

        let isPlus = false;
        let isMinus = false;
        if (firstChar === '+') isPlus = true;
        if (firstChar === '-') isMinus = true;
        if (isPlus || isMinus) newValue = newValue.slice(1);

        // Ensure that something meaningful has been entered
        if (newValue.length === 0 || isNaN(newValue)) {
            document.getElementById(itemId).value = item.system.quantity;
            return;
        }

        // Only integer quantities allowed
        newValue = utility.truncate(Number(newValue), 0);

        if (isPlus) {
            item.system.quantity = item.system.quantity + newValue;
        } else if (isMinus) {
            item.system.quantity = Math.max(item.system.quantity - newValue);
        } else {
            item.system.quantity = newValue;
        }

        document.getElementById(itemId).value = item.system.quantity;

        // Update the quantity on the server
        item.update({'system.quantity': item.system.quantity});
    }

    async _handleSbxInput(itemId, newValue) {
        const item = this.actor.items.find((i) => i.id === itemId);

        // Ensure that something meaningful has been entered
        if (newValue.length === 0 || isNaN(newValue)) {
            document.getElementById(itemId + '-SBx').value = item.system.skillBase.SBx;
            return;
        }

        // Ensure that something meaningful has been entered
        if (Number(newValue) <= 0 || Number(newValue) >= 8) {
            document.getElementById(itemId + '-SBx').value = item.system.skillBase.SBx;
            return;
        }

        item.system.skillBase.SBx = newValue;
        document.getElementById(itemId + '-SBx').value = item.system.skillBase.SBx;

        // Update the quantity on the server
        await item.update({'system.skillBase.SBx': item.system.skillBase.SBx});
        await item.update({'system.masteryLevel': 0});
    }

    async _handleOpInput(itemId, newValue) {
        const item = this.actor.items.find((i) => i.id === itemId);

        if (newValue.length === 0) {
            item.system.skillBase.OP = null;
            document.getElementById(itemId + '-OP').value = item.system.skillBase.OP;

            // Update the quantity on the server
            await item.update({'system.skillBase.-=OP': item.system.skillBase.OP});
            await item.update({'system.masteryLevel': 0});
            return;
        }

        // Ensure that something meaningful has been entered
        if (isNaN(newValue)) {
            document.getElementById(itemId + '-OP').value = item.system.skillBase.OP;
            return;
        }

        // Ensure that something meaningful has been entered
        if (Number(newValue) <= 0 || Number(newValue) >= 4) {
            document.getElementById(itemId + '-OP').value = item.system.skillBase.OP;
            return;
        }

        item.system.skillBase.OP = newValue;
        document.getElementById(itemId + '-OP').value = item.system.skillBase.OP;

        // Update the quantity on the server
        await item.update({'system.skillBase.OP': item.system.skillBase.OP});
        await item.update({'system.masteryLevel': 0});
    }

    async conditionalRender({aeDisabled = false, aeStarted = false, force = false} = {}) {
        if (force || this._tabs[0].active === 'effects' || aeDisabled || aeStarted) {
            return super.render(force);
        }
    }
}
