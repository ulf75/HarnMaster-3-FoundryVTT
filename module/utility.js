import {HM3} from './config.js';

/**
 * Determines whether the Skill Base Formula is valid. We perform that
 * validation here so even a skill not associated with a particular
 * actor can have its formula validated.
 *
 * A valid SB formula looks like this:
 *
 *   "@str, @int, @sta, hirin:2, ahnu, 5"
 *
 * meaning
 *   average STR, INT, and STA
 *   add 2 if sunsign hirin (modifier after colon ":")
 *   add 1 if sunsign ahnu (1 since no modifier specified)
 *   add 5 to result
 *
 * A valid formula must have exactly 3 abilities, everything else is optional.
 *
 * The result of this function is to set the "isFormulaValid" value appropriately.
 *
 * @param {Object} item
 */
export function calcSkillBase(item) {
    const sb = item.system.skillBase;

    sb.delta = 0;
    sb.isFormulaValid = true;
    if (sb.formula === '') {
        // If the formula is blank, its valid,
        // don't touch the existing value.
        return;
    }

    let actorData = null;
    if (item.actor?.system) {
        actorData = item.actor.system;
    }

    let numAbilities = 0;
    let sumBaseAbilities = 0;
    let sumModifiedAbilities = 0;
    let ssBonus = Number.MIN_SAFE_INTEGER;
    let modifier = 0;
    let resultSB = 0;

    // All parts of the formula are separated by commas,
    // and we lowercase here since the string is processed
    // case-insensitive.
    const sbParts = sb.formula.toLowerCase().split(',');

    // Formula must have at least three abilities, and therefore
    // we must have at least three parts, otherwise it is invalid
    if (sbParts.length < 3) {
        sb.isFormulaValid = false;
    } else {
        for (let param of sbParts) {
            if (!sb.isFormulaValid) break;

            param = param.trim();
            if (param != '') {
                if (param.startsWith('@')) {
                    // This is a reference to an ability

                    // Must have more than just the '@' sign
                    if (param.length === 1) {
                        sb.isFormulaValid = false;
                        break;
                    }

                    // There may only be 3 abilities
                    if (numAbilities >= 3) {
                        sb.isFormulaValid = false;
                        break;
                    }

                    if (actorData) {
                        const paramName = param.slice(1);
                        switch (paramName) {
                            case 'str':
                                sumBaseAbilities += actorData.abilities.strength.base;
                                sumModifiedAbilities += actorData.abilities.strength.modified;
                                break;

                            case 'sta':
                                sumBaseAbilities += actorData.abilities.stamina.base;
                                sumModifiedAbilities += actorData.abilities.stamina.modified;
                                break;

                            case 'dex':
                                sumBaseAbilities += actorData.abilities.dexterity.base;
                                sumModifiedAbilities += actorData.abilities.dexterity.modified;
                                break;

                            case 'agl':
                                sumBaseAbilities += actorData.abilities.agility.base;
                                sumModifiedAbilities += actorData.abilities.agility.modified;
                                break;

                            case 'int':
                                sumBaseAbilities += actorData.abilities.intelligence.base;
                                sumModifiedAbilities += actorData.abilities.intelligence.modified;
                                break;

                            case 'aur':
                                sumBaseAbilities += actorData.abilities.aura.base;
                                sumModifiedAbilities += actorData.abilities.aura.modified;
                                break;

                            case 'wil':
                                sumBaseAbilities += actorData.abilities.will.base;
                                sumModifiedAbilities += actorData.abilities.will.modified;
                                break;

                            case 'eye':
                                sumBaseAbilities += actorData.abilities.eyesight.base;
                                sumModifiedAbilities += actorData.abilities.eyesight.modified;
                                break;

                            case 'hrg':
                                sumBaseAbilities += actorData.abilities.hearing.base;
                                sumModifiedAbilities += actorData.abilities.hearing.modified;
                                break;

                            case 'sml':
                                sumBaseAbilities += actorData.abilities.smell.base;
                                sumModifiedAbilities += actorData.abilities.smell.modified;
                                break;

                            case 'voi':
                                sumBaseAbilities += actorData.abilities.voice.base;
                                sumModifiedAbilities += actorData.abilities.voice.modified;
                                break;

                            case 'cml':
                                sumBaseAbilities += actorData.abilities.comeliness.base;
                                sumModifiedAbilities += actorData.abilities.comeliness.modified;
                                break;

                            case 'mor':
                                sumBaseAbilities += actorData.abilities.morality.base;
                                sumModifiedAbilities += actorData.abilities.morality.modified;
                                break;

                            case 'end':
                                sumBaseAbilities += actorData.abilities.endurance.base;
                                sumModifiedAbilities += actorData.abilities.endurance.modified;
                                break;

                            case 'spd':
                                sumBaseAbilities += actorData.abilities.speed.base;
                                sumModifiedAbilities += actorData.abilities.speed.modified;
                                break;

                            default:
                                sb.isFormulaValid = false;
                                return;
                        }
                    }

                    numAbilities++;
                    continue;
                }

                if (param.match(/^[a-z]/)) {
                    // This is a sunsign

                    let ssParts = param.split(':');

                    // if more than 2 parts, it's invalid
                    if (ssParts.length > 2) {
                        sb.isFormulaValid = false;
                        break;
                    }

                    // if second part provided, must be a number
                    if (ssParts.length === 2 && !ssParts[1].trim().match(/[-+]?\d+/)) {
                        sb.isFormulaValid = false;
                        break;
                    }

                    if (actorData) {
                        // we must get the actor's sunsign to see if it matches. Actors may
                        // specify the sunsign as a dual sunsign, in which case the two parts
                        // must be separated either by a dash or a forward slash
                        let actorSS = actorData.sunsign.trim().toLowerCase().split(/[-\/]/);

                        // Call 'trim' function on all strings in actorSS
                        actorSS.map(Function.prototype.call, String.prototype.trim);

                        // Now, check whether our sunsign matches any of the actor's sunsigns
                        if (actorSS.includes(ssParts[0])) {
                            // We matched a character's sunsign, apply modifier
                            // Character only gets the largest sunsign bonus
                            ssBonus = Math.max(ssParts.length === 2 ? Number(ssParts[1].trim()) : 1, ssBonus);
                        }
                    }

                    continue;
                }

                // The only valid possibility left is a number.
                // If it's not a number, it's invalid.
                if (param.match(/^[-+]?\d+$/)) {
                    modifier += Number(param);
                } else {
                    sb.isFormulaValid = false;
                    break;
                }
            }
        }
    }

    if (numAbilities != 3) {
        sb.isFormulaValid = false;
    }

    if (actorData) {
        if (sb.isFormulaValid) {
            ssBonus = ssBonus > Number.MIN_SAFE_INTEGER ? ssBonus : 0;
            sb.value = Math.round(sumModifiedAbilities / 3 + Number.EPSILON) + ssBonus + modifier;
            if (sumBaseAbilities !== sumModifiedAbilities) {
                // typically the effective master level is increased/reduced by 5 for one attribute change
                // sb.delta = sumModifiedAbilities / 3 - sumBaseAbilities / 3;
                sb.delta = sumModifiedAbilities - sumBaseAbilities;
            }
        }
    }
}

