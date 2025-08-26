export class RollHM3 extends Roll {
    static D100_RESULTS = [];
    static D6_RESULTS = [];

    constructor(formula, data = {}, options = {}) {
        super(formula, data, options);

        this._cheating = options.cheating ?? false;
        this._check = options.check ?? null;
        this._effTarget = null;
        this._name = options.name ?? 'Unknown';
        this._target = options.target ?? null;
        this._targetCritical = options.targetCritical ?? null;
        this._targetSuccess = options.targetSuccess ?? null;
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
        return game.settings.get('hm3', 'cheatMode') || this._cheating;
    }

    get isCritical() {
        if (this._check === 'd6') return false;
        if (this._effTarget !== null) {
            return this.total % 5 === 0;
        }
    }

    get isSuccess() {
        if (this._effTarget !== null) {
            return this.total <= this._effTarget;
        }
    }

    async evaluate({
        minimize = false,
        maximize = false,
        allowStrings = false,
        allowInteractive = true,
        ...options
    } = {}) {
        if (
            this.cheating &&
            this._effTarget !== null &&
            this._targetSuccess !== null &&
            this._targetCritical !== null
        ) {
            return this._cheatRoll();
        } else if (this.cheating && this._effTarget !== null) {
            const data = await game.hm3.socket.executeAsGM('cheating', this._check, this._name, this._type);
            this._targetSuccess = data.targetSuccess;
            this._targetCritical = data.targetCritical;
            return this._cheatRoll();
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
            // reset
            this._dice = [];
            this.terms.forEach((element) => {
                element._evaluated = false;
                element.results = [];
            });
            this._evaluated = false;
            this._resolver = undefined;
            this._root = undefined;
            this._total = undefined;

            // reevaluate
            obj = await super.evaluate({minimize, maximize, allowStrings, allowInteractive, options});
        } while (this._targetCritical !== this.isCritical || this._targetSuccess !== this.isSuccess);

        return obj;
    }
}
