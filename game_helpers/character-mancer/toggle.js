for (let token of canvas.tokens.controlled) {
    const cm = token.actor.getFlag('hm3', 'CharacterMancer') || false;
    token.actor.setFlag('hm3', 'CharacterMancer', !cm);
}
