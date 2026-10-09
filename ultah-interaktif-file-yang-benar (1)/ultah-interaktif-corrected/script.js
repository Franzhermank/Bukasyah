(() => {
  "use strict";

  // OPSIONAL: Isi dengan path audio lokal, misalnya "assets/lagu-ulang-tahun.mp3".
  // Cara paling mudah: biarkan kosong, lalu tekan tombol "Pilih lagu" di website.
  const DEFAULT_MUSIC_SRC = "assets/lagu.mp3";

  const introScreen = document.getElementById("introScreen");
  const letterExperience = document.getElementById("letterExperience");
  const openLettersButton = document.getElementById("openLettersButton");
  const letterStage = document.getElementById("letterStage");
  const cards = Array.from(document.querySelectorAll(".letter-card"));
  const previousButton = document.getElementById("previousLetterButton");
  const nextButton = document.getElementById("nextLetterButton");
  const progressLabel = document.getElementById("progressLabel");
  const progressBar = document.getElementById("progressBar");
  const dotButtons = Array.from(document.querySelectorAll(".dot-button"));
  const songPicker = document.getElementById("songPicker");
  const audio = document.getElementById("birthdayAudio");
  const musicToggle = document.getElementById("musicToggle");
  const songStatus = document.getElementById("songStatus");
  const toast = document.getElementById("toast");

  let activeIndex = 0;
  let hasOpenedLetters = false;
  let pointerStartX = null;
  let pointerStartY = null;
  let toastTimer = null;
  let audioObjectUrl = null;

  if (DEFAULT_MUSIC_SRC.trim()) {
    audio.src = DEFAULT_MUSIC_SRC.trim();
    musicToggle.disabled = false;
    songStatus.textContent = "Lagu sudah disiapkan. Geser untuk membuka surat.";
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3000);
  }

  async function startMusic() {
    if (!audio.src) {
      songStatus.textContent = "Belum ada lagu yang dipilih. Kamu bisa memilihnya kapan saja.";
      return;
    }
    try {
      await audio.play();
      musicToggle.disabled = false;
      musicToggle.textContent = "Ⅱ";
      musicToggle.setAttribute("aria-label", "Jeda musik");
      if (!hasOpenedLetters) songStatus.textContent = "Musik menemani kejutan kecilmu. ♡";
    } catch (error) {
      // Browser dapat menolak audio jika file tidak valid atau pemutaran diblokir.
      showToast("Musiknya belum bisa diputar. Coba tekan tombol musik sekali lagi.");
      musicToggle.disabled = false;
    }
  }

  function updateMusicButton() {
    const isPlaying = !audio.paused && !audio.ended;
    musicToggle.textContent = isPlaying ? "Ⅱ" : "▶";
    musicToggle.setAttribute("aria-label", isPlaying ? "Jeda musik" : "Putar musik");
  }

  function openLetters() {
    if (hasOpenedLetters) return;
    hasOpenedLetters = true;
    // Mulai audio pada interaksi pengguna yang membuka surat.
    startMusic();
    introScreen.classList.add("is-leaving");
    introScreen.setAttribute("aria-hidden", "true");
    window.setTimeout(() => {
      introScreen.hidden = true;
      letterExperience.hidden = false;
      letterExperience.classList.add("enter-from-right");
      letterExperience.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => letterExperience.classList.remove("enter-from-right"));
      });
      renderCards();
      letterStage.focus({ preventScroll: true });
    }, 180);
  }

  function renderCards() {
    cards.forEach((card, index) => {
      card.classList.remove("is-active", "is-next", "is-further", "is-previous", "is-past");
      const offset = index - activeIndex;
      if (offset === 0) card.classList.add("is-active");
      else if (offset === 1) card.classList.add("is-next");
      else if (offset > 1) card.classList.add("is-further");
      else if (offset === -1) card.classList.add("is-previous");
      else card.classList.add("is-past");
      card.setAttribute("aria-hidden", offset === 0 ? "false" : "true");
      card.tabIndex = offset === 1 ? 0 : -1;
    });

    previousButton.disabled = activeIndex === 0;
    nextButton.disabled = false;
    nextButton.innerHTML = activeIndex === cards.length - 1
      ? 'Kembali ke kue <span aria-hidden="true">↺</span>'
      : 'Surat berikutnya <span aria-hidden="true">→</span>';
    progressLabel.textContent = `SURAT ${String(activeIndex + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
    progressBar.style.width = `${((activeIndex + 1) / cards.length) * 100}%`;
    dotButtons.forEach((dot, index) => {
      dot.classList.toggle("is-current", index === activeIndex);
      dot.setAttribute("aria-current", index === activeIndex ? "step" : "false");
    });
  }

  function goToLetter(index) {
    if (index < 0 || index >= cards.length || index === activeIndex) return;
    activeIndex = index;
    renderCards();
  }

  function nextLetter() {
    if (activeIndex < cards.length - 1) goToLetter(activeIndex + 1);
    else returnToCake();
  }

  function returnToCake() {
    letterExperience.classList.add("is-leaving");
    letterExperience.setAttribute("aria-hidden", "true");
    window.setTimeout(() => {
      letterExperience.hidden = true;
      letterExperience.classList.remove("is-leaving");
      introScreen.hidden = false;
      introScreen.classList.remove("is-leaving");
      introScreen.setAttribute("aria-hidden", "false");
      hasOpenedLetters = false;
      activeIndex = 0;
      renderCards();
    }, 160);
  }

  openLettersButton.addEventListener("click", openLetters);
  previousButton.addEventListener("click", () => goToLetter(activeIndex - 1));
  nextButton.addEventListener("click", nextLetter);
  dotButtons.forEach((dot) => dot.addEventListener("click", () => goToLetter(Number(dot.dataset.go))));

  // Swipe pada layar kue: geser ke kiri untuk membuka tumpukan surat.
  introScreen.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button, label, input, a")) return;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
  });
  introScreen.addEventListener("pointerup", (event) => {
    if (pointerStartX === null || pointerStartY === null) return;
    const dx = event.clientX - pointerStartX;
    const dy = event.clientY - pointerStartY;
    if (dx < -55 && Math.abs(dx) > Math.abs(dy) * 1.15) openLetters();
    pointerStartX = null;
    pointerStartY = null;
  });
  introScreen.addEventListener("pointercancel", () => { pointerStartX = pointerStartY = null; });

  // Swipe pada tumpukan surat; drag ke kiri membuka surat berikutnya, ke kanan kembali.
  letterStage.addEventListener("pointerdown", (event) => {
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
  });
  letterStage.addEventListener("pointerup", (event) => {
    if (pointerStartX === null || pointerStartY === null) return;
    const dx = event.clientX - pointerStartX;
    const dy = event.clientY - pointerStartY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.12) {
      if (dx < 0) nextLetter();
      else goToLetter(activeIndex - 1);
    }
    pointerStartX = null;
    pointerStartY = null;
  });
  letterStage.addEventListener("pointercancel", () => { pointerStartX = pointerStartY = null; });

  cards.forEach((card, index) => {
    card.addEventListener("click", () => {
      if (index > activeIndex) goToLetter(index);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (letterExperience.hidden) {
      if (event.key === "ArrowLeft" && !hasOpenedLetters) openLetters();
      return;
    }
    if (event.key === "ArrowRight") nextLetter();
    if (event.key === "ArrowLeft") goToLetter(activeIndex - 1);
  });

  songPicker.addEventListener("change", async () => {
    const file = songPicker.files && songPicker.files[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      showToast("Pilih file audio seperti MP3, M4A, atau WAV.");
      return;
    }
    if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl);
    audioObjectUrl = URL.createObjectURL(file);
    audio.src = audioObjectUrl;
    musicToggle.disabled = false;
    songStatus.textContent = `Lagu terpilih: ${file.name}. Geser untuk memulai.`;
    showToast(`Lagu dipilih: ${file.name}`);
    if (hasOpenedLetters) await startMusic();
  });

  musicToggle.addEventListener("click", async () => {
    if (!audio.src) {
      songPicker.click();
      return;
    }
    if (audio.paused) await startMusic();
    else audio.pause();
    updateMusicButton();
  });
  audio.addEventListener("play", updateMusicButton);
  audio.addEventListener("pause", updateMusicButton);
  audio.addEventListener("ended", updateMusicButton);

  // Kartu berikutnya yang terlihat sebagian bisa diketuk untuk membukanya.
  renderCards();
})();
