// @ts-check

export async function registerHandlebars() {
    // If you need to add Handlebars helpers, here are a few useful examples:
    Handlebars.registerHelper('concat', function () {
        var outStr = '';
        for (var arg in arguments) {
            if (typeof arguments[arg] != 'object') {
                outStr += arguments[arg];
            }
        }
        return outStr;
    });

    Handlebars.registerHelper('toLowerCase', function (str) {
        return str.toLowerCase();
    });

    Handlebars.registerHelper('capitalizeFirstLetter', function (str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    });

    Handlebars.registerHelper('not', function (obj) {
        return !obj;
    });

    Handlebars.registerHelper('getLabel', function (data, key) {
        var val = data.find((d) => d.key === key);
        return val.label;
    });

    Handlebars.registerHelper('multiply', function (op1, op2) {
        return op1 * op2;
    });

    Handlebars.registerHelper('endswith', function (op1, op2) {
        return op1.endsWith(op2);
    });

    const root = 'systems/hm3/templates/';
    const root_item_v2 = `${root}item-v2/partials/`;
    const root_actor_v2 = `${root}actor-v2/partials/`;
    Handlebars.registerPartial({
        //character v2
        char_v2_ability_partial: Handlebars.compile(await (await fetch(`${root_actor_v2}ability_partial.hbs`)).text()),
        char_v2_esoteric_list_partial: Handlebars.compile(
            await (await fetch(`${root_actor_v2}esoteric_list_partial.hbs`)).text()
        ),
        char_v2_fff_list_partial: Handlebars.compile(
            await (await fetch(`${root_actor_v2}fff_list_partial.hbs`)).text()
        ),
        char_v2_img_partial: Handlebars.compile(await (await fetch(`${root_actor_v2}img_partial.hbs`)).text()),
        char_v2_layout_partial: Handlebars.compile(await (await fetch(`${root_actor_v2}structure_partial.hbs`)).text()),
        char_v2_skill_list_partial: Handlebars.compile(
            await (await fetch(`${root_actor_v2}skill_list_partial.hbs`)).text()
        ),
        // item v2
        item_v2_artifact_partial: Handlebars.compile(await (await fetch(`${root_item_v2}artifact_partial.hbs`)).text()),
        item_v2_artifact_power_partial: Handlebars.compile(
            await (await fetch(`${root_item_v2}artifact_power_partial.hbs`)).text()
        ),
        item_v2_esoteric_combat_partial: Handlebars.compile(
            await (await fetch(`${root_item_v2}esoteric_combat_partial.hbs`)).text()
        ),
        item_v2_layout_partial: Handlebars.compile(await (await fetch(`${root_item_v2}structure_partial.hbs`)).text()),
        item_v2_quantity_partial: Handlebars.compile(await (await fetch(`${root_item_v2}quantity_partial.hbs`)).text()),
        item_v2_sb_partial: Handlebars.compile(await (await fetch(`${root_item_v2}sb_partial.hbs`)).text()),
        item_v2_standard_partial: Handlebars.compile(await (await fetch(`${root_item_v2}standard_partial.hbs`)).text()),
        item_v2_unknown_value_partial: Handlebars.compile(
            await (await fetch(`${root_item_v2}unknown_value_partial.hbs`)).text()
        ),
        item_v2_value_partial: Handlebars.compile(await (await fetch(`${root_item_v2}value_partial.hbs`)).text()),
        item_v2_weight_partial: Handlebars.compile(await (await fetch(`${root_item_v2}weight_partial.hbs`)).text()),
        // global
        effects_partial: Handlebars.compile(await (await fetch(`${root}partials/effects_partial.hbs`)).text()),
        legacy_macro_partial: Handlebars.compile(
            await (await fetch(`${root}partials/legacy_macro_partial.hbs`)).text()
        ),
        macros_partial: Handlebars.compile(await (await fetch(`${root}partials/macros_partial.hbs`)).text())
    });
}
