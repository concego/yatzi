/* Processado em 60 ms */
// Configuração de sons com Web Audio API
let audioContext;
let isMuted = false;

// Função para inicializar o AudioContext após o início do jogo
function initSounds() {
  try {
    // Criar AudioContext (só após interação do usuário para respeitar políticas de autoplay)
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    console.log('AudioContext inicializado:', audioContext.state);
    
    // Retomar AudioContext se suspenso
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        console.log('AudioContext retomado:', audioContext.state);
      }).catch(err => {
        console.error('Erro ao retomar AudioContext:', err);
      });
    }

    // Criar botão de mute/unmute
    const muteBtn = document.createElement('button');
    muteBtn.id = 'mute-btn';
    muteBtn.setAttribute('aria-label', 'Ativar/desativar som');
    muteBtn.textContent = '🔊';
    muteBtn.style.display = 'inline-block';
    muteBtn.tabIndex = 0;
    document.querySelector('.controls').appendChild(muteBtn);

    muteBtn.addEventListener('click', () => {
      isMuted = !isMuted;
      muteBtn.textContent = isMuted ? '🔇' : '🔊';
      muteBtn.setAttribute('aria-label', isMuted ? 'Ativar som' : 'Desativar som');
      console.log('Som:', isMuted ? 'Mudo' : 'Ativado');
    });

    muteBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        muteBtn.click();
      }
    });
  } catch (error) {
    console.error('Erro ao inicializar AudioContext:', error);
  }
}

// Função para tocar som sintetizado
function playSound(type) {
  if (isMuted || !audioContext) {
    console.warn('Som não tocado: Mudo ou AudioContext não inicializado');
    return;
  }
  try {
    // Retomar AudioContext se suspenso
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        console.log('AudioContext retomado para tocar som:', type);
        playSoundInternal(type);
      }).catch(err => {
        console.error('Erro ao retomar AudioContext para tocar som:', err);
      });
    } else {
      playSoundInternal(type);
    }
  } catch (error) {
    console.error('Erro ao tocar som:', error);
  }
}

// Função interna para tocar o som
function playSoundInternal(type) {
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configurações de som por tipo
    switch (type) {
      case 'roll':
        oscillator.type = 'sine'; // Tom suave para rolagem
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime); // Tom grave
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        break;
      case 'select':
        oscillator.type = 'square'; // Tom nítido para clique
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime); // Tom médio
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        break;
      case 'confirm':
        oscillator.type = 'triangle'; // Tom suave para confirmação
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Tom agudo
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        break;
      default:
        console.warn('Tipo de som desconhecido:', type);
        return;
    }

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.4); // Duração curta
    console.log('Som tocado:', type);
  } catch (error) {
    console.error('Erro ao criar som:', error);
  }
}

// Exportar função para ser chamada pelo script.js após clicar em "Iniciar Jogo"
window.initSounds = initSounds;