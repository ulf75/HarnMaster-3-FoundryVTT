import {HarnMasterBaseActorSheet} from './base-actor-sheet.js';

/**
 * Extend the base HarnMasterBaseActorSheet with some very simple modifications
 * @extends {HarnMasterBaseActorSheet}
 */
export class CharacterSheetHM3 extends HarnMasterBaseActorSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['hm3', 'sheet', 'actor', 'character'],
            width: 810,
            height: 650,
            tabs: [{navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'facade'}]
        });
    }

    /**
     * Get the correct HTML template path to use for rendering this particular sheet
     * @type {String}
     */
    get template() {
        if (!game.user.isGM && this.actor.limited) {
            return 'systems/hm3/templates/actor/character-limited.html';
        } else {
            return 'systems/hm3/templates/actor/character-sheet.html';
        }
    }
}
