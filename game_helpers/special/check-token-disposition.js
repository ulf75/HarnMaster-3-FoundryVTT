// Hook: On token's turn start, if disposition is neutral/secret, ask to set friendly or hostile.

const combatant = triggerArgs[0].combatant;
if (!combatant?.tokenId || combatant.hidden) return;

const token = canvas.tokens.get(combatant.tokenId);
if (!token || !token.document) return;

const currentDisposition = token.document.disposition;
if (currentDisposition === CONST.TOKEN_DISPOSITIONS.NEUTRAL || currentDisposition === CONST.TOKEN_DISPOSITIONS.SECRET) {
    const dispositions = {
        FRIENDLY: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
        HOSTILE: CONST.TOKEN_DISPOSITIONS.HOSTILE
    };

    new Dialog({
        title: `Disposition for ${token.name}`,
        content: `
        <form>
          <div class="form-group">
            <p><strong>${token.name}</strong> has a neutral or secret disposition.<br>
            Set a new disposition?</p>
            <select name="dispo" autofocus>
              <option value="">Skip for now</option>
              <option value="FRIENDLY">Friendly</option>
              <option value="HOSTILE">Hostile</option>
            </select>
          </div>
        </form>
      `,
        buttons: {
            apply: {
                label: 'Apply',
                callback: (html) => {
                    const choice = html.find('[name="dispo"]').val();
                    if (choice) {
                        token.document.update({disposition: dispositions[choice]});
                    }
                }
            },
            cancel: {
                label: 'Skip'
            }
        },
        default: 'apply'
    }).render(true);
}
