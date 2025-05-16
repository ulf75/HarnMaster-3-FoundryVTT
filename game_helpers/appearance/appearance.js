(async () => {
    const content = `<div>
<label for="race">Choose a Race:</label>
<select name="race" id="race">
  <option value="human">Human</option>
  <option value="sindarin">Sindarin</option>
  <option value="khuzdul">Khuzdul</option>
</select>
</div>
<div>
<label for="sex">Choose a Gender:</label>
<select name="sex" id="sex">
  <option value="male">Male</option>
  <option value="female">Female</option>
</select>
</div>
<fieldset>
<legend>Race & Diet:</legend>
<div>
  <input type="checkbox" id="isIvinian" name="isIvinian" />
  <label for="isIvinian">Ivinian</label>
</div>
<div>
  <input type="checkbox" id="isNobility" name="isNobility" />
  <label for="isNobility">Nobility</label>
</div>
<div>
  <input type="checkbox" id="isUrbanPoor" name="isUrbanPoor" />
  <label for="isUrbanPoor">Urban Poor</label>
</div>
</fieldset>`;

    let confirmed = false;
    new Dialog({
        title: 'Appearance Attributes',
        content: content,
        buttons: {
            create: {label: 'Create', callback: () => (confirmed = true)},
            cancel: {label: 'Cancel', callback: () => (confirmed = false)}
        },
        default: 'create',

        close: (html) => {
            (async () => {
                if (confirmed) {
                    const race = html.find('#race')[0];
                    const species = race.options[race.selectedIndex].text;

                    const sex = html.find('#sex')[0];
                    const gender = sex.options[sex.selectedIndex].text;

                    const isIvinian = html.find('#isIvinian')[0].checked;
                    const isNobility = html.find('#isNobility')[0].checked;
                    const isUrbanPoor = html.find('#isUrbanPoor')[0].checked;

                    let heightFormula = gender === 'Male' ? '54+4d6' : '52+4d6';
                    let avgHeight = gender === 'Male' ? '68"' : '66"';
                    let frameFormula = '3d6';

                    if (species === 'Sindarin') {
                        heightFormula = gender === 'Male' ? '51+4d6' : '50+4d6';
                        avgHeight = gender === 'Male' ? '65"' : '64"';
                    }
                    if (species === 'Khuzdul') {
                        heightFormula = gender === 'Male' ? '40+4d6' : '40+4d6';
                        avgHeight = '54"';
                    }

                    if (isIvinian) heightFormula += '+1';
                    if (isNobility) heightFormula += '+2';
                    if (isUrbanPoor) heightFormula += '-2';

                    if (species === 'Human' && gender === 'Female') frameFormula += '-3';
                    if (species === 'Sindarin') frameFormula += '-2';
                    if (species === 'Khuzdul') frameFormula += '+3';

                    const frameTable = game.tables.getName('Frame');
                    const frameRoll = new game.hm3.Roll(frameFormula);
                    const frameDraw = await frameTable.draw({roll: frameRoll, recursive: true, displayChat: false});
                    const frame = frameDraw.results[0].text;

                    let weightMultiplier = 1.0;
                    let aglMod = '+0';
                    switch (frame) {
                        case 'Scant':
                            weightMultiplier = 0.8;
                            aglMod = '+2';
                            break;
                        case 'Light':
                            weightMultiplier = 0.9;
                            aglMod = '+1';
                            break;
                        case 'Heavy':
                            weightMultiplier = 1.1;
                            aglMod = '-1';
                            break;
                        case 'Massive':
                            weightMultiplier = 1.2;
                            aglMod = '-2';
                            break;
                    }

                    const weightTable = game.tables.getName('Weight');
                    const weightRoll = new game.hm3.Roll(heightFormula);
                    const weightDraw = await weightTable.draw({roll: weightRoll, recursive: true, displayChat: false});
                    const height = Number(weightDraw.roll.total);
                    const heightF = Math.floor(height / 12);
                    let weight = Number(weightDraw.results[0].text);
                    weight = Math.round(weight * weightMultiplier);

                    const sizeTable = game.tables.getName('Size');
                    const sizeRoll = new game.hm3.Roll(`${weight}`);
                    const sizeDraw = await sizeTable.draw({roll: sizeRoll, recursive: true, displayChat: false});
                    const size = Number(sizeDraw.results[0].text);

                    const strTable = game.tables.getName('Strength Modifier');
                    const strRoll = new game.hm3.Roll(`${weight}`);
                    const strDraw = await strTable.draw({roll: strRoll, recursive: true, displayChat: false});
                    const strMod = strDraw.results[0].text;

                    let comeliness = 0;
                    if (!!token.actor.system.abilities.comeliness.base) {
                        comeliness = token.actor.system.abilities.comeliness.base;
                    } else {
                        comeliness = (await new game.hm3.Roll('3d6').evaluate()).total;
                        if (species === 'Sindarin') comeliness += 2;
                    }
                    let comelinessStr = 'Average';
                    if (comeliness <= 5) comelinessStr = 'Ugly';
                    else if (comeliness <= 8) comelinessStr = 'Plain';
                    else if (comeliness >= 16) comelinessStr = 'Handsome';
                    else if (comeliness >= 13) comelinessStr = 'Attractive';

                    const compTable = game.tables.getName(`08a ${species === 'Human' && isIvinian ? 'Khuzdul' : species} Complexion`);
                    const compRoll = new game.hm3.Roll('1d100');
                    const compDraw = await compTable.draw({roll: compRoll, recursive: true, displayChat: false});
                    const complexion = compDraw.results[0].text;

                    let complexionMod = '+0';
                    if (species === 'Human') {
                        switch (complexion) {
                            case 'Fair':
                                complexionMod = '+25';
                                break;
                            case 'Dark':
                                complexionMod = '-25';
                                break;
                        }
                    }

                    const eyeTable = game.tables.getName(`08b ${species} Eye Color`);
                    const eyeRoll = new game.hm3.Roll('1d100' + complexionMod);
                    const eyeDraw = await eyeTable.draw({roll: eyeRoll, recursive: true, displayChat: false});
                    const eye = eyeDraw.results[0].text;

                    const hairTable = game.tables.getName(`08b ${species} Hair Color`);
                    const hairRoll = new game.hm3.Roll('1d100' + complexionMod);
                    const hairDraw = await hairTable.draw({roll: hairRoll, recursive: true, displayChat: false});
                    const hair = hairDraw.results[0].text;

                    let voice = 0;
                    if (!!token.actor.system.abilities.voice.base) {
                        voice = token.actor.system.abilities.voice.base;
                    } else {
                        voice = (await new game.hm3.Roll('3d6').evaluate()).total;
                        if (species === 'Sindarin') voice += 2;
                    }
                    let voiceStr = 'Average';
                    if (voice <= 4) voiceStr = 'Unbearable';
                    else if (voice <= 6) voiceStr = 'Unpleasant';
                    else if (voice >= 18) voiceStr = 'Unearthly';
                    else if (voice >= 16) voiceStr = 'Excellent';
                    else if (voice >= 13) voiceStr = 'Pleasant';

                    const medicalTable = game.tables.getName(`09 ${gender} Medical`);
                    const medicalRoll = new game.hm3.Roll('1d100');
                    const medicalDraw = await medicalTable.draw({roll: medicalRoll, recursive: true, displayChat: false});
                    const medical = medicalDraw.results[0].text;

                    const mentalTable = game.tables.getName(`10 Mental Disorder`);
                    const mentalRoll = new game.hm3.Roll('1d100');
                    const mentalDraw = await mentalTable.draw({roll: mentalRoll, recursive: true, displayChat: false});
                    const mental = mentalDraw.results[0].text;

                    ChatMessage.create({
                        user: game.user._id,
                        speaker: ChatMessage.getSpeaker({token: actor}),
                        content: `<h3>Appearance Attributes</h3><p>Species: ${species}</p><p>Gender: ${gender}</p><p>Frame: ${frame}</p><p>Height: ${height}" (avg ${avgHeight}) / ${heightF}'${
                            height - heightF * 12
                        }" (${Math.round(height * 2.54)} cm)</p><p>Weight: ${weight} lbs (${Math.round(
                            weight * 0.454
                        )} kg)</p><p>Size: ${size}</p><p>Comeliness: ${comeliness} (${comelinessStr})</p><p>Complexion: ${complexion}</p><p>Eye Color: ${eye}</p><p>Hair Color: ${hair}</p><p>Modifiers: STR: ${strMod}, AGL: ${aglMod}</p>`
                    });

                    if (canvas.tokens.controlled.length === 1) {
                        const token = canvas.tokens.controlled[0];
                        let description = (' ' + token.actor.system.description).slice(1).trim();
                        let myArray = description.split('\n');

                        let index = description.indexOf('Height');
                        index = description.indexOf('<p>', index) + 3;
                        description = [description.slice(0, index), `${height}" (${Math.round(height * 2.54)} cm)`, description.slice(index)].join(
                            ''
                        );

                        index = description.indexOf('Frame');
                        index = description.indexOf('<p>', index) + 3;
                        description = [description.slice(0, index), `${frame}`, description.slice(index)].join('');

                        index = description.indexOf('Weight');
                        index = description.indexOf('<p>', index) + 3;
                        description = [
                            description.slice(0, index),
                            `${weight} lbs (${Math.round(weight * 0.454)} kg) / ${size}`,
                            description.slice(index)
                        ].join('');

                        index = description.indexOf('Appearance');
                        index = description.indexOf('<p>', index) + 3;
                        description = [description.slice(0, index), `${comelinessStr}`, description.slice(index)].join('');

                        index = description.indexOf('Complexion');
                        index = description.indexOf('<p>', index) + 3;
                        description = [description.slice(0, index), `${complexion}`, description.slice(index)].join('');

                        index = description.indexOf('Hair');
                        index = description.indexOf('<p>', index) + 3;
                        description = [description.slice(0, index), `${hair}`, description.slice(index)].join('');

                        index = description.indexOf('Eye');
                        index = description.indexOf('<p>', index) + 3;
                        description = [description.slice(0, index), `${eye}`, description.slice(index)].join('');

                        index = description.indexOf('Voice');
                        index = description.indexOf('<p>', index) + 3;
                        description = [description.slice(0, index), `${voiceStr}`, description.slice(index)].join('');

                        index = description.indexOf('Medical');
                        index = description.indexOf('<p>', index) + 3;
                        description = [description.slice(0, index), `${medical}`, description.slice(index)].join('');

                        index = description.indexOf('Behavior');
                        index = description.indexOf('<p>', index) + 3;
                        description = [description.slice(0, index), `${mental}`, description.slice(index)].join('');

                        await token.actor.update({'system.description': description});
                        // console.log(description);
                    }
                }
            })();
        }
    }).render(true);
})();
