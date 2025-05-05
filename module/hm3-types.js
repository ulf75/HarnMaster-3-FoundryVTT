/**
 * Combat Action types enum.
 */
export const Action = Object.freeze({
    CHARGE: 'Charge',
    DISENGAGE: 'Disengage',
    ENGAGE: 'Engage',
    ESOTERIC_ATTACK: 'Esoteric Attack',
    FREE_MOVE: 'Free Move',
    GRAPPLE_ATTACK: 'Grapple Attack',
    GROPE: 'Grope',
    HALF_MOVE: 'Half Move',
    MELEE_ATTACK: 'Melee Attack',
    MISSILE_ATTACK: 'Missile Attack',
    PASS: 'Pass',
    REST: 'Rest',
    RISE: 'Rise'
});

/**
 * Actor types enum.
 */
export const ActorType = Object.freeze({
    CHARACTER: 'character',
    CREATURE: 'creature',
    CONTAINER: 'container'
});

/**
 * Aspect types enum.
 */
export const Aspect = Object.freeze({
    BLUNT: 'Blunt',
    EDGED: 'Edged',
    FIRE: 'Fire',
    FROST: 'Frost',
    PIERCING: 'Piercing'
});

/**
 * Condition types enum. A Condition is just a special type of Active Effect.
 */
export const Condition = Object.freeze({
    /**@constant {string} - This is a special state of battle frenzy. Any character who enters this mode must take the most
     * aggressive action available for Attack or Defense, adding 20 to EML to Attack or Counterstrike.
     * Further Initiative rolls are ignored until the battle ends. (COMBAT 16) */
    BERSERK: 'Berserk',

    /**@constant {string} - EYE to 0. COMBAT, CRAFT, MAGIC & PHYSICAL skills to 05. */
    BLINDED: 'Blinded',

    /**@constant {string} - The character is unable to fight in any useful way. The only available options are flight or
     * surrender. Flight is normally preferable; surrender is a last resort. If neither is feasible, the character makes
     * a Rest or Pass action option, but can defend if attacked except that Counterstrike is prohibited. (COMBAT 16) */
    BROKEN: 'Broken',

    /**@constant {string} - A cautious character will not Engage, must choose Pass if engaged, and cannot select the
     * Counterstrike defense. (COMBAT 16) */
    CAUTIOUS: 'Cautious',

    /**@constant {string} - TODO */
    CLOSE_MODE: 'Close Mode',

    /**@constant {string} - HRG to 0. */
    DEAFENED: 'Deafened',

    /**@constant {string} - Character tries to conclude the battle, one way or the other, as soon as possible. Until
     * the situation changes and a new Initiative Test is passed, the character selects the most aggressive option
     * available. (COMBAT 16) */
    DESPERATE: 'Desperate',

    DISTRACTED: 'Distracted',

    /**@constant {string} - TODO */
    DYING: 'Dying',

    /**@constant {string} - Character selects and executes any Action Option, with a +10 bonus to EML. If the character’s
     * current morale state is non-normal, it returns to normal. (COMBAT 16) */
    EMPOWERED: 'Empowered',

    /**@constant {string} - MOV to 0. Only GRAPPLE_ATTACK or PASS actions. Only GRAPPLE or IGNORE defenses. */
    GRAPPLED: 'Grappled',

    /**@constant {string} - NO skills, spells & psionics. Only MOVE, PASS or REST actions. Only IGNORE defenses. */
    INCAPACITATED: 'Incapacitated',

    /**@constant {string} - TODO */
    OUTNUMBERED: 'Outnumbered',

    /**@constant {string} - MOV to 0. +20 EML for all engaged enemies. Only PASS or RISE actions. */
    PRONE: 'Prone',

    /**@constant {string} - TODO */
    SECONDARY_HAND: 'Secondary Hand',

    /**@constant {string} - NO skills, spells & psionics. Only HALF_MOVE, PASS or REST actions. Only IGNORE defenses. */
    SHOCKED: 'Shocked',

    /**@constant {string} - Incapacitated plus MOV to 0. */
    STUNNED: 'Stunned',

    /**@constant {string} - MOV to 0. NO skills, spells & psionics. Only PASS actions. Only IGNORE defenses. Plus PRONE. */
    UNCONSCIOUS: 'Unconscious'
});

