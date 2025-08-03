import {ActorHM3} from '../actor/actor.js';
import {HM3} from '../config.js';
import {ItemType, SkillType} from '../hm3-types.js';
import * as utility from '../utility.js';

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class ItemHM3 extends Item {
    _impactTypeChanged = false;

    /**
     * @override
     */
    async _preUpdate(changed, options, user) {
        // Reset the impactTypeChanged flag
        this._impactTypeChanged = false;
        if (changed.type === ItemType.ARMORLOCATION && changed.system.impactType !== this.system.impactType) {
            // If the impactType has changed, then we need to update the armor location data
            this._impactTypeChanged = true;
        }

        return super._preUpdate(changed, options, user);
    }

    get isArtifact() {
        return this.system.arcane?.isArtifact || false;
    }

    get isMinorArtifact() {
        return this.isArtifact && this.system.arcane?.type === 'Minor';
    }

    get isMajorArtifact() {
        return this.isArtifact && this.system.arcane?.type === 'Major';
    }

    getArcanePower(power) {
        if (this.isMinorArtifact) {
            if (this.system.arcane.minor.power?.startsWith(power))
                return foundry.utils.mergeObject(
                    this.system.arcane.minor,
                    game.hm3.config.arcanePowers.find((p) => p.key === this.system.arcane.minor.power)
                );
        } else if (this.isMajorArtifact) {
        }
        return null;
    }

    /**
     * Augment the basic Item data model with additional dynamic data.
     */
    prepareData() {
        super.prepareData();

        // Get the Item's data
        const itemData = this.system;

        let img = null;

        // Handle marking gear as equipped or carried
        if (this.type.endsWith('gear')) {
            // If you aren't carrying the gear, it can't be equipped
            if (!itemData.isCarried) {
                itemData.isEquipped = false;
            }

            // Check if the item is in a container
            if (itemData.container && itemData.container !== 'on-person') {
                // Anything in a container is unequipped automatically
                itemData.isEquipped = false;
            }
        }

        if (this.type === ItemType.ARMORLOCATION) {
            this._prepareArmorLocationData(itemData);
        }

        if (img && img != this.img) {
            this.img = img;
        }

        Hooks.call('hm3.onItemPrepareData', this);
    }

    postProcessItems() {
        const itemData = this.system;

        let pctUnivPen = ItemHM3.calcPenaltyPct(this.actor?.system?.universalPenalty);
        let pctPhysPen = ItemHM3.calcPenaltyPct(this.actor?.system?.physicalPenalty);

        if (this.type === ItemType.SKILL) {
            if (!itemData.masteryLevel || itemData.masteryLevel < 0) itemData.masteryLevel = 0;

            utility.calcSkillBase(this);

            if (this.actor) {
                if (itemData.masteryLevel === 0 && itemData.skillBase.SBx) {
                    const OP = Math.round((Number(itemData.skillBase.OP) || 0) / 2);
                    const val = (Number(itemData.skillBase.SBx) + OP) * itemData.skillBase.value;
                    if (this.name.includes('Condition') && 5 * itemData.skillBase.value > 70) {
                        // the regular endurance should not be punished
                        const diff = 5 * itemData.skillBase.value - 70;
                        itemData.masteryLevel = utility.truncatedOML(val - diff) + diff;
                    } else itemData.masteryLevel = utility.truncatedOML(val);
                }
            }

            // We modify the EML by 5 times the difference between the SB based on base
            // abilities and the SB based on AE-modified abilities
            const sbModifier = Math.round(itemData.skillBase.delta * 5);

            // Set EML for skills based on UP/PP
            switch (itemData.type) {
                case SkillType.COMBAT:
                case SkillType.PHYSICAL:
                    if (this.name.includes('Riding') && itemData.actorUuid) {
                        const steed = fromUuidSync(itemData.actorUuid);
                        if (steed) {
                            steed.prepareData();
                            const ini = steed.items.find((x) => x.name === 'Initiative');
                            const steedUP = ActorHM3.calcUniversalPenalty(steed);

                            itemData.effectiveMasteryLevel =
                                Math.round((itemData.masteryLevel + ini.system.masteryLevel) / 2) -
                                pctPhysPen -
                                steedUP * 5 +
                                sbModifier;
                        }
                    } else {
                        itemData.effectiveMasteryLevel = itemData.masteryLevel - pctPhysPen + sbModifier;
                    }
                    break;

                default:
                    itemData.effectiveMasteryLevel = itemData.masteryLevel - pctUnivPen + sbModifier;
                    break;
            }

            // Set some actor properties from skills
            const lcSkillName = this.name.toLowerCase();
            if (lcSkillName === 'initiative') {
                if (this.actor?.system) this.actor.system.initiative = itemData.effectiveMasteryLevel;
            } else if (lcSkillName === 'dodge') {
                if (this.actor?.system) this.actor.system.dodge = itemData.effectiveMasteryLevel;
            }
        } else if (this.type === ItemType.PSIONIC) {
            if (!itemData.masteryLevel || itemData.masteryLevel < 0) itemData.masteryLevel = 0;
            utility.calcSkillBase(this);
            if (this.actor) {
                if (itemData.masteryLevel === 0) itemData.masteryLevel = itemData.skillBase.value;
            }
            itemData.effectiveMasteryLevel = itemData.masteryLevel - pctUnivPen;
        } else if (this.type === ItemType.INJURY) {
            // Just make sure if injuryLevel is negative, we set it to zero
            itemData.injuryLevel = Math.max(itemData.injuryLevel || 0, 0);
            ItemHM3.calcInjurySeverity(this);
        }

        if (Object.hasOwn(itemData, 'improveFlag') && typeof itemData.improveFlag === 'boolean') {
            // If the improveFlag is a boolean, then set it to 1 or 0
            itemData.improveFlag = itemData.improveFlag ? 1 : 0;
        }
    }

    _prepareArmorLocationData(itemData) {
        // If impactType isn't custom, then set all properties from the selected impactType
        if (itemData.impactType !== 'custom' && this._impactTypeChanged) {
            Object.keys(HM3.injuryLocations).forEach((key) => {
                if (HM3.injuryLocations[key].impactType === itemData.impactType) {
                    foundry.utils.mergeObject(itemData, HM3.injuryLocations[key]);
                }
            });
        }

        itemData.probWeight.low = itemData.probWeight?.low || 0;
        itemData.probWeight.mid = itemData.probWeight?.mid || 0;
        itemData.probWeight.high = itemData.probWeight?.high || 0;
        itemData.armorQuality = itemData.armorQuality || 0;
        itemData.blunt = itemData.blunt || 0;
        itemData.edged = itemData.edged || 0;
        itemData.piercing = itemData.piercing || 0;
        itemData.fire = itemData.fire || 0;
    }

    /** @override */
    async _preCreate(data, options, user) {
        super._preCreate(data, options, user);
        const itemData = this.system;

        const updateData = {};
        if (data.img) updateData.img = data.img;

        // If this item is associated with a specific actor, then we can determine
        // some values directly from the actor.
        if (this.actor) {
            // If a weapon or a missile, get the associated skill
            if ((this.type === ItemType.WEAPONGEAR || this.type === ItemType.MISSILEGEAR) && !itemData.assocSkill) {
                updateData['system.assocSkill'] = utility.getAssocSkill(this.name, this.actor.itemTypes.skill, 'None');
                itemData.assocSkill = updateData['system.assocSkill'];
            }

            // If it is a spell, initialize the convocation to the
            // first magic skill found; it is really unimportant what the
            // value is, so long as it is a valid skill for this character
            if (this.type === ItemType.SPELL && !itemData.convocation) {
                // Most spellcasters have two convocations: Neutral and another,
                // maybe several others.  Most spells are going to be of the
                // non-Neutral variety.  So, we want to prefer using the non-Neutral
                // skill by default; if no non-Neutral skills exist, but Neutral does
                // exist, then use that.

                // In the case where the actor is adding a spell but they have no magic
                // convocations, give up and don't make any changes.
                let hasNeutral = false;
                for (let skill of this.actor.itemTypes.skill.values()) {
                    if (skill.system.type === SkillType.MAGIC) {
                        if (skill.name === 'Neutral') {
                            hasNeutral = true;
                            continue;
                        }
                        updateData['system.convocation'] = skill.name;
                        itemData.convocation = skill.name;
                        break;
                    }
                }
                if (!updateData['system.convocation'] && hasNeutral) {
                    updateData['system.convocation'] = 'Neutral';
                    itemData.convocation = 'Neutral';
                }
            }

            // If it is a invocation, initialize the diety to the
            // first ritual skill found; it is really unimportant what the
            // value is, so long as it is a valid skill for this character
            if (itemData.type === 'invocation' && !itemData.diety) {
                for (let skill of this.actor.itemTypes.skill.values()) {
                    if (skill.system.type === SkillType.RITUAL) {
                        updateData['system.diety'] = skill.name;
                        itemData.diety = skill.name;
                        break;
                    }
                }
            }
        }

        // If the image was not specified (or is default),
        // then set it based on the item name
        if (!updateData.img || updateData.img === Item.DEFAULT_ICON) updateData.img = utility.getImagePath(this.name);

        // Setup Image Icon only if it is currently the default icon
        if (!updateData.img) {
            switch (this.type) {
                case ItemType.SKILL:
                    if (itemData.type === SkillType.RITUAL) {
                        updateData.img = utility.getImagePath(HM3.defaultRitualIconName);
                    } else if (itemData.type === SkillType.MAGIC) {
                        updateData.img = utility.getImagePath(HM3.defaultMagicIconName);
                    }
                    break;

                case ItemType.PSIONIC:
                    updateData.img = utility.getImagePath(HM3.defaultPsionicsIconName);
                    break;

                case ItemType.SPELL:
                    // Base image on convocation name
                    updateData.img = utility.getImagePath(itemData.convocation);
                    if (!updateData.img) {
                        // If convocation image wasn't found, use default
                        updateData.img = utility.getImagePath(HM3.defaultMagicIconName);
                    }
                    break;

                case ItemType.INVOCATION:
                    // Base image on diety name
                    updateData.img = utility.getImagePath(itemData.diety);
                    if (!updateData.img) {
                        // If diety name wasn't found, use default
                        updateData.img = utility.getImagePath(HM3.defaultRitualIconName);
                    }
                    break;

                case ItemType.MISCGEAR:
                    updateData.img = utility.getImagePath(HM3.defaultMiscItemIconName);
                    break;

                case ItemType.CONTAINERGEAR:
                    updateData.img = utility.getImagePath(HM3.defaultContainerIconName);
                    break;

                case ItemType.ARMORGEAR:
                    updateData.img = utility.getImagePath(HM3.defaultArmorGearIconName);
                    break;

                case ItemType.WEAPONGEAR:
                case ItemType.MISSILEGEAR:
                    updateData.img = utility.getImagePath(itemData.assocSkill);
                    break;

                case ItemType.EFFECT:
                    updateData.img = 'icons/svg/aura.svg';
                    break;
            }

            if (!updateData.img) delete updateData.img;
        }

        await this.updateSource(updateData);
    }

    /**
     * Run a custom macro assigned to this item.
     *
     * Returns an object with the following fields:
     *
     * type: Type of roll
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

        if (!this.parent) return null;

        const actor = this.parent;

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

        if (!this.system.macros.command) return null;

        const macro = await Macro.create(
            {
                name: `${this.name} ${this.type} macro`,
                type: this.system.macros.type,
                scope: 'global',
                command: this.system.macros.command
            },
            {temporary: true}
        );
        if (!macro) {
            console.error(
                `HM3 | Failure initializing macro '${this.name} ${this.type} macro', type=${this.system.macros.type}, command='${this.system.macros.command}'`
            );
            return null;
        }

        const token = actor.isToken ? actor.token : null;

        return utility.executeMacroScript(macro, {
            actor: actor,
            token: token,
            rollResult: rollResult,
            item: this
        });
    }

    static calcInjurySeverity(injury) {
        const data = injury.system;

        if (data.injuryLevel === 0) {
            data.severity = '';
        } else if (data.injuryLevel == 1) {
            data.severity = 'M1';
        } else if (data.injuryLevel <= 3) {
            data.severity = `S${data.injuryLevel}`;
        } else {
            data.severity = `G${data.injuryLevel}`;
        }
    }

    /**
     * In HM3, PP and UP are low integer values, so we must multiply them by 5 in order to use them for
     * EML calculations.  This function does that.
     *
     * @param {*} value
     * @returns
     */
    static calcPenaltyPct(value) {
        return (value || 0) * 5;
    }
}
