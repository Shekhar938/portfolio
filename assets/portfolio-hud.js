// ==========================================================================
// SHEKHAR KUMAR — PORTFOLIO HUD INTERACTIVITY, TELEMETRY & 3D CITADEL BRIDGE
// ==========================================================================

import { GlacialCitadel3D } from '/assets/interactive-3d-citadel.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D Glacial Citadel Engine
  const canvasContainer = document.getElementById('canvas3d-container');
  let citadel = null;
  if (canvasContainer && typeof THREE !== 'undefined') {
    try {
      citadel = new GlacialCitadel3D(canvasContainer);
      window.citadel = citadel;
      console.log('🧊 3D Himalayan Data Citadel initialized successfully.');
    } catch (err) {
      console.error('Failed to initialize 3D Citadel:', err);
    }
  }

  // Audio Synthesis & Himalayan Soundscape System
  let audioCtx = null;
  let synthOsc1 = null;
  let synthOsc2 = null;
  let synthGain = null;
  let streamGain = null;
  let streamSource = null;
  let windAudio = null;
  let isAudioActive = false;

  function initAmbientSynth() {
    if (audioCtx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();

      synthGain = audioCtx.createGain();
      synthGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      synthGain.connect(audioCtx.destination);

      synthOsc1 = audioCtx.createOscillator();
      synthOsc1.type = 'sine';
      synthOsc1.frequency.setValueAtTime(55, audioCtx.currentTime); // Low A1 drone
      synthOsc1.connect(synthGain);
      synthOsc1.start();

      synthOsc2 = audioCtx.createOscillator();
      synthOsc2.type = 'triangle';
      synthOsc2.frequency.setValueAtTime(110, audioCtx.currentTime); // A2 overtone
      synthOsc2.connect(synthGain);
      synthOsc2.start();

      // Glacial Stream Pink Noise Generator (Fluid Mountain Meltwater)
      const bufferSize = audioCtx.sampleRate * 2;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.07;
        b6 = white * 0.115926;
      }
      streamSource = audioCtx.createBufferSource();
      streamSource.buffer = noiseBuffer;
      streamSource.loop = true;

      // Filter to simulate bubbling glacial stream meltwater
      const streamFilter = audioCtx.createBiquadFilter();
      streamFilter.type = 'bandpass';
      streamFilter.frequency.setValueAtTime(700, audioCtx.currentTime);
      streamFilter.Q.setValueAtTime(1.4, audioCtx.currentTime);

      streamGain = audioCtx.createGain();
      streamGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);

      streamSource.connect(streamFilter);
      streamFilter.connect(streamGain);
      streamGain.connect(audioCtx.destination);
      streamSource.start();

      // Ambient mountain wind audio element
      try {
        windAudio = new Audio('/assets/audio/wind.ogg');
        windAudio.loop = true;
        windAudio.volume = 0.22;
      } catch (err) {}
    } catch (e) {
      console.warn('Web Audio not supported:', e);
    }
  }

  const stageFreqs = {
    citadel: [523.25, 659.25],   // C5, E5 (Open majestic)
    agentic: [587.33, 880.00],   // D5, A5 (Bright neural)
    dotnet: [440.00, 659.25],    // A4, E5 (Deep enterprise)
    floorplan: [659.25, 987.77], // E5, B5 (Spatial high)
    codex: [698.46, 1046.50],    // F5, C6 (Pillar crystal)
    guardrail: [783.99, 1174.66] // G5, D6 (Quantum laser)
  };

  function playStageSound(stageId) {
    if (!isAudioActive) return;
    try {
      initAmbientSynth();
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      if (!audioCtx) return;

      const freqs = stageFreqs[stageId] || [523.25, 659.25];
      freqs.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.04);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + i * 0.04 + 0.38);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + i * 0.04);
        osc.stop(audioCtx.currentTime + i * 0.04 + 0.4);
      });
    } catch (e) {}
  }

  function playUiChirp(baseFreq = 880, sweepTo = 1320, duration = 0.08) {
    if (!isAudioActive) return;
    try {
      initAmbientSynth();
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(sweepTo, audioCtx.currentTime + duration);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + duration + 0.01);
    } catch (e) {}
  }

  // 2. Stage Selector Buttons
  const stagePills = document.querySelectorAll('.stage-pill');
  stagePills.forEach((pill) => {
    pill.addEventListener('click', () => {
      stagePills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');

      const stageId = pill.getAttribute('data-stage');
      playUiChirp(700, 1050, 0.06);
      if (citadel) {
        if (stageId === 'fps' && citadel.isFpsActive) {
          citadel.disableGameMode();
          citadel.switchStage('citadel');
          return;
        }
        citadel.switchStage(stageId);
      }
    });
  });

  // 3. 3D Monument Telemetry Panel Listener
  const mCode = document.getElementById('monumentCode');
  const mTitle = document.getElementById('monumentTitle');
  const mDesc = document.getElementById('monumentDesc');
  const mTech = document.getElementById('monumentTech');
  const mRepoBtn = document.getElementById('monumentRepoBtn');

  window.addEventListener('citadel_stage_change', (e) => {
    const data = e.detail;
    playStageSound(data.id);
    if (mCode) mCode.textContent = data.code;
    if (mTitle) mTitle.textContent = data.title;
    if (mDesc) mDesc.textContent = data.desc;
    if (mRepoBtn) mRepoBtn.href = data.repo;

    if (mTech) {
      mTech.innerHTML = '';
      const tags = data.tech.split('•').map((t) => t.trim());
      tags.forEach((tag) => {
        const span = document.createElement('span');
        span.textContent = tag;
        mTech.appendChild(span);
      });
    }

    // Sync active state in stage selector bar
    stagePills.forEach((pill) => {
      if (pill.getAttribute('data-stage') === data.id) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  });

  // 4. Explode View Toggle
  const btnExplode = document.getElementById('btnExplode');
  const explodeLabel = document.getElementById('explodeLabel');

  if (btnExplode && citadel) {
    btnExplode.addEventListener('click', () => {
      const isExp = citadel.toggleExplode();
      playUiChirp(isExp ? 650 : 1200, isExp ? 1200 : 650, 0.12);
      if (explodeLabel) {
        explodeLabel.textContent = isExp ? 'COLLAPSE' : 'EXPLODE VIEW';
      }
      btnExplode.style.background = isExp ? 'var(--ice-cyan)' : 'rgba(56, 189, 248, 0.15)';
      btnExplode.style.color = isExp ? '#06111e' : 'var(--ice-cyan)';
    });
  }

  // 5. Quick Jumps from Footer
  const jump1 = document.getElementById('jumpCube1');
  const jump2 = document.getElementById('jumpCube2');
  const jump3 = document.getElementById('jumpCube3');
  const jump4 = document.getElementById('jumpCube4');
  const jump5 = document.getElementById('jumpCube5');

  if (jump1 && citadel) {
    jump1.addEventListener('click', () => {
      playUiChirp(800, 1100, 0.06);
      citadel.switchStage('agentic');
    });
  }

  if (jump2 && citadel) {
    jump2.addEventListener('click', () => {
      playUiChirp(800, 1100, 0.06);
      citadel.switchStage('dotnet');
    });
  }

  if (jump3 && citadel) {
    jump3.addEventListener('click', () => {
      playUiChirp(800, 1100, 0.06);
      citadel.switchStage('floorplan');
    });
  }

  if (jump4 && citadel) {
    jump4.addEventListener('click', () => {
      playUiChirp(800, 1100, 0.06);
      citadel.switchStage('codex');
    });
  }

  if (jump5 && citadel) {
    jump5.addEventListener('click', () => {
      playUiChirp(800, 1100, 0.06);
      citadel.switchStage('guardrail');
    });
  }

  // 6. Dialog Elements & Controls
  const dialogs = {
    projects: document.getElementById('projectsDialog'),
    skills: document.getElementById('skillsDialog'),
    philosophy: document.getElementById('philosophyDialog'),
    contact: document.getElementById('contactDialog'),
  };

  const buttons = {
    projects: document.getElementById('btnProjects'),
    skills: document.getElementById('btnSkills'),
    philosophy: document.getElementById('btnPhilosophy'),
    contact: document.getElementById('btnContact'),
  };

  function openModal(dialog) {
    if (!dialog) return;
    playUiChirp(800, 1300, 0.08);
    dialog.showModal();
  }

  function closeModal(dialog) {
    if (!dialog) return;
    playUiChirp(1300, 800, 0.08);
    dialog.close();
  }

  if (buttons.projects) buttons.projects.addEventListener('click', () => openModal(dialogs.projects));
  if (buttons.skills) buttons.skills.addEventListener('click', () => openModal(dialogs.skills));
  if (buttons.philosophy) buttons.philosophy.addEventListener('click', () => openModal(dialogs.philosophy));
  if (buttons.contact) buttons.contact.addEventListener('click', () => openModal(dialogs.contact));

  document.querySelectorAll('[data-close-dialog]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dialogId = btn.getAttribute('data-close-dialog');
      const dialog = document.getElementById(dialogId);
      closeModal(dialog);
    });
  });

  // Modern Web Guidance: Light Dismiss Fallback
  Object.values(dialogs).forEach((dialog) => {
    if (!dialog) return;
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isInside = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (!isInside) {
        dialog.close();
      }
    });
  });

  // 7. Project Category Filtering in Modal
  const filterChips = document.querySelectorAll('.filter-chip');
  const projectCards = document.querySelectorAll('.project-card');

  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      playUiChirp(950, 1200, 0.05);
      filterChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');

      const filter = chip.getAttribute('data-filter');
      projectCards.forEach((card) => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 8. Spatial Audio Synth Generator
  const btnSound = document.getElementById('btnSoundToggle');
  const audioLabel = document.getElementById('audioLabel');

  if (btnSound) {
    btnSound.addEventListener('click', () => {
      isAudioActive = !isAudioActive;
      btnSound.classList.toggle('audio-playing', isAudioActive);

      if (isAudioActive) {
        audioLabel.textContent = 'AUDIO: ON';
        initAmbientSynth();
        if (synthGain && audioCtx) {
          if (audioCtx.state === 'suspended') audioCtx.resume();
          synthGain.gain.setTargetAtTime(0.12, audioCtx.currentTime, 0.5);
        }
        if (streamGain && audioCtx) {
          streamGain.gain.setTargetAtTime(0.08, audioCtx.currentTime, 0.6);
        }
        if (windAudio) {
          windAudio.play().catch(() => {});
        }
        playStageSound('citadel');
        window.dispatchEvent(new CustomEvent('webgl_set_audio_volume', { detail: 1 }));
      } else {
        audioLabel.textContent = 'AUDIO: MUTED';
        if (synthGain && audioCtx) {
          synthGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.3);
        }
        if (streamGain && audioCtx) {
          streamGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.3);
        }
        if (windAudio) {
          windAudio.pause();
        }
        window.dispatchEvent(new CustomEvent('webgl_set_audio_volume', { detail: 0 }));
      }
    });
  }

  // 9. Telemetry & Coordinates Tracking
  const coordsElem = document.getElementById('telemetryCoords');
  const fpsElem = document.getElementById('fpsCounter');

  let currentScroll = 0;
  window.addEventListener('wheel', (e) => {
    currentScroll = Math.max(0, currentScroll + e.deltaY * 0.005);
    if (coordsElem && citadel) {
      const pos = citadel.camera.position;
      coordsElem.textContent = `X: ${pos.x.toFixed(2)} | Y: ${pos.y.toFixed(2)} | Z: ${pos.z.toFixed(2)}`;
    }
  }, { passive: true });

  // FPS ticker
  let lastTime = performance.now();
  let frameCount = 0;
  function updateFPS() {
    frameCount++;
    const now = performance.now();
    if (now - lastTime >= 1000) {
      if (fpsElem) fpsElem.textContent = frameCount;
      frameCount = 0;
      lastTime = now;
    }
    requestAnimationFrame(updateFPS);
  }
  requestAnimationFrame(updateFPS);

  // 10. Copy Email Button
  const copyCard = document.getElementById('copyEmailCard');
  const btnCopy = document.getElementById('btnCopyEmail');
  const statusText = document.getElementById('copyStatusText');

  function copyEmailAction(e) {
    e.stopPropagation();
    const email = 'shekhar.dev938@gmail.com';
    navigator.clipboard.writeText(email).then(() => {
      if (statusText) statusText.textContent = '✓ COPIED TO CLIPBOARD!';
      if (btnCopy) btnCopy.textContent = 'COPIED!';
      setTimeout(() => {
        if (statusText) statusText.textContent = 'Click to copy email address';
        if (btnCopy) btnCopy.textContent = 'COPY';
      }, 2500);
    }).catch(() => {
      prompt('Copy email address:', email);
    });
  }

  if (copyCard) copyCard.addEventListener('click', copyEmailAction);
  if (btnCopy) btnCopy.addEventListener('click', copyEmailAction);

  // 11. Celestial Day / Night Atmosphere Toggle (Jordan Breton Inspiration)
  const dayNightSwitch = document.getElementById('dayNightSwitch');
  if (dayNightSwitch && citadel) {
    dayNightSwitch.addEventListener('click', () => {
      const isNight = citadel.toggleDayNight();
      dayNightSwitch.classList.toggle('active', isNight);
      playUiChirp(isNight ? 520 : 880, isNight ? 260 : 1320, 0.15);
    });
  }

  // 12. Guided Auto-Tour Mode (Jordan Breton Inspiration)
  const btnTourToggle = document.getElementById('btnTourToggle');
  const tourLabel = document.getElementById('tourLabel');
  if (btnTourToggle && citadel) {
    btnTourToggle.addEventListener('click', () => {
      const isTour = citadel.toggleAutoTour();
      btnTourToggle.classList.toggle('active', isTour);
      if (tourLabel) tourLabel.textContent = isTour ? 'STOP TOUR' : 'AUTO TOUR';
      playUiChirp(isTour ? 750 : 1100, isTour ? 1100 : 750, 0.12);
    });
  }

  window.addEventListener('citadel_tour_state', (e) => {
    const isTour = e.detail.active;
    if (btnTourToggle) btnTourToggle.classList.toggle('active', isTour);
    if (tourLabel) tourLabel.textContent = isTour ? 'STOP TOUR' : 'AUTO TOUR';
  });

  // 12.1 Contemplative Spirit Mode (Jordan Breton inspiration)
  const btnSpiritToggle = document.getElementById('btnSpiritToggle');
  const spiritLabel = document.getElementById('spiritLabel');
  if (btnSpiritToggle && citadel) {
    btnSpiritToggle.addEventListener('click', () => {
      const isSpirit = citadel.toggleSpiritMode();
      btnSpiritToggle.classList.toggle('active', isSpirit);
      if (spiritLabel) spiritLabel.textContent = isSpirit ? 'REALM ACTIVE' : 'SPIRIT REALM';
      playUiChirp(isSpirit ? 920 : 640, isSpirit ? 1440 : 420, 0.18);
    });
  }

  window.addEventListener('citadel_spirit_state', (e) => {
    const isSpirit = e.detail.active;
    if (btnSpiritToggle) btnSpiritToggle.classList.toggle('active', isSpirit);
    if (spiritLabel) spiritLabel.textContent = isSpirit ? 'REALM ACTIVE' : 'SPIRIT REALM';
  });

  // 12.2 Keyboard Shortcuts: M (Spirit), N (Night), T (Tour), E (Explode)
  window.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;
    const key = e.key.toUpperCase();
    if (key === 'M') {
      if (citadel) {
        const isSpirit = citadel.toggleSpiritMode();
        if (btnSpiritToggle) btnSpiritToggle.classList.toggle('active', isSpirit);
        if (spiritLabel) spiritLabel.textContent = isSpirit ? 'REALM ACTIVE' : 'SPIRIT REALM';
        playUiChirp(isSpirit ? 920 : 640, isSpirit ? 1440 : 420, 0.18);
      }
    } else if (key === 'N') {
      if (citadel) {
        const isNight = citadel.toggleDayNight();
        if (dayNightSwitch) dayNightSwitch.classList.toggle('active', isNight);
        playUiChirp(isNight ? 520 : 880, isNight ? 260 : 1320, 0.15);
      }
    } else if (key === 'T') {
      if (citadel) {
        const isTour = citadel.toggleAutoTour();
        if (btnTourToggle) btnTourToggle.classList.toggle('active', isTour);
        if (tourLabel) tourLabel.textContent = isTour ? 'STOP TOUR' : 'AUTO TOUR';
        playUiChirp(isTour ? 750 : 1100, isTour ? 1100 : 750, 0.12);
      }
    } else if (key === 'E') {
      if (btnExplode) btnExplode.click();
    }
  });

  // 13. Crystalline Discovery Tracker (Jordan Breton Inspiration)
  const crystalCount = document.getElementById('crystalCount');
  const crystalProgress = document.getElementById('crystalProgress');
  window.addEventListener('citadel_discovery_update', (e) => {
    const { count, total, allFound } = e.detail;
    if (crystalCount) crystalCount.textContent = count;
    if (allFound && crystalProgress) {
      crystalProgress.classList.add('all-found');
      crystalProgress.innerHTML = '<span class="crystal-icon">✨</span><span class="crystal-text">ALL MONUMENTS DISCOVERED!</span>';
      playStageSound('guardrail');
    }
  });

  // 14. Onboarding Hint Dismissal
  const lookAroundHint = document.getElementById('lookAroundHint');
  let hintDismissed = false;
  function dismissHint() {
    if (hintDismissed || !lookAroundHint) return;
    hintDismissed = true;
    lookAroundHint.classList.add('hidden');
    setTimeout(() => {
      if (lookAroundHint) lookAroundHint.style.display = 'none';
    }, 900);
  }
  window.addEventListener('pointerdown', dismissHint, { once: true });
  window.addEventListener('keydown', dismissHint, { once: true });
  setTimeout(dismissHint, 6000); // Auto fade after 6s

  // 15. First-Person Game Mode & Character Telemetry Bridge
  const gameHudOverlay = document.getElementById('gameHudOverlay');
  const btnPovToggle = document.getElementById('btnPovToggle');
  const povLabel = document.getElementById('povLabel');
  const staminaFill = document.getElementById('staminaFill');
  const speedIndicator = document.getElementById('speedIndicator');
  const compassReadout = document.getElementById('compassReadout');
  const coordDisplay = document.getElementById('telemetryCoords');

  if (btnPovToggle && citadel) {
    btnPovToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      playUiChirp(900, 1400, 0.05);
      citadel.togglePovMode();
    });
  }

  window.addEventListener('citadel_game_mode', (e) => {
    const { active, pov } = e.detail;
    if (gameHudOverlay) {
      if (active) gameHudOverlay.classList.add('active');
      else gameHudOverlay.classList.remove('active');
    }
    if (povLabel) {
      povLabel.textContent = pov === 'first_person' ? 'POV: 1ST PERSON' : 'POV: 3RD PERSON';
    }
    const btnGame = document.getElementById('btnGameMode');
    if (btnGame) {
      if (active) btnGame.classList.add('active');
      else btnGame.classList.remove('active');
    }
  });

  window.addEventListener('citadel_pov_change', (e) => {
    const { pov } = e.detail;
    if (povLabel) {
      povLabel.textContent = pov === 'first_person' ? 'POV: 1ST PERSON' : 'POV: 3RD PERSON';
    }
    playUiChirp(1000, 1500, 0.06);
  });

  const cardinalDirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  window.addEventListener('citadel_player_telemetry', (e) => {
    const { x, y, z, speed, isRunning, stamina, pov, yawDeg } = e.detail;
    if (staminaFill) {
      staminaFill.style.width = `${Math.round(stamina)}%`;
      staminaFill.style.background = stamina < 20 ? '#ef4444' : 'linear-gradient(90deg, #0ea5e9, #38bdf8)';
    }

    if (speedIndicator) {
      const modeText = speed < 0.2 ? '[IDLE]' : (isRunning ? '[SPRINTING]' : '[WALKING]');
      speedIndicator.textContent = `${speed.toFixed(1)} M/S ${modeText}`;
    }

    if (compassReadout) {
      const dirIdx = Math.round(yawDeg / 45) % 8;
      const dirStr = cardinalDirs[dirIdx];
      const padDeg = yawDeg.toString().padStart(3, '0');
      compassReadout.textContent = `${padDeg}° ${dirStr} // HIMALAYAS`;
    }

    if (coordDisplay) {
      coordDisplay.textContent = `X: ${x.toFixed(2)} | Y: ${y.toFixed(2)} | Z: ${z.toFixed(2)}`;
    }
  });

  // Synthesized Footstep Sound on Snow
  window.addEventListener('citadel_footstep', (e) => {
    if (!isAudioActive || !audioCtx) return;
    try {
      const isRunning = e.detail && e.detail.isRunning;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isRunning ? 900 : 750, audioCtx.currentTime);
      filter.Q.setValueAtTime(1.8, audioCtx.currentTime);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isRunning ? 180 : 130, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.07);

      gain.gain.setValueAtTime(isRunning ? 0.07 : 0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch (err) {}
  });

  // Jump Audio
  window.addEventListener('citadel_player_jump', () => {
    playUiChirp(400, 800, 0.12);
  });

  // 16. Proximity Monument Inspection Interaction
  const gameProximityPrompt = document.getElementById('gameProximityPrompt');
  const proximityText = document.getElementById('proximityText');
  const btnProximityInspect = document.getElementById('btnProximityInspect');
  let currentNearbyMonumentId = null;

  window.addEventListener('citadel_proximity_prompt', (e) => {
    const { active, id, name } = e.detail;
    if (active) {
      currentNearbyMonumentId = id;
      if (proximityText) proximityText.textContent = `[E] EXAMINE: ${name}`;
      if (gameProximityPrompt) gameProximityPrompt.style.display = 'block';
    } else {
      currentNearbyMonumentId = null;
      if (gameProximityPrompt) gameProximityPrompt.style.display = 'none';
    }
  });

  function inspectCurrentMonument(monumentId) {
    if (!monumentId) return;
    playStageSound(monumentId);
    playUiChirp(1200, 1800, 0.1);
    openModal(dialogs.projects);
  }

  if (btnProximityInspect) {
    btnProximityInspect.addEventListener('click', (e) => {
      e.stopPropagation();
      inspectCurrentMonument(currentNearbyMonumentId);
    });
  }

  window.addEventListener('citadel_inspect_monument', (e) => {
    inspectCurrentMonument(e.detail.id);
  });
});

