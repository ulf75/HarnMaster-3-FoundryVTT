(async () => {
    const RIVER = `Create an image in a vintage etching or woodcut style. 
  Use an earthy, muted color palette with shades of brown, beige, and dark green. 
  Emphasize intricate linework with hatching and cross-hatching techniques to render texture and depth. 
  Employ sharp contrasts between light and dark to create a sense of dimension. 
  Prioritize detailed textures, organic shapes, and a rustic aesthetic reminiscent of traditional printmaking art.`;

    const MISTY = `Create an image in a vintage etching or woodcut style. 
  Use an earthy, muted color palette with shades of green, brown, and beige. 
  Emphasize intricate linework with hatching and cross-hatching techniques to render texture and depth. 
  Employ sharp contrasts between light and dark to create a sense of dimension. 
  Prioritize detailed textures, organic shapes, and a rustic aesthetic reminiscent of traditional printmaking art.`;

    const CATARACT = `Create an image in a vintage etching or woodcut style. 
  Use an earthy, muted color palette with warm browns, deep greens, and vibrant turquoise-blue accents. 
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

    const MIXED = `Create a detailed medieval-inspired illustration in a vintage etching or woodcut style. 
  Use an earthy, muted color palette dominated by shades of green, brown, and gray. 
  Incorporate vibrant accents such as rich reds, oranges, and yellows to enhance focal points. 
  Employ realistic lighting with bold shadows, diffused highlights, and natural contrast to enhance mood. 
  The composition should prioritize expressive poses, dynamic tension, and historically inspired attire, with a softly toned background to maintain focus on the main subjects. 
  `;

    const NO = `Create a detailed medieval-inspired illustration for the HârnMaster RPG.
  Use an earthy, muted color palette dominated by shades of green, brown, and gray.
  Incorporate vibrant accents such as rich reds, oranges, and yellows to enhance focal points.
  The composition should prioritize expressive poses, dynamic tension, and historically inspired attire, with a softly toned background to maintain focus on the main subjects.
  `;

    const NEW = `Create an illustration in a hand-drawn style with detailed ink-like linework and fine cross-hatching. Use a painterly approach for color fills with visible texture. The color palette should be earthy and slightly desaturated, featuring browns, greens, greys, and occasional muted accent colors. Lighting should be soft and diffuse, like a cloudy day. Maintain realistic anatomy with subtle stylization. Backgrounds should be rendered with the same level of detail, incorporating natural elements and textured terrain. The overall aesthetic should resemble traditional illustration techniques using ink and watercolor or gouache, with a grounded and immersive tone.`;

    const DALLE = `A hand-drawn illustration with fine ink-style linework and cross-hatching for detail and texture. Use a natural, earthy color palette with browns, greens, grays, and muted blues. Add occasional bright accent colors like red, yellow, or purple to highlight small elements. Colors should be rich but slightly desaturated. Avoid cross-hatching on skin; render it smooth and natural. Color fills should be painterly and textured, like watercolor or gouache. Figures should have realistic proportions with slightly stylized, expressive poses, and in traditional dark age, early medieval England or Viking-inspired (northern Europe) clothing. Backgrounds should be detailed and integrated matching the overall style.`;

    const PORTRAIT = `Create a detailed vertical portrait of a historical fantasy character in the style of a vintage woodcut or etching. 
    Use fine cross-hatching for shading and rich, intricate linework. 
    The color palette should be muted and earthy — sepia, olive green, parchment beige, and hints of faded blue or red. 
    The character should be depicted from the waist up, in traditional dark age, early medieval or Viking-inspired clothing, with props that hint at their role (e.g., a potion vial for an apothecary, a battle axe for a warrior). 
    The background should resemble old parchment with decorative borders or faded architecture, keeping the style consistent with antique book illustrations.
    `;

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
        description = description.replace(/<\/tr>/g, '; ');
        description = description.replace(/<\/strong>/g, ': ');
        description = description.replace(/<\/tbody>/g, '');
        description = description.replace(/<\/table>/g, '');
        description = description.replace(/<p>&nbsp;<\/p>/g, '');
        description = description.replace(/<p>/g, '');
        description = description.replace(/<\/p>/g, '');
        description = description.replace(/\n/g, '');
        description = description.replace(/&nbsp;/g, '');

        const prompt = `${DALLE} ${name} in portrait format: a human ${gender} ${description}.`;
        navigator.clipboard.writeText(prompt);
        ui.notifications.info('LLM prompt copied to clipboard.');
    }
})();
