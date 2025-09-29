// @ts-check
import {CompanionType} from '../../hm3-types';
import {ItemDataModel} from './item-data-model';

const {BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
export class CompanionDataModel extends ItemDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {
            actorUuid: new StringField({initial: null}),
            type: new StringField({initial: CompanionType.CONNECTION})
        });
    }

    /**
     * @type {import('../../actor/actor').ActorHM3 | null}
     */
    get companion() {
        // @ts-expect-error
        return fromUuidSync(this.actorUuid);
    }
    /**
     * @type {string}
     */
    get gender() {
        // @ts-expect-error
        return this.companion?.system.gender ?? 'Male';
    }
}
