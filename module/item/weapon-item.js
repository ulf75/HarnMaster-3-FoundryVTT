export class WeaponItem {
    constructor(item) {
        this._item = item;

        // Arcane powers
        this.powers = {
            Swordbreaker: this._item.getArcanePower(game.hm3.ArcanePower.SWORDBREAKER),
            WardAkana: this._item.getArcanePower(game.hm3.ArcanePower.WARD_AKANA)
        };
    }

    get name() {
        return this._item.name;
    }

    get wq() {
        return this._item.system.weaponQuality + (this._item.system.wqModifier || 0);
    }

    get isArtifact() {
        return this._item.isArtifact;
    }

    get isMinorArtifact() {
        return this._item.isMinorArtifact;
    }

    get isMajorArtifact() {
        return this._item.isMajorArtifact;
    }

    /**
     * Get the weapon's break check formula.
     * @param {WeaponItem} opposingWeapon - The weapon being opposed.
     * @return {string} The break check formula.
     * */
    getBreakCheckFormula(opposingWeapon) {
        if (opposingWeapon.powers.Swordbreaker.isOwnerAware) {
            return (
                `3d6` + `${opposingWeapon.powers.Swordbreaker ? ' + 1d' + opposingWeapon.powers.Swordbreaker.lvl : ''}`
            );
        } else return '3d6';
    }
}
