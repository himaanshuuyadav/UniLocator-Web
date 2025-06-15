particlesJS("particles-js", {
  particles: {
    number: {
      value: 20,
      density: {
        enable: true,
        value_area: 800
      }
    },
    color: {
      value: "#ffffff" // white dots
    },
    shape: {
      type: "circle"
    },
    opacity: {
      value: 0.7,
      random: true
    },
    size: {
      value: 2.5,
      random: true
    },
    line_linked: {
      enable: false // ✨ turn off the lines
    },
    move: {
      enable: true,
      speed: 0.3,
      direction: "none",
      random: false,
      straight: false,
      out_mode: "out",
      bounce: false
    }
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: {
        enable: false
      },
      onclick: {
        enable: false
      },
      resize: true
    }
  },
  retina_detect: true
});
