/**
 * Aspect types enum.
 */
export const AspectTypes = Object.freeze({
    BLUNT: 'Blunt',
    EDGED: 'Edged',
    FIRE: 'Fire',
    PIERCING: 'Piercing'
});

/**
 * Hook types enum.
 */
export const HookTypes = Object.freeze({
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
    ON_item_PREPARE_DATA: 'hm3.onITEMPrepareData',
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

/**
 * Item types enum.
 */
export const ItemTypes = Object.freeze({
    ARMORGEAR: 'armorgear',
    ARMORLOCATION: 'armorlocation',
    CONTAINERGEAR: 'containergear',
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
export const LocationTypes = Object.freeze({
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
export const RangeTypes = Object.freeze({
    EXTREME: 'Extreme',
    LONG: 'Long',
    MEDIUM: 'Medium',
    SHORT: 'Short'
});

/**
 * Skill types enum.
 */
export const SkillTypes = Object.freeze({
    COMBAT: 'Combat',
    COMMUNICATION: 'Communication',
    CRAFT: 'Craft',
    MAGIC: 'Magic',
    PHYSICAL: 'Physical',
    RITUAL: 'Ritual'
});