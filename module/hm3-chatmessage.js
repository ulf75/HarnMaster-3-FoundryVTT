export class ChatMessageHM3 extends ChatMessage {
    _highlighted = null;

    static getSpeaker({scene, actor, token, alias, user} = {}) {
        if (user) return this._getSpeakerFromUser({scene, user, alias});
        else return super.getSpeaker({scene, actor, token, alias});
    }

    /** @inheritDoc */
    async getHTML(options = {}) {
        const html = await super.getHTML(options);
        const element = html instanceof HTMLElement ? html : html[0];

        if (foundry.utils.getType(this.system?.getHTML) === 'function') {
            await this.system.getHTML(element, options);
            return html;
        }

        // this._displayChatActionButtons(html);
        // this._highlightCriticalSuccessFailure(html);
        // if (game.settings.get('dnd5e', 'autoCollapseItemCards')) {
        //     html.find('.description.collapsible').each((i, el) => el.classList.add('collapsed'));
        // }

        this._enrichChatCard(element);
        // this._collapseTrays(element);
        // this._activateActivityListeners(element);
        // dnd5e.bastion._activateChatListeners(this, element);

        /**
         * A hook event that fires after hm3-specific chat message modifications have completed.
         * @function hm3.renderChatMessage
         * @memberof hookEvents
         * @param {ChatMessageHM3} message  Chat message being rendered.
         * @param {HTMLElement} html       HTML contents of the message.
         */
        Hooks.callAll('hm3.renderChatMessage', this, element);

        return html;
    }

    _enrichChatCard(html) {
        // Header matter
        const actor = this.getAssociatedActor();

        let img;
        let nameText;
        if (this.isContentVisible) {
            img = actor?.img ?? this.author.avatar;
            nameText = this.alias;
        } else {
            img = this.author.avatar;
            nameText = this.author.name;
        }

        const avatar = document.createElement('a');
        avatar.classList.add('avatar');
        if (actor) avatar.dataset.uuid = actor.uuid;
        const avatarImg = document.createElement('img');
        Object.assign(avatarImg, {src: img, alt: nameText});
        avatar.append(avatarImg);

        const name = document.createElement('span');
        name.classList.add('name-stacked');
        const title = document.createElement('span');
        title.classList.add('title');
        title.append(nameText);
        name.append(title);

        const subtitle = document.createElement('span');
        subtitle.classList.add('subtitle');
        if (this.whisper.length) subtitle.innerText = html.querySelector('.whisper-to')?.innerText ?? '';
        if (nameText !== this.author?.name && !subtitle.innerText.length) subtitle.innerText = this.author?.name ?? '';

        name.appendChild(subtitle);

        const sender = html.querySelector('.message-sender');
        sender?.replaceChildren(avatar, name);
        html.querySelector('.whisper-to')?.remove();

        // Context menu
        const metadata = html.querySelector('.message-metadata');
        const deleteButton = metadata.querySelector('.message-delete');
        if (!game.user.isGM) deleteButton?.remove();
        else deleteButton?.querySelector('i').classList.add('fa-fw');
        const anchor = document.createElement('a');
        // anchor.setAttribute('aria-label', game.i18n.localize('DND5E.AdditionalControls'));
        anchor.classList.add('chat-control');
        anchor.dataset.contextMenu = '';
        anchor.innerHTML = '<i class="fas fa-ellipsis-vertical fa-fw"></i>';
        metadata.appendChild(anchor);

        // SVG icons
        html.querySelectorAll('i.dnd5e-icon').forEach((el) => {
            const icon = document.createElement('dnd5e-icon');
            icon.src = el.dataset.src;
            el.replaceWith(icon);
        });

        // Enriched roll flavor
        //   const roll = this.getFlag('dnd5e', 'roll');
        //   const item = this.getAssociatedItem();
        //   const activity = this.getAssociatedActivity();
        //   if (this.isContentVisible && item && roll) {
        //       const isCritical = roll.type === 'damage' && this.rolls[0]?.isCritical;
        //       const subtitle =
        //           roll.type === 'damage'
        //               ? isCritical
        //                   ? game.i18n.localize('DND5E.CriticalHit')
        //                   : activity?.damageFlavor ?? game.i18n.localize('DND5E.DamageRoll')
        //               : roll.type === 'attack'
        //               ? activity?.getActionLabel(roll.attackMode) ?? ''
        //               : item.system.type?.label ?? game.i18n.localize(CONFIG.Item.typeLabels[item.type]);
        //       const flavor = document.createElement('div');
        //       flavor.classList.add('dnd5e2', 'chat-card');
        //       flavor.innerHTML = `
        //   <section class="card-header description ${isCritical ? 'critical' : ''}">
        //     <header class="summary">
        //       <div class="name-stacked">
        //         <span class="subtitle">${subtitle}</span>
        //       </div>
        //     </header>
        //   </section>
        // `;
        //       const icon = document.createElement('img');
        //       Object.assign(icon, {className: 'gold-icon', src: item.img, alt: item.name});
        //       flavor.querySelector('header').insertAdjacentElement('afterbegin', icon);
        //       const title = document.createElement('span');
        //       title.classList.add('title');
        //       title.append(item.name);
        //       flavor.querySelector('.name-stacked').insertAdjacentElement('afterbegin', title);
        //       html.querySelector('.message-header .flavor-text').remove();
        //       html.querySelector('.message-content').insertAdjacentElement('afterbegin', flavor);
        //   }

        //   // Attack targets
        //   this._enrichAttackTargets(html);

        //   // Dice rolls
        //   if (this.isContentVisible) {
        //       html.querySelectorAll('.dice-tooltip').forEach((el, i) => {
        //           if (!(roll instanceof DamageRoll) && this.rolls[i]) this._enrichRollTooltip(this.rolls[i], el);
        //       });
        //       this._enrichDamageTooltip(
        //           this.rolls.filter((r) => r instanceof DamageRoll),
        //           html
        //       );
        //       this._enrichSaveTooltip(html);
        //       this._enrichEnchantmentTooltip(html);
        //       html.querySelectorAll('.dice-roll').forEach((el) =>
        //           el.addEventListener('click', this._onClickDiceRoll.bind(this))
        //       );
        //   } else {
        //       html.querySelectorAll('.dice-roll').forEach((el) => el.classList.add('secret-roll'));
        //   }

        //   // Effects tray
        //   this._enrichUsageEffects(html);

        avatar.addEventListener('click', this._onTargetMouseDown.bind(this));
        avatar.addEventListener('pointerover', this._onTargetHoverIn.bind(this));
        avatar.addEventListener('pointerout', this._onTargetHoverOut.bind(this));
    }

    getAssociatedActor() {
        if (this.speaker.scene && this.speaker.token) {
            const scene = game.scenes.get(this.speaker.scene);
            const token = scene?.tokens.get(this.speaker.token);
            if (token) return token.actor;
        }
        return game.actors.get(this.speaker.actor);
    }

    _activateActivityListeners(html) {
        this.getAssociatedActivity()?.activateChatListeners(this, html);
    }

    /**
     * Handle target selection and panning.
     * @param {Event} event   The triggering event.
     * @returns {Promise}     A promise that resolves once the canvas pan has completed.
     * @protected
     */
    async _onTargetMouseDown(event) {
        event.stopPropagation();
        const uuid = event.currentTarget.dataset.uuid;
        const actor = fromUuidSync(uuid);
        const token = actor?.token?.object ?? actor?.getActiveTokens()[0];
        if (!token || !actor.testUserPermission(game.user, 'LIMITED')) {
            return;
        }

        const releaseOthers = !event.shiftKey;
        if (token.controlled) token.release();
        else {
            token.control({releaseOthers});
            return canvas.animatePan(token.center);
        }
    }

    /* -------------------------------------------- */

    /**
     * Handle hovering over a target in an attack roll message.
     * @param {Event} event     Initiating hover event.
     * @protected
     */
    _onTargetHoverIn(event) {
        const uuid = event.currentTarget.dataset.uuid;
        const actor = fromUuidSync(uuid);
        const token = actor?.token?.object ?? actor?.getActiveTokens()[0];
        if (token && token.isVisible) {
            if (!token.controlled) token._onHoverIn(event, {hoverOutOthers: true});
            this._highlighted = token;
        }
    }

    /* -------------------------------------------- */

    /**
     * Handle hovering out of a target in an attack roll message.
     * @param {Event} event     Initiating hover event.
     * @protected
     */
    _onTargetHoverOut(event) {
        if (this._highlighted) this._highlighted._onHoverOut(event);
        this._highlighted = null;
    }
}