export function createUniqueName(prefix, itemTypes) {
    let incr = 0;
    itemTypes.forEach((it) => {
        if (prefix === it.name) {
            // Name was found, so minimum next increment will be 1
            incr = Math.max(1, incr);
        } else {
            const match = it.name.match(`${prefix}-(\\d+)`);
            if (match) {
                // Found an existing increment, so increase it by 1
                // as the new candidate; keep it only if it is greater than
                // the max increment we have found so far.
                const newIncr = Number(match[1]) + 1;
                incr = Math.max(newIncr, incr);
            }
        }
    });

    return incr ? `${prefix}-${incr}` : prefix;
}
/**
 * Returns the path to the appropriate image name for the specified
 * item name
 *
 * @param {String} name
 */
export function getImagePath(name) {
    if (!name) return null;

    const lcName = name.toLowerCase();
    const re = /\(([^\)]+)\)/;

    for (let key of HM3.defaultItemIcons.keys()) {
        // if there is a direct match, this is best and return match
        if (lcName === key) {
            return HM3.defaultItemIcons.get(key);
        }

        // If there is a value in parenthesis, and there is a match,
        // then use that (this is for detailed-skills); e.g.
        //           Broadsword (Sword)     <== will match sword
        //           Keltan (Dagger)        <== will match dagger
        const match = re.exec(lcName);
        if (match) {
            if (key === match[1]) {
                return HM3.defaultItemIcons.get(key);
            }
        }

        // If all else fails, if the name starts with an existing key,
        // use that.  For example:
        //       Language: Harnic     <== will match "language"
        if (lcName.startsWith(key)) {
            return HM3.defaultItemIcons.get(key);
        }
    }

    return null;
}

