(function () {
  const select = document.getElementById('presetSelect');
  const loadBtn = document.getElementById('loadPresetBtn');
  if (!select || !window.PRESETS) return;

  Object.keys(window.PRESETS).forEach(key => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = key;
    select.appendChild(opt);
  });

  function applyPreset(name) {
    const preset = window.PRESETS[name];
    if (!preset) return;

    const nameInput = document.getElementById('playerName');
    if (nameInput && preset.name) nameInput.value = preset.name;

    document.querySelectorAll('.control[data-key]').forEach(control => {
      const key = control.dataset.key;
      const input = control.querySelector('input');
      const value = control.querySelector('.value');

      if (!key || !input) return;

      if (Object.prototype.hasOwnProperty.call(preset, key)) {
        input.value = preset[key];
        if (value) value.textContent = String(preset[key]);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    if (preset.icon) {
      setIcon(preset.icon);
    }

    

    if (typeof window.renderProfile === 'function') {
      window.renderProfile();
    }
  }


  if (loadBtn) {
    loadBtn.addEventListener('click', () => {
      applyPreset(select.value);
    }, { passive: true });
  } else {
    select.addEventListener('change', () => applyPreset(select.value), { passive: true });
  }

})();
