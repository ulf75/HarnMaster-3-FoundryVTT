// Hook: On token's turn start, if disposition is neutral/secret, ask to set friendly or hostile.

const combatant = triggerArgs[0].combatant;
if (!combatant?.tokenId || combatant.hidden) return;

const token = canvas.tokens.get(combatant.tokenId);
if (!token || !token.document) return;

console.debug('HM3 | Check Token Disposition: ' + combatant.name);

const currentDisposition = token.document.disposition;
if (currentDisposition === CONST.TOKEN_DISPOSITIONS.NEUTRAL || currentDisposition === CONST.TOKEN_DISPOSITIONS.SECRET) {
    new Dialog({
        title: `Disposition for ${token.name}`,
        content: `
          <div>
            <p><strong>${token.name}</strong> has a neutral or secret disposition.</p>
            <p>Set a new disposition?</p>
          </div>
      `,
        buttons: {
            friendly: {
                label: 'Friendly',
                callback: (html) => {
                    token.document.update({disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY});
                }
            },
            hostile: {
                label: 'Hostile',
                callback: (html) => {
                    token.document.update({disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE});
                }
            },
            cancel: {
                label: 'Skip'
            }
        },
        default: 'friendly'
    }).render(true);
}
