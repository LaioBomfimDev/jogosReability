const consentStorageKey = "reability-games-disclaimer-v1";

const hasAcceptedDisclaimer = () => {
  try {
    return window.localStorage.getItem(consentStorageKey) === "accepted";
  } catch {
    return false;
  }
};

const saveDisclaimerAcceptance = () => {
  try {
    window.localStorage.setItem(consentStorageKey, "accepted");
  } catch {
    // If storage is unavailable, the notice will appear again on the next visit.
  }
};

const showDisclaimer = () => {
  if (hasAcceptedDisclaimer()) return;

  const dialog = document.createElement("dialog");
  dialog.className = "health-notice-dialog";
  dialog.setAttribute("aria-labelledby", "health-notice-title");
  dialog.innerHTML = `
    <div class="health-notice-dialog__content">
      <p class="eyebrow">Antes de começar</p>
      <h2 id="health-notice-title">Este é um jogo, não uma avaliação.</h2>
      <p>
        Os desafios da Reability foram criados para informação e entretenimento.
        Pontuação, tempo ou tentativas não identificam déficits, transtornos ou diagnósticos.
      </p>
      <p>
        Se houver uma preocupação real com memória, atenção, linguagem, comportamento ou funcionalidade,
        procure uma avaliação profissional.
      </p>
      <button class="button health-notice-dialog__button" type="button">Entendi e quero jogar</button>
    </div>
  `;

  const acceptButton = dialog.querySelector("button");
  acceptButton.addEventListener("click", () => {
    saveDisclaimerAcceptance();
    dialog.close();
  });

  dialog.addEventListener("cancel", (event) => event.preventDefault());
  document.body.append(dialog);
  dialog.showModal();
  acceptButton.focus();
};

showDisclaimer();