export function getAssocSkill(name, skillsItemArray, defaultSkill) {
    if (!name || !skillsItemArray || !skillsItemArray.length) return defaultSkill;

    const skills = skillsItemArray.map((s) => s.data.name);

    const lcName = name.toLowerCase();
    const re = /\[([^\)]+)\]/i;

    // Exact Match
    let skillMatch = skills.find((s) => s.toLowerCase() === lcName);
    if (skillMatch) return skillMatch;

    // Sub-skill match (sub-skill is in square brackets)
    let subSkillMatch = re.exec(name);
    if (subSkillMatch) {
        const lcSubSkill = subSkillMatch[1].toLowerCase();
        skillMatch = skills.find((s) => s.toLowerCase() === lcSubSkill);
        if (skillMatch) return skillMatch;
    }

    return defaultSkill;
}

/**
 * String replacer function that applies the `text` string replacement
 * mechansim to an arbitrary string (named "template" here)
 * @param {String} template String containing ${} replacements
 * @param {Object} values An object containing replacement key/value pairs
 */
export function stringReplacer(template, values) {
    var keys = Object.keys(values);
    var func = Function(...keys, 'return `' + template + '`;');

    return func(...keys.map((k) => values[k]));
}

/**
 * Convert an integer into a roman numeral.  Taken from:
 * http://blog.stevenlevithan.com/archives/javascript-roman-numeral-converter
 *
 * @param {Integer} num
 */
export function romanize(num) {
    if (isNaN(num)) return NaN;
    var digits = String(+num).split(''),
        key = [
            '',
            'C',
            'CC',
            'CCC',
            'CD',
            'D',
            'DC',
            'DCC',
            'DCCC',
            'CM',
            '',
            'X',
            'XX',
            'XXX',
            'XL',
            'L',
            'LX',
            'LXX',
            'LXXX',
            'XC',
            '',
            'I',
            'II',
            'III',
            'IV',
            'V',
            'VI',
            'VII',
            'VIII',
            'IX'
        ],
        roman = '',
        i = 3;
    while (i--) roman = (key[+digits.pop() + i * 10] || '') + roman;
    return Array(+digits.join('') + 1).join('M') + roman;
}

