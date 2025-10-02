// @ts-check

import {onManageActiveEffect} from '../effect.js';
import {ArcaneType} from '../hm3-types.js';
import {aeChanges, aeDuration} from '../utility.js';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ItemSheetHM3v2 extends ItemSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['hm3', 'sheet', 'item', 'item-v2'],
            width: 650,
            height: 740,
            tabs: [{navSelector: '.sheet-tabs-v2', contentSelector: '.sheet-body-v2', initial: 'properties'}],
            scrollY: ['.main-content'],
            resizable: false
        });
    }

    /** @override */
    get template() {
        const path = 'systems/hm3/templates/item-v2';
        return `${path}/${this.item.type}-sheet.hbs`;
    }

    /**
     * Is this PseudoDocument sheet editable by the current User?
     * This is governed by the editPermission threshold configured for the class.
     * @type {boolean}
     */
    // get isEditable() {
    //     if (game.packs?.get(this.item.pack)?.locked) return false;
    //     return this.item.testUserPermission(game.user, this.options.editPermission);
    // }

    /** @inheritDoc */
    async _prepareContext(options) {
        return {
            ...(await super._prepareContext(options)),
            document: this.document,
            editable: this.isEditable,
            options: this.options
        };
    }

    /* -------------------------------------------- */

    /** @override */
    async getData(options = {}) {
        options.classes.push(this.item.type.toLowerCase().replace(' ', '-'));
        if (this.item.system.type) options.classes.push(this.item.system.type.toLowerCase().replace(' ', '-'));
        if (this.item.system.arcane?.isArtifact && (this.item.system.arcane.isOwnerAware || game.user?.isGM))
            options.classes.push('artifact');

        let context = foundry.utils.mergeObject(super.getData(options), {item: null});
        context = foundry.utils.mergeObject(context, {
            config: CONFIG.HM3,
            editable: this.isEditable && this._mode === this.constructor.MODES.EDIT,
            effects: this.item.effects.map((effect) => {
                return {
                    'changes': aeChanges(effect),
                    'disabled': effect.disabled,
                    'duration': aeDuration(effect),
                    'id': effect.id,
                    'img': effect.img,
                    'name': effect.name,
                    'sourceName': effect.sourceName
                };
            }),
            hasActor: !!this.actor,
            hasCombatSkills: false,
            hasRwPermission: game.user?.isGM || !game.settings?.get('hm3', 'strictGmMode'),
            iproxy: this.item.proxy,
            isGM: game.user?.isGM,
            isGridDistanceUnits: game.settings?.get('hm3', 'distanceUnits') === 'grid',
            itemType: this.item.type,
            macroTypes: [
                {key: 'chat', label: 'Chat'},
                {key: 'script', label: 'Script'}
            ],
            strictMode: game.settings?.get('hm3', 'strictGmMode')
        });
        context = foundry.utils.mergeObject(context, {
            arcane: {
                choices: [{key: 'Minor'}, {key: 'Major'}],
                durations: [{key: 'Indefinite'}, {key: 'Permanent'}],
                powers: (context.iproxy.arcaneType === ArcaneType.MINOR
                    ? JSON.parse(JSON.stringify(hm3.config.arcanePowers)).filter(
                          (p) => p.minor && p.validFor.includes(context.iproxy.type)
                      )
                    : JSON.parse(JSON.stringify(hm3.config.arcanePowers)).filter(
                          (p) => p.major >= 0 && p.validFor.includes(context.iproxy.type)
                      )
                ).map((p) => {
                    p.label = `${p.label}${p.legacy ? '*' : ''}${p.lvl > 0 ? ` (${p.lvl})` : ''} ${
                        p.major > 0 && context.iproxy.arcaneType === ArcaneType.MAJOR ? `Costs: ${p.major}` : ''
                    }`;
                    return p;
                })
            },
            cssClass: context.editable ? 'editable' : this.isEditable ? 'interactable' : 'locked',
            descriptionHTML: await TextEditor.enrichHTML(this.object.system.description, {
                secrets: game.user?.isGM,
                relativeTo: this.object.system
            })
        });

        return context;
    }

    /* -------------------------------------------- */

    /**
     * @param {JQuery} html
     * @override
     * */
    activateListeners(html) {
        super.activateListeners(html);

        html.find('.profile-img').on('click', this._onShowProfileImage.bind(this));

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

    static MODES = {
        PLAY: 1,
        EDIT: 2
    };

    _mode = null;

    /** @override */
    async _render(force, {mode, ...options} = {}) {
        if (mode === undefined && options.renderContext === 'createItem') mode = this.constructor.MODES.EDIT;
        this._mode = mode ?? this._mode ?? this.constructor.MODES.PLAY;
        if (this.rendered) {
            const toggle = this.element[0].querySelector('.window-header .mode-slider');
            toggle.checked = this._mode === this.constructor.MODES.EDIT;
        }
        return super._render(force, options);
    }

    /** @inheritDoc */
    async _renderOuter() {
        const html = await super._renderOuter();
        const header = html[0].querySelector('.window-header');

        // Adjust header buttons.
        header.querySelectorAll('.header-button').forEach((btn) => {
            const label = btn.querySelector(':scope > i').nextSibling;
            btn.dataset.tooltip = label.textContent;
            btn.dataset.tooltipDirection = 'UP';
            btn.setAttribute('aria-label', label.textContent);
            btn.addEventListener('dblclick', (event) => event.stopPropagation());
            label.remove();
        });

        if (!game.user?.isGM && this.document.limited) {
            html[0].classList.add('limited');
            return html;
        }

        // Add edit <-> play slide toggle.
        if (this.isEditable) {
            const toggle = document.createElement('slide-toggle');
            toggle.checked = this._mode === this.constructor.MODES.EDIT;
            toggle.classList.add('mode-slider');
            toggle.dataset.tooltip = 'hm3.SheetModeEdit';
            toggle.dataset.tooltipDirection = 'UP';
            toggle.setAttribute('aria-label', game.i18n?.localize('hm3.SheetModeEdit'));
            toggle.addEventListener('change', this._onChangeSheetMode.bind(this));
            toggle.addEventListener('dblclick', (event) => event.stopPropagation());
            header.insertAdjacentElement('afterbegin', toggle);
        }

        // Document UUID link.
        const firstButton = header.querySelector('.header-button');
        const idLink = header.querySelector('.document-id-link');
        if (idLink) {
            firstButton?.insertAdjacentElement('beforebegin', idLink);
            idLink.classList.add('pseudo-header-button');
            idLink.dataset.tooltipDirection = 'UP';
        }

        return html;
    }

    async _onChangeSheetMode(event) {
        const {MODES} = this.constructor;
        const toggle = event.currentTarget;
        const label = game.i18n?.localize(`hm3.SheetMode${toggle.checked ? 'Play' : 'Edit'}`);
        toggle.dataset.tooltip = label;
        toggle.setAttribute('aria-label', label);
        this._mode = toggle.checked ? MODES.EDIT : MODES.PLAY;
        await this.submit();
        this.render();
    }

    _onShowProfileImage() {
        // Play mode only.
        if (this._mode === this.constructor.MODES.PLAY || !game.user?.isGM) {
            const img = this.item.img;
            if (game.release.generation < 13) {
                new ImagePopout(img, {title: this.item.name, uuid: this.item.uuid}).render(true);
            } else {
                new foundry.applications.apps.ImagePopout({
                    src: img,
                    uuid: this.item.uuid,
                    window: {title: this.item.name}
                }).render({force: true});
            }
        }
    }
}
