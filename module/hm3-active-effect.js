export class ActiveEffectHM3 extends ActiveEffect {
    /** @override */
    _prepareDuration() {
        const ret = super._prepareDuration();

        if (ret.duration === game.hm3.CONST.TIME.INDEFINITE) ret.label = 'Indefinite';
        else if (ret.duration === game.hm3.CONST.TIME.PERMANENT) ret.label = 'Permanent';

        return ret;
    }

    async _preUpdate(changed, options, user) {
        if (changed.changes && changed.changes.length > 0) {
            for (const change of changed.changes) {
                if (change.priority === undefined || change.priority === '') {
                    change.priority = (change.mode * 10).toString();
                }
            }
        }
        return super._preUpdate(changed, options, user);
    }

    get started() {
        return this.duration?.startTime <= game.time.worldTime;
    }

    /** @override */
    get isSuppressed() {
        return !this.started;
    }

    get hidden() {
        let hidden = !!this.flags?.hm3?.hidden;
        if (this.parent instanceof Item) hidden ||= !!this.parent.system.hidden;
        return hidden;
    }

    get selfDestroy() {
        return !!this.flags?.hm3?.selfDestroy;
    }

    get unique() {
        return !!this.flags?.hm3?.unique;
    }

    hasCreateMacro() {
        return this.flags?.effectmacro?.onCreate?.script && this.flags?.effectmacro?.onCreate?.script?.trim() !== '';
    }

    hasDeleteMacro() {
        return this.flags?.effectmacro?.onDelete?.script && this.flags?.effectmacro?.onDelete?.script?.trim() !== '';
    }

    hasDisableMacro() {
        return this.flags?.effectmacro?.onDisable?.script && this.flags?.effectmacro?.onDisable?.script?.trim() !== '';
    }

    hasTurnStartMacro() {
        return (
            this.flags?.effectmacro?.onTurnStart?.script && this.flags?.effectmacro?.onTurnStart?.script?.trim() !== ''
        );
    }
}
