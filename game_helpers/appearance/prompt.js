const RIVER = `Create an image in a vintage etching or woodcut style. Use an earthy, muted color palette with shades of brown, beige, and dark green. 
    Emphasize intricate linework with hatching and cross-hatching techniques to render texture and depth. 
    Employ sharp contrasts between light and dark to create a sense of dimension. 
    Prioritize detailed textures, organic shapes, and a rustic aesthetic reminiscent of traditional printmaking art.`;

const MISTY = `Create an image in a vintage etching or woodcut style. Use an earthy, muted color palette with shades of green, brown, and beige. 
    Emphasize intricate linework with hatching and cross-hatching techniques to render texture and depth. 
    Employ sharp contrasts between light and dark to create a sense of dimension. 
    Prioritize detailed textures, organic shapes, and a rustic aesthetic reminiscent of traditional printmaking art.`;

const CATARACT = `Create an image in a vintage etching or woodcut style. Use an earthy, muted color palette with warm browns, deep greens, and vibrant turquoise-blue accents. 
    Incorporate autumn tones like rich oranges to provide contrast. 
    Emphasize intricate linework with detailed hatching and cross-hatching techniques to render texture and depth. 
    Employ strong contrasts between light and dark to create a sense of dimension. 
    Prioritize detailed textures, organic shapes, and a rustic aesthetic reminiscent of traditional printmaking art.`;

const IVINIAN = `Create a detailed medieval-style illustration using an earthy, muted color palette with browns, greens, and grays. 
    Incorporate vibrant accents like rich yellows and decorative patterns to add contrast. 
    Use strong, defined outlines combined with intricate interior linework to emphasize texture in clothing, armor, and wooden objects. 
    Apply detailed hatching and stippling techniques to create depth and shading. 
    Employ realistic lighting and natural contrast to highlight focal points. 
    The composition should prioritize dynamic action, expressive poses, and historically inspired attire, with a softly toned background to maintain focus on the main subjects. 
    Capture the aesthetic of traditional historical illustration with attention to period-accurate materials and intricate detailing.`;

const MIXED = `Create a detailed medieval-inspired illustration in a vintage etching or woodcut style using an earthy, muted color palette dominated by shades of green, brown, and gray. 
    Incorporate vibrant accents such as rich reds, oranges, and yellows to enhance focal points. 
    Emphasize intricate linework with hatching and cross-hatching techniques to render textures in clothing, armor, and wooden objects. 
    Use detailed hatching, cross-hatching, and stippling techniques to create shading and depth. 
    Employ realistic lighting with bold shadows, diffused highlights, and natural contrast to enhance mood. 
    Include atmospheric effects with layered brushwork and softened tones for realism. 
    The composition should prioritize expressive poses, dynamic tension, and historically inspired attire, with a softly toned background to maintain focus on the main subjects. 
    Capture the aesthetic of traditional historical illustration with period-accurate materials, strong storytelling elements, and rich textural detail. 
    Prioritize detailed textures, organic shapes, and a rustic aesthetic reminiscent of traditional printmaking art.`;

if (canvas.tokens.controlled.length === 1) {
    const token = canvas.tokens.controlled[0];
    let description = (' ' + token.actor.system.description).slice(1);
    const gender = token.actor.system.gender;
    const name = token.actor.name;

    description = description.replace(/<tr>/g, '');
    description = description.replace(/<tr.*">/g, '');
    description = description.replace(/<strong>/g, '');
    description = description.replace(/<tbody>/g, '');
    description = description.replace(/<tbody.*>/g, '');
    description = description.replace(/<td>/g, '');
    description = description.replace(/<td.*">/g, '');
    description = description.replace(/<table.*">/g, '');

    description = description.replace(/<\/td>/g, '');
    description = description.replace(/<\/tr>/g, ', ');
    description = description.replace(/<\/strong>/g, ': ');
    description = description.replace(/<\/tbody>/g, '');
    description = description.replace(/<\/table>/g, '');
    description = description.replace(/<p>&nbsp;<\/p>/g, '');
    description = description.replace(/<p>/g, '');
    description = description.replace(/<\/p>/g, '');
    description = description.replace(/\n/g, '');
    description = description.replace(/&nbsp;/g, '');

    const prompt = `${MIXED} ${name} in full-size in portrait format: a medieval/dark age human ${gender} ${description}. For the background, choose something suitable from the occupation.`;
    navigator.clipboard.writeText(prompt);
    ui.notifications.info('LLM prompt copied to clipboard.');
}
