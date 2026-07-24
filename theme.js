document.addEventListener('DOMContentLoaded', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  
  // Criar botão
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'theme-toggle-btn';
  btn.setAttribute('aria-label', 'Alternar tema claro/escuro');
  
  // Ícones SVG do Sol (para voltar ao claro) e Lua (para ir ao escuro)
  const getIconSvg = (theme) => {
    if (theme === 'dark') {
      // Ícone do Sol
      return `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.01c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>`;
    } else {
      // Ícone da Lua
      return `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12.3 22c.5 0 .9-.4.9-.9 0-.2-.1-.4-.2-.5-3.3-2.1-5.1-6.1-4.2-10.1.7-3.1 3.2-5.6 6.3-6.3.4-.1.6-.4.6-.8 0-.5-.4-.9-.9-.9-6.3 0-11.4 5.1-11.4 11.4S6 22 12.3 22z"/></svg>`;
    }
  };

  btn.innerHTML = getIconSvg(currentTheme);

  // Evento de clique para alternar
  btn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    btn.innerHTML = getIconSvg(newTheme);
  });

  // Inserção na página
  const nav = document.querySelector('.game-navigation');
  if (nav) {
    // Para jogos, adicionamos na barra de navegação
    nav.appendChild(btn);
  } else {
    // Para a home page (index.html)
    const welcome = document.querySelector('.welcome');
    if (welcome) {
      btn.classList.add('theme-toggle-btn--floating');
      welcome.appendChild(btn);
    }
  }
});