export function aeDuration(effect) {
    const d = effect.duration;

    // Time-based duration
    if (Number.isNumeric(d.seconds)) {
        const isIndefinite = d.label === 'Indefinite';
        const isPermanent = d.label === 'Permanent';
        const start = d.startTime || game.time.worldTime;
        const elapsed = game.time.worldTime - start;
        const remaining = elapsed < 0 ? d.seconds : Math.max(d.seconds - elapsed, 0);
        //const normDuration = toNormTime(d.seconds);
        const normRemaining = isIndefinite ? 'Indefinite' : toNormTime(remaining);
        let startLabel = toNormTime(-elapsed);
        if (effect.system.status !== 'Pending') startLabel = effect.system.status;

        return {
            duration: d.seconds,
            label: normRemaining,
            remaining,
            start,
            startLabel,
            type: 'seconds'
        };
    }

    // Turn-based duration
    else if (d.rounds || d.turns) {
        // Determine the current combat duration
        const cbt = game.combat;
        const c = {round: cbt?.round ?? 0, turn: cbt?.turn ?? 0, nTurns: cbt?.turns.length ?? 1};

        // Determine how many rounds and turns have elapsed
        let elapsedRounds = Math.max(c.round - (d.startRound || 0), 0);
        let elapsedTurns = c.turn - (d.startTurn || 0);
        if (elapsedTurns < 0) {
            elapsedRounds -= 1;
            elapsedTurns += c.nTurns;
        }

        // Compute the number of rounds and turns that are remaining
        let remainingRounds = (d.rounds || 0) - elapsedRounds;
        let remainingTurns = (d.turns || 0) - elapsedTurns;
        if (remainingTurns < 0) {
            remainingRounds -= 1;
            remainingTurns += c.nTurns;
        } else if (remainingTurns > c.nTurns) {
            remainingRounds += Math.floor(remainingTurns / c.nTurns);
            remainingTurns %= c.nTurns;
        }

        // Total remaining duration
        if (remainingRounds < 0) {
            remainingRounds = 0;
            remainingTurns = 0;
        }
        const duration = (c.rounds || 0) + (c.turns || 0) / 100;
        const remaining = remainingRounds + remainingTurns / 100;

        // Remaining label
        const label = [
            remainingRounds > 0 ? `${remainingRounds} Rounds` : null,
            remainingTurns > 0 ? `${remainingTurns} Turns` : null,
            remainingRounds + remainingTurns === 0 ? 'None' : null
        ].filterJoin(', ');

        const startLabel = 'Running';

        return {
            duration,
            label,
            remaining,
            startLabel,
            type: 'turns'
        };
    }

    // No duration
    else
        return {
            type: 'none',
            duration: null,
            remaining: null,
            label: 'None'
        };
}

export function aeChanges(effect) {
    if (!effect.changes || !effect.changes.length) {
        return 'No Changes';
    }

    return effect.changes
        .map((ch) => {
            const modes = CONST.ACTIVE_EFFECT_MODES;
            const key = ch.key;
            let val = 0;
            let prefix = '';
            const parts = parseAEValue(ch.value);
            if (parts.length === 2) {
                val = truncate(Number.parseFloat(parts[1])) || 0;
                const itemName = parts[0];
                switch (key) {
                    case 'system.eph.itemEMLMod':
                        prefix = `${itemName} EML`;
                        break;

                    case 'system.eph.itemAMLMod':
                        prefix = `${itemName} AML`;
                        break;

                    case 'system.eph.itemDMLMod':
                        prefix = `${itemName} DML`;
                        break;
                }
            } else {
                val = ch.value;
                prefix = HM3.activeEffectKey[key];
            }
            switch (ch.mode) {
                case modes.ADD:
                    return `${prefix} ${val < 0 ? '-' : '+'} ${Math.abs(val)}`;
                case modes.MULTIPLY:
                    return `${prefix} x ${val}`;
                case modes.OVERRIDE:
                    return `${prefix} = ${val}`;
                case modes.UPGRADE:
                    return `${prefix} >= ${val}`;
                case modes.DOWNGRADE:
                    return `${prefix} <= ${val}`;
                default:
                    return `${prefix} custom`;
            }
        })
        .join(', ')
        .replace('Endurance', 'END')
        .replace('Strength', 'STR')
        .replace('Stamina', 'STA');
}

function toNormTime(seconds) {
    if (seconds === Number.MAX_SAFE_INTEGER) return 'None';
    const normHours = Math.floor(seconds / 3600);
    const remSeconds = seconds % 3600;
    const normMinutes = Number(Math.floor(remSeconds / 60))
        .toString()
        .padStart(2, '0');
    const normSeconds = Number(remSeconds % 60)
        .toString()
        .padStart(2, '0');
    return `${normHours}:${normMinutes}:${normSeconds}`;
}

