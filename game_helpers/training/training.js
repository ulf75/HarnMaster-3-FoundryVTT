(async () => {
    const TRAINING_FACTOR_GUILDED = 1.6;
    const TRAINING_FACTOR_UNGUILDED = 1.4;
    const TRAINING_FACTOR_MILITARY = 1.3;
    const GROUP_RATE_FACTOR = 1.5;

    const prices = new Map([
        ['Low', {min: 80, die: 'd10'}],
        ['Average', {min: 90, die: 'd20'}],
        ['High', {min: 100, die: 'd20'}],
        ['High+', {min: 130, die: 'd20'}]
    ]);

    const qualities = new Map([
        ['Poor *', {min: 50, die: 'd10', multi: 0.9}],
        ['Inferior **', {min: 60, die: 'd10', multi: 1}],
        ['Average ***', {min: 70, die: 'd10', multi: 1}],
        ['Superior ****', {min: 80, die: 'd20', multi: 1.1}],
        ['Excellent *****', {min: 100, die: 'd20', multi: 1.3}]
    ]);

    const incomes = new Map([
        // Guilded
        ['Guilded - Apothecary', {month: 60, year: 720}],
        ['Guilded - Chandler', {month: 54, year: 648}],
        ['Guilded - Charcoaler', {month: 54, year: 648}],
        ['Guilded - Clothier', {month: 60, year: 720}],
        // ['Guilded - Courtesan', {month: 'Variable', year: 'Variable'}],
        ['Guilded - Embalmer', {month: 48, year: 576}],
        ['Guilded - Glassworker', {month: 66, year: 792}],
        ['Guilded - Harper', {month: 42, year: 504}],
        ['Guilded - Herald', {month: 78, year: 936}],
        ['Guilded - Hideworker', {month: 60, year: 720}],
        ['Guilded - Innkeeper', {month: 60, year: 720}],
        ['Guilded - Jeweller', {month: 66, year: 792}],
        ['Guilded - Lexigrapher', {month: 66, year: 792}],
        ['Guilded - Litigant', {month: 72, year: 864}],
        ['Guilded - Locksmith', {month: 60, year: 720}],
        ['Guilded - Mason', {month: 96, year: 1152}],
        // ['Guilded - Mercantyler', {month: 'Variable', year: 'Variable'}],
        ['Guilded - Metalsmith', {month: 72, year: 864}],
        ['Guilded - Miller', {month: 84, year: 1008}],
        ['Guilded - Miner', {month: 84, year: 1008}],
        ['Guilded - Ostler', {month: 78, year: 936}],
        ['Guilded - Perfumer', {month: 66, year: 792}],
        ['Guilded - Physician', {month: 72, year: 864}],
        // ['Guilded - Pilot', {month: 'Variable', year: 'Variable'}],
        ['Guilded - Potter', {month: 60, year: 720}],
        ['Guilded - Salter', {month: 48, year: 576}],
        ['Guilded - Seaman (AB)', {month: 48, year: 576}],
        ['Guilded - Shipwright', {month: 90, year: 1080}],
        ['Guilded - Tentmaker', {month: 72, year: 864}],
        // ['Guilded - Thespian', {month: 'Variable', year: 'Variable'}],
        ['Guilded - Timberwright', {month: 78, year: 936}],
        ['Guilded - Weaponcrafter', {month: 108, year: 1296}],
        ['Guilded - Woodcrafter', {month: 66, year: 792}],

        // Unguilded
        ['Unguilded - Animal Trainer', {month: 72, year: 864}],
        ['Unguilded - Cartographer', {month: 84, year: 1008}],
        ['Unguilded - Cook', {month: 30, year: 360}],
        ['Unguilded - Farmhand', {month: 24, year: 288}],
        ['Unguilded - Fisherman', {month: 48, year: 576}],
        ['Unguilded - Herdsman', {month: 24, year: 288}],
        ['Unguilded - Hunter/Trapper', {month: 42, year: 504}],
        ['Unguilded - Laborer/Porter', {month: 42, year: 504}],
        ['Unguilded - Longshoreman', {month: 42, year: 504}],
        // ['Unguilded - Prostitute', {month: 'Variable', year: 'Variable'}],
        ['Unguilded - Ratter', {month: 60, year: 720}],
        ['Unguilded - Sage/Tutor', {month: 84, year: 1008}],
        ['Unguilded - Scribe', {month: 66, year: 792}],
        ['Unguilded - Servant', {month: 24, year: 288}],
        ['Unguilded - Teamster', {month: 72, year: 864}],
        ['Unguilded - Thatcher', {month: 54, year: 648}],
        ['Unguilded - Toymaker', {month: 48, year: 576}],

        // Military
        ['Military - Light Foot - Molak', {month: 24, year: 288}],
        ['Military - Light Foot - Arkalin', {month: 30, year: 360}],
        ['Military - Light Foot - Melbrin', {month: 36, year: 432}],
        ['Military - Light Foot - Molarin', {month: 42, year: 504}],
        ['Military - Light Foot - Armolarin', {month: 48, year: 576}],

        ['Military - Medium Foot - Molak', {month: 48, year: 576}],
        ['Military - Medium Foot - Arkalin', {month: 60, year: 720}],
        ['Military - Medium Foot - Melbrin', {month: 72, year: 864}],
        ['Military - Medium Foot - Molarin', {month: 84, year: 1008}],
        ['Military - Medium Foot - Armolarin', {month: 96, year: 1152}],

        ['Military - Heavy Foot - Molak', {month: 72, year: 864}],
        ['Military - Heavy Foot - Arkalin', {month: 90, year: 1080}],
        ['Military - Heavy Foot - Melbrin', {month: 108, year: 1296}],
        ['Military - Heavy Foot - Molarin', {month: 126, year: 1512}],
        ['Military - Heavy Foot - Armolarin', {month: 144, year: 1728}],

        ['Military - LF Bowman - Molak', {month: 48, year: 576}],
        ['Military - LF Bowman - Arkalin', {month: 60, year: 720}],
        ['Military - LF Bowman - Melbrin', {month: 72, year: 864}],
        ['Military - LF Bowman - Molarin', {month: 84, year: 1008}],
        ['Military - LF Bowman - Armolarin', {month: 96, year: 1152}],

        ['Military - LF Longbow - Molak', {month: 72, year: 864}],
        ['Military - LF Longbow - Arkalin', {month: 90, year: 1080}],
        ['Military - LF Longbow - Melbrin', {month: 108, year: 1296}],
        ['Military - LF Longbow - Molarin', {month: 126, year: 1512}],
        ['Military - LF Longbow - Armolarin', {month: 144, year: 1728}],

        ['Military - Light Horse - Molak', {month: 96, year: 1152}],
        ['Military - Light Horse - Arkalin', {month: 120, year: 1512}],
        ['Military - Light Horse - Molarin', {month: 180, year: 2232}],
        ['Military - Light Horse - Armolarin', {month: 216, year: 2592}],

        ['Military - Medium Horse - Chalasir', {month: 192, year: 2304}],
        ['Military - Medium Horse - Kephiri', {month: 288, year: 3456}],

        ['Military - Heavy Horse - Chalasir', {month: 288, year: 3456}],
        ['Military - Heavy Horse - Kephiri', {month: 384, year: 4608}]
    ]);

    let selectPriceOptions = [...prices.keys()]
        .map((key, idx) => `<option ${idx === 1 ? 'selected="selected" ' : ''}value="${key}">${key}</option>`)
        .join('');
    let selectQualityOptions = [...qualities.keys()]
        .map((key, idx) => `<option ${idx === 2 ? 'selected="selected" ' : ''}value="${key}">${key}</option>`)
        .join('');
    let selectIncomeOptions = [...incomes.keys()].map((key) => `<option value="${key}">${key}</option>`).join('');

    const content = `
<label for="income">Choose a Master/Trainer:</label>
<select name="income" id="income">
  ${selectIncomeOptions}
</select>
</div>
<div>
<label for="price">Choose a Price Range:</label>
<select name="price" id="price">
  ${selectPriceOptions}
</select>
</div>
<div>
<label for="quality">Choose a Quality Range:</label>
<select name="quality" id="quality">
  ${selectQualityOptions}
</select>
</div>
<div>
<fieldset>
<legend>Addl Modifiers:</legend>
<div>
  <input type="checkbox" id="isGroupRate" name="isGroupRate" />
  <label for="isGroupRate">Group Rate</label>
</div>
<div>
  <input type="number" id="days" name="days" required value="30" />
  <label for="days">Days</label>
</div>
</fieldset>`;

    let confirmed = false;
    new Dialog(
        {
            title: 'Training Costs',
            content: content,
            buttons: {
                create: {label: 'Calculate', callback: () => (confirmed = true)},
                cancel: {label: 'Cancel', callback: () => (confirmed = false)}
            },
            default: 'create',

            close: async (html) => {
                if (confirmed) {
                    const isGroupRate = html.find('#isGroupRate')[0].checked;
                    const days = Number(html.find('#days')[0].value);

                    const _trainer = html.find('#income')[0];
                    const trainer = _trainer.options[_trainer.selectedIndex].text;
                    const monthlyPrice = incomes.get(trainer).month;

                    const _price = html.find('#price')[0];
                    const price = _price.options[_price.selectedIndex].text;
                    const priceMultiplier = (prices.get(price).min + (await new Roll(prices.get(price).die).evaluate()).total) / 100;

                    const _quality = html.find('#quality')[0];
                    const quality = _quality.options[_quality.selectedIndex].text;
                    const qualityMultiplier = Number(qualities.get(quality).multi);
                    const ML = qualities.get(quality).min + (await new Roll(qualities.get(quality).die).evaluate()).total;

                    let trainingFactor = 0;
                    if (trainer.includes('Military')) trainingFactor = TRAINING_FACTOR_MILITARY;
                    else if (trainer.includes('Guilded')) trainingFactor = TRAINING_FACTOR_GUILDED;
                    else if (trainer.includes('Unguilded')) trainingFactor = TRAINING_FACTOR_UNGUILDED;

                    let actualPrice = Math.round(
                        trainingFactor * (days / 30) * monthlyPrice * priceMultiplier * (isGroupRate ? GROUP_RATE_FACTOR : 1) * qualityMultiplier
                    );

                    actualPrice -= actualPrice % 6;
                    actualPrice += 6;

                    game.hm3.Gm2GmSays(
                        `<h4>Training Price</h4><p>${trainer}</p><p>Quality: ${quality} (ML${ML})</p><p>Prices: ${price}</p><p>Days: ${days}</p><hr><p><h4>Price: ${actualPrice}d</h4></p>${
                            isGroupRate ? '<p>(Group Rate)</p>' : ''
                        }`,
                        'House Rule'
                    );
                }
            }
        },
        {width: 600}
    ).render(true);
})();
