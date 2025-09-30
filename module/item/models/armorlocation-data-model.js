// @ts-check
import {ItemType} from '../../hm3-types';
import {ItemDataModel} from './item-data-model';

const {ArrayField, BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
export class ArmorlocationDataModel extends ItemDataModel {
    static TotalWeightHigh = 0;
    static TotalWeightMid = 0;
    static TotalWeightLow = 0;

    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {
            blunt: new NumberField({initial: 0, integer: true, min: -1}),
            fire: new NumberField({initial: 0, integer: true, min: -1}),
            edged: new NumberField({initial: 0, integer: true, min: -1}),
            piercing: new NumberField({initial: 0, integer: true, min: -1}),
            effectiveImpact: new SchemaField({
                ei1: new StringField({required: true}),
                ei5: new StringField({required: true}),
                ei9: new StringField({required: true}),
                ei13: new StringField({required: true}),
                ei17: new StringField({required: true})
            }),
            impactType: new StringField(),
            isAmputate: new BooleanField(),
            isFumble: new BooleanField(),
            isStumble: new BooleanField(),
            layers: new StringField(),
            probWeight: new SchemaField({
                high: new NumberField({initial: 0, min: 0, max: 100}),
                mid: new NumberField({initial: 0, min: 0, max: 100}),
                low: new NumberField({initial: 0, min: 0, max: 100})
            })
        });
    }

    /**
     * @protected
     */
    _calcProbWeights() {
        if (ArmorlocationDataModel.TotalWeightHigh !== 0) return;

        this.actor?.items.forEach((item) => {
            if (item.type === ItemType.ARMORLOCATION) {
                ArmorlocationDataModel.TotalWeightHigh += item.system.probWeight.high;
                ArmorlocationDataModel.TotalWeightMid += item.system.probWeight.mid;
                ArmorlocationDataModel.TotalWeightLow += item.system.probWeight.low;
            }
        });
        ArmorlocationDataModel.TotalWeightHigh /= 100;
        ArmorlocationDataModel.TotalWeightMid /= 100;
        ArmorlocationDataModel.TotalWeightLow /= 100;
    }
}