export function executeMacroScript(macro, {actor, token, rollResult, rollData, item} = {}) {
    let speaker = null;
    if (!actor) {
        if (!token) {
            speaker = ChatMessage.getSpeaker();
            actor = game.actors.get(speaker.actor);
            token = actor.isToken ? actor.token : null;
        } else {
            actor = token.actor;
            speaker = ChatMessage.getSpeaker({token: token.document});
        }
    }

    speaker = speaker || ChatMessage.getSpeaker({actor: actor});

    token = actor.isToken && !token ? actor.token : token;
    token = token || (canvas.ready ? canvas.tokens.get(speaker.token) : null);

    const context = {
        speaker: speaker,
        actor: actor,
        token: token,
        character: game.user.character,
        rollResult: rollResult,
        scene: canvas.scene
    };

    if (rollData) context.rollData = rollData;
    if (item) context.item = item;

    // Attempt script execution
    const asyncFunction = macro.command.includes('await') ? 'async' : '';
    const itemParam = item ? ', item' : '';
    const rollDataParam = rollData ? ', rollData' : '';
    let result = null;
    try {
        result = new Function(`"use strict";
            return (${asyncFunction} function ({speaker, actor, token, character, rollResult ${itemParam} ${rollDataParam}}={}) {
                ${macro.command}
                });`)().call(macro, context);
    } catch (err) {
        ui.notifications.error(`There was an error in your macro syntax. See the console (F12) for details`);
        console.error(err);
    }

    return result;
}

export function parseAEValue(string) {
    const lastColon = string.lastIndexOf(':');
    if (lastColon === -1) return [string];
    const preString = string.slice(0, lastColon).trim();
    const postString = string.slice(lastColon + 1).trim();
    return [preString, postString];
}

/**
 * Truncates the decimal places of a number.
 * @param {number} value - The actual number to be truncated.
 * @param {number} digits - The number of decimal places to be truncated to (defaults to 2).
 * @returns {number} The truncated number.
 */
export function truncate(value, digits = 2) {
    return Math.round((value + Number.EPSILON) * 10 ** digits) / 10 ** digits;
}

/**
 * Returns the actor of the given macro id.
 * @param {Macro} macro - The macro
 * @returns {ActorHM3} - actor
 */
export function getActorFromMacro(macro) {
    return game.actors.contents.find((a) => macro.getFlag('hm3', 'ownerId') === a.id);
}

/**
 * It is technically possible for a starting character with very high attributes to begin
 * play with excessively high Mastery Levels. To help balance the game, if the OML of any
 *  skill other than a Script or Language exceeds 70, it should be truncated.
 *
 * OML truncation only applies to starting characters. It does not affect in-game skill
 * development.
 * @link https://www.lythia.com/warflail/downloads/HMA_Rulebook_v1.4.pdf
 * @param {number} value
 * @returns truncated number
 */
export function truncatedOML(value) {
    if (!game.settings.get('hm3', 'truncateHighValueSkills')) return value;
    if (value <= 70) return value;
    else if (value <= 72) return 71;
    else if (value <= 74) return 72;
    else if (value <= 76) return 73;
    else if (value <= 78) return 74;
    else if (value <= 80) return 75;
    else if (value <= 82) return 76;
    else if (value <= 84) return 77;
    else if (value <= 86) return 78;
    else if (value <= 88) return 79;
    else if (value <= 90) return 80;
    else if (value <= 94) return 81;
    else if (value <= 98) return 82;
    else if (value <= 102) return 83;
    else if (value <= 106) return 84;
    else if (value <= 110) return 85;
    else if (value <= 114) return 86;
    else if (value <= 118) return 87;
    else return 88;
}

export function beautify(text) {
    if (typeof js_beautify === 'function') {
        return js_beautify(text, {
            'indent_size': 4,
            'indent_char': ' ',
            'indent_with_tabs': false,
            'editorconfig': false,
            'eol': '\n',
            'end_with_newline': false,
            'indent_level': 0,
            'preserve_newlines': true,
            'max_preserve_newlines': 10,
            'space_in_paren': false,
            'space_in_empty_paren': false,
            'jslint_happy': false,
            'space_after_anon_function': false,
            'space_after_named_function': false,
            'brace_style': 'collapse',
            'unindent_chained_methods': false,
            'break_chained_methods': false,
            'keep_array_indentation': false,
            'unescape_strings': false,
            'wrap_line_length': 0,
            'e4x': false,
            'comma_first': false,
            'operator_position': 'before-newline',
            'indent_empty_lines': false,
            'templating': ['auto']
        });
    } else {
        return text.trim();
    }
}
