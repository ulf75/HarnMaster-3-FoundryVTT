import {BaseActorSheetHM3v2} from './base-actor-sheet-v2.js';

/**
 * Extend the base BaseActorSheetHM3v2 with some very simple modifications
 * @extends {BaseActorSheetHM3v2}
 */
export class CharacterSheetHM3v2 extends BaseActorSheetHM3v2 {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['hm3', 'sheet', 'actor', 'character'],
            width: 810,
            height: 850,
            tabs: [{navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'facade'}],
            resizable: true
        });
    }

    /**
     * Get the correct HTML template path to use for rendering this particular sheet
     * @type {String}
     */
    get template() {
        if (!game.user.isGM && this.actor.limited) {
            return 'systems/hm3/templates/actor-v2/character-limited.hbs';
        } else {
            return 'systems/hm3/templates/actor-v2/character-sheet.hbs';
        }
    }
}