/**
 * Hook types enum.
 */
export const Hook = Object.freeze({
    /**
     * @constant {string} Is triggered when a 1d100 ability roll has been executed.
     * @param actor       The actor who owns the ability.
     * @param roll        The roll information.
     * @param rollData    Additional data required for this roll.
     */
    ON_ABILITY_ROLL_D100: 'hm3.onAbilityRollD100',
    /**
     * @constant {string} Is triggered when a 1d6 ability roll has been executed.
     * @param actor       The actor who owns the ability.
     * @param roll        The roll information.
     * @param rollData    Additional data required for this roll.
     */
    ON_ABILITY_ROLL_D6: 'hm3.onAbilityRollD6',
    ON_ACTOR_PREPARE_BASE_DATA: 'hm3.onActorPrepareBaseData',
    ON_ACTOR_PREPARE_DERIVED_DATA: 'hm3.onActorPrepareDerivedData',
    ON_BLOCK_RESUME: 'hm3.onBlockResume',
    ON_DAMAGE_ROLL: 'hm3.onDamageRoll',
    ON_DODGE_RESUME: 'hm3.onDodgeResume',
    ON_DODGE_ROLL: 'hm3.onDodgeRoll',
    ON_FUMBLE_ROLL: 'hm3.onFumbleRoll',
    ON_HEALING_ROLL: 'hm3.onHealingRoll',
    ON_IGNORE_RESUME: 'hm3.onIgnoreResume',
    /**
     * @constant {string} Is triggered when an injury roll has been executed.
     * @param actor       The actor who owns the ability.
     * @param roll        The roll information.
     * @param rollData    Additional data required for this roll.
     */
    ON_INJURY_ROLL: 'hm3.onInjuryRoll',
    ON_INVOCATION_ROLL: 'hm3.onInvocationRoll',
    ON_item_PREPARE_DATA: 'hm3.onItemPrepareData',
    ON_MELEE_ATTACK: 'hm3.onMeleeAttack',
    ON_MELEE_COUNTERSTRIKE_RESUME: 'hm3.onMeleeCounterstrikeResume',
    ON_MISSILE_ATTACK_ROLL: 'hm3.onMissileAttackRoll',
    ON_MISSILE_ATTACK: 'hm3.onMissileAttack',
    ON_MISSILE_DAMAGE_ROLL: 'hm3.onMissileDamageRoll',
    ON_PSIONICS_ROLL: 'hm3.onPsionicsRoll',
    ON_SHOCK_ROLL: 'hm3.onShockRoll',
    ON_SKILL_ROLL: 'hm3.onSkillRoll',
    ON_SPELL_ROLL: 'hm3.onSpellRoll',
    ON_STUMBLE_ROLL: 'hm3.onStumbleRoll',
    ON_WEAPON_ATTACK_ROLL: 'hm3.onWeaponAttackRoll',
    ON_WEAPON_DEFEND_ROLL: 'hm3.onWeaponDefendRoll',

    /**
     * @constant {string} Is triggered before a 1d100 ability roll is executed.
     */
    PRE_ABILITY_ROLL_D100: 'hm3.preAbilityRollD100',
    /**
     * @constant {string} Is triggered before a 1d6 ability roll is executed.
     */
    PRE_ABILITY_ROLL_D6: 'hm3.preAbilityRollD6',
    PRE_BLOCK_RESUME: 'hm3.preBlockResume',
    PRE_DAMAGE_ROLL: 'hm3.preDamageRoll',
    PRE_DODGE_RESUME: 'hm3.preDodgeResume',
    PRE_DODGE_ROLL: 'hm3.preDodgeRoll',
    PRE_FUMBLE_ROLL: 'hm3.preFumbleRoll',
    PRE_HEALING_ROLL: 'hm3.preHealingRoll',
    PRE_IGNORE_RESUME: 'hm3.preIgnoreResume',
    /**
     * @constant {string} Is triggered before an injury roll is executed.
     */
    PRE_INJURY_ROLL: 'hm3.preInjuryRoll',
    PRE_INVOCATION_ROLL: 'hm3.preInvocationRoll',
    PRE_MELEE_ATTACK: 'hm3.preMeleeAttack',
    PRE_MELEE_COUNTERSTRIKE_RESUME: 'hm3.preMeleeCounterstrikeResume',
    PRE_MISSILE_ATTACK_ROLL: 'hm3.preMissileAttackRoll',
    PRE_MISSILE_ATTACK: 'hm3.preMissileAttack',
    PRE_MISSILE_DAMAGE_ROLL: 'hm3.preMissileDamageRoll',
    PRE_PSIONICS_ROLL: 'hm3.prePsionicsRoll',
    PRE_SHOCK_ROLL: 'hm3.preShockRoll',
    PRE_SKILL_ROLL: 'hm3.preSkillRoll',
    PRE_SPELL_ROLL: 'hm3.preSpellRoll',
    PRE_STUMBLE_ROLL: 'hm3.preStumbleRoll',
    PRE_WEAPON_ATTACK_ROLL: 'hm3.preWeaponAttackRoll',
    PRE_WEAPON_DEFEND_ROLL: 'hm3.preWeaponDefendRoll'
});

