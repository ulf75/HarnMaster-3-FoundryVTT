import {BaseActorSheetHM3v2} from './base-actor-sheet-v2.js';

/**
 * Extend the base BaseActorSheetHM3v2 with some very simple modifications
 * @extends {BaseActorSheetHM3v2}
 */
export class ContainerSheetHM3v2 extends BaseActorSheetHM3v2 {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['hm3', 'sheet', 'actor', 'actor-v2', 'container'],
            width: 700,
            height: 640,
            tabs: [{navSelector: '.sheet-tabs-v2', contentSelector: '.sheet-body-v2', initial: 'facade'}],
            scrollY: ['.main-content'],
            resizable: false
        });
    }

    /* -------------------------------------------- */

    /**
     * Get the correct HTML template path to use for rendering this particular sheet
     * @type {String}
     */
    get template() {
        if (!game.user.isGM && this.actor.limited) {
            return 'systems/hm3/templates/actor-v2/container-limited.hbs';
        } else {
            return 'systems/hm3/templates/actor-v2/container-sheet.hbs';
        }
    }
}
