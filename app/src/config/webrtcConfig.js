// Config completa (STUN + TURN) — usada em Transfer e Chat, onde a travessia de NAT é mais crítica.
export const RTC_CONFIG_FULL = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' }
  ]
};

// Config reduzida (só STUN) — suficiente pro VideoPage hoje, mas fica fácil de trocar
// pra RTC_CONFIG_FULL se começar a falhar em redes com NAT simétrico/CGNAT.
export const RTC_CONFIG_BASIC = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};
