/**
 * Extend the base Macro.
 * @extends {Macro}
 */
export class MacroHM3 extends Macro {
    /**
     * Overrides the original implementation by allowing
     * to execute actor macros w/o limited ownership.
     * @returns True, if the user can execute this macro.
     * @override
     */
    get canExecute() {
        return super.canExecute || !!this.getFlag('hm3', 'ownerId') || this.getFlag('hm3', 'trigger') === 'manual';
    }
}