export const InjurySubtype = Object.freeze({
    BLOODLOSS: 'bloodloss',
    DISEASE: 'disease',
    HEALING: 'healing',
    INFECTION: 'infection',
    POISON: 'poison',
    SHOCK: 'shock',
    TOXIN: 'toxin'
});

/**
 * Item types enum.
 */
export const ItemType = Object.freeze({
    ARMORGEAR: 'armorgear',
    ARMORLOCATION: 'armorlocation',
    CONTAINERGEAR: 'containergear',
    EFFECT: 'effectgear',
    INJURY: 'injury',
    INVOCATION: 'invocation',
    MISCGEAR: 'miscgear',
    MISSILEGEAR: 'missilegear',
    PSIONIC: 'psionic',
    SKILL: 'skill',
    SPELL: 'spell',
    TRAIT: 'trait',
    WEAPONGEAR: 'weapongear'
});

/**
 * Location types enum.
 */
export const Location = Object.freeze({
    ABDOMEN: 'Abdomen',
    CALF: 'Calf',
    CUSTOM: 'Custom',
    ELBOW: 'Elbow',
    FACE: 'Face',
    FOOT: 'Foot',
    FOREARM: 'Forearm',
    GROIN: 'Groin',
    HAND: 'Hand',
    HIP: 'Hip',
    KNEE: 'Knee',
    NECK: 'Neck',
    SHOULDER: 'Shoulder',
    SKULL: 'Skull',
    TAIL: 'Tail',
    TENTACLE: 'Tentacle',
    THIGH: 'Thigh',
    THORAX: 'Thorax',
    UPPER_ARM: 'Upper Arm',
    WING: 'Wing'
});

/**
 * Range types enum.
 */
export const Range = Object.freeze({
    EXTREME: 'Extreme',
    LONG: 'Long',
    MEDIUM: 'Medium',
    SHORT: 'Short'
});

/**
 * Skill types enum.
 */
export const SkillType = Object.freeze({
    COMBAT: 'Combat',
    COMMUNICATION: 'Communication',
    CRAFT: 'Craft',
    MAGIC: 'Magic',
    PHYSICAL: 'Physical',
    RITUAL: 'Ritual'
});
