export class RollHM3 extends Roll {
    constructor(formula, data = {}, options = {}) {
        super(formula, data, options);

        console.assert(options.name, '');
        console.assert(options.type, '');

        this._target = options.target ?? null;
        this._check = this._target !== null ? (formula.toLowerCase().includes('d100') ? 'd100' : 'd6') : null;

        this._effTarget = null;
        this._maximum = null;
        this._minimum = null;
        this._name = options.name ?? 'Unknown';
        this._targetCode = options.targetCode ?? null;
        this._targetCritical = options.targetCritical ?? null;
        this._targetSubstantial = options.targetSubstantial ?? null;
        this._targetSuccess = options.targetSuccess ?? null;
        this._targetValue = null;
        this._type = options.type ?? 'Unknown';

        if (this._target !== null && this._check === 'd100') {
            this._effTarget = Math.max(Math.min(this._target, 95), 5);
        } else if (this._target !== null && this._check === 'd6') {
            this._effTarget = Math.max(Math.min(this._target, 18), 3);
        }
    }

    get debug() {
        return game.settings.get('hm3', 'debugMode');
    }

    get cheating() {
        return game.settings.get('hm3', 'cheatMode');
    }

    get autocheating() {
        return (
            !!this._effTarget &&
            (this._targetCritical !== null || this._targetSubstantial !== null || this._targetSuccess !== null)
        );
    }

    get isCritical() {
        if (this._check === 'd6') return false;
        if (this._effTarget !== null) {
            return this.total % 5 === 0;
        }
    }

    get isSubstantial() {
        if (this._check === 'd6') return false;
        if (this._effTarget !== null) {
            return this.total <= this._effTarget / 2 || this.total > this._effTarget + (100 - this._effTarget) / 2;
        }
    }

    get isSuccess() {
        if (this._effTarget !== null) {
            return this.total <= this._effTarget;
        }
    }

    get minimum() {
        return this._minimum;
    }

    get maximum() {
        return this._maximum;
    }

    get code() {
        if (this._check === 'd100') {
            let code = 'm';
            if (this.isCritical) code = 'c';
            else if (this.isSubstantial) code = 's';
            if (this.isSuccess) code += 's';
            else code += 'f';
            return code;
        } else if (this._check === 'd6') {
            if (this.isSuccess) return 's';
            else return 'f';
        }
    }

    async evaluate({
        minimize = false,
        maximize = false,
        allowStrings = false,
        allowInteractive = true,
        ...options
    } = {}) {
        if (this.autocheating) {
            return this._cheatRoll({minimize, maximize, allowStrings, allowInteractive, options});
        } else if (this.cheating && !!this._effTarget && !!this._check) {
            await this._minMax();
            const data = await game.hm3.socket.executeAsGM(
                'cheating',
                this._check,
                this._name,
                this._type,
                this._formula,
                this._minimum,
                this._maximum,
                this._effTarget
            );
            this._targetCritical = data.targetCritical;
            this._targetSubstantial = data.targetSubstantial;
            this._targetSuccess = data.targetSuccess;
            return this._cheatRoll({minimize, maximize, allowStrings, allowInteractive, options});
        } else if (this.cheating) {
            await this._minMax();
            const data = await game.hm3.socket.executeAsGM(
                'cheating',
                'roll',
                this._name,
                this._type,
                this._formula,
                this._minimum,
                this._maximum,
                this._effTarget
            );
            this._targetValue = data.targetValue;
            return this._cheatRoll({minimize, maximize, allowStrings, allowInteractive, options});
        }

        return super.evaluate({minimize, maximize, allowStrings, allowInteractive, options});
    }

    async _cheatRoll({
        minimize = false,
        maximize = false,
        allowStrings = false,
        allowInteractive = true,
        ...options
    } = {}) {
        let obj = null;
        do {
            this._reset();
            obj = await super.evaluate({minimize, maximize, allowStrings, allowInteractive, options});
        } while (
            (this._targetCritical !== null ? this._targetCritical !== this.isCritical : false) ||
            (this._targetSubstantial !== null ? this._targetSubstantial !== this.isSubstantial : false) ||
            (this._targetSuccess !== null ? this._targetSuccess !== this.isSuccess : false) ||
            (this._targetValue !== null ? this._targetValue !== this.total : false)
        );

        return obj;
    }

    _reset() {
        this._dice = [];
        this.terms.forEach((element) => {
            element._evaluated = false;
            element.results = [];
        });
        this._evaluated = false;
        this._resolver = undefined;
        this._root = undefined;
        this._total = undefined;
    }

    async _minMax() {
        this._minimum = (
            await super.evaluate({
                minimize: true,
                maximize: false,
                allowStrings: false,
                allowInteractive: false
            })
        ).total;
        this._reset();
        this._maximum = (
            await super.evaluate({
                minimize: false,
                maximize: true,
                allowStrings: false,
                allowInteractive: false
            })
        ).total;
        this._reset();
    }
}
