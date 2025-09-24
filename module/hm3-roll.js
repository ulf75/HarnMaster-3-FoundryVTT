// @ts-check

/**
 *
 */
export class RollHM3 extends Roll {
    constructor(formula, data = {}, options = {}) {
        super(formula, data, options);

        // console.assert(options.name, '');
        // console.assert(options.type, '');

        this._target = options.target ?? null;
        this._check = this._target !== null ? (formula.toLowerCase().includes('d100') ? 'd100' : 'd6') : null;

        this._effTarget = null;
        this._maximum = -1;
        this._minimum = -1;
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

    /**
     * @type {boolean}
     */
    get debug() {
        // @ts-expect-error
        return game.settings?.get('hm3', 'debugMode');
    }

    /**
     * @type {boolean}
     */
    get cheating() {
        // @ts-expect-error
        return game.settings?.get('hm3', 'cheatMode');
    }

    /**
     * @type {boolean}
     */
    get autocheating() {
        return (
            !!this._effTarget &&
            (this._targetCritical !== null || this._targetSubstantial !== null || this._targetSuccess !== null)
        );
    }

    /**
     * @type {boolean}
     */
    get isCritical() {
        if (this._check === 'd6') return false;
        if (this._effTarget !== null) {
            return this.total % 5 === 0;
        }
        return false;
    }

    /**
     * @type {boolean}
     */
    get isSubstantial() {
        if (this._check === 'd6') return false;
        if (this._effTarget !== null) {
            return this.total <= this._effTarget / 2 || this.total > this._effTarget + (100 - this._effTarget) / 2;
        }
        return false;
    }

    /**
     * @type {boolean}
     */
    get isSuccess() {
        if (this._effTarget !== null) {
            return this.total <= this._effTarget;
        }
        return false;
    }
    /**
     * @type {number}
     * @override
     */
    get total() {
        return super.total ?? -1;
    }

    /**
     * @type {number}
     */
    get minimum() {
        return this._minimum;
    }

    /**
     * @type {number}
     */
    get maximum() {
        return this._maximum;
    }

    /**
     * @type {string}
     */
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
        return '';
    }

    /**
     *
     * @param {*} param0
     * @returns
     * @override
     */
    async evaluate({
        minimize = false,
        maximize = false,
        allowStrings = false,
        allowInteractive = true,
        ...options
    } = {}) {
        if (this.autocheating && !this.isDeterministic) {
            return this._cheatRoll({minimize, maximize, allowStrings, allowInteractive, options});
        } else if (this.cheating && !this.isDeterministic) {
            await this._minMax();

            const data = await hm3.socket.executeAsGM(
                'cheating',
                this._check ?? 'roll',
                this._name,
                this._type,
                this._formula,
                this._minimum,
                this._maximum,
                this._effTarget
            );

            this._targetCritical = data.targetCritical ?? null;
            this._targetSubstantial = data.targetSubstantial ?? null;
            this._targetSuccess = data.targetSuccess ?? null;
            this._targetValue = data.targetValue ?? null;

            return this._cheatRoll({minimize, maximize, allowStrings, allowInteractive, options});
        }

        return super.evaluate({minimize, maximize, allowStrings, allowInteractive, ...options});
    }

    /**
     *
     * @param {*} param0
     * @returns
     * @protected
     */
    async _cheatRoll({
        minimize = false,
        maximize = false,
        allowStrings = false,
        allowInteractive = true,
        ...options
    } = {}) {
        let cnt = 1000;
        let obj = null;
        do {
            this._reset();
            obj = await super.evaluate({minimize, maximize, allowStrings, allowInteractive, ...options});
        } while (
            --cnt > 0 &&
            ((this._targetCritical !== null ? this._targetCritical !== this.isCritical : false) ||
                (this._targetSubstantial !== null ? this._targetSubstantial !== this.isSubstantial : false) ||
                (this._targetSuccess !== null ? this._targetSuccess !== this.isSuccess : false) ||
                (this._targetValue !== null ? this._targetValue !== this.total : false))
        );

        return obj;
    }

    /**
     * @protected
     */
    _reset() {
        this._dice = [];
        this.terms.forEach((element) => {
            // @ts-expect-error
            element._evaluated = false;
            // @ts-expect-error
            element.results = [];
        });
        this._evaluated = false;
        // @ts-expect-error
        this._resolver = undefined;
        this._root = undefined;
        this._total = undefined;
    }

    /**
     * @protected
     */
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
