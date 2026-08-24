// Classroom City visual asset configuration.
// Current Stable behavior uses Emoji for movable interaction objects.
// Later, replace `image: null` with transparent PNG/WebP paths and switch
// `renderMode` to "image" without changing Park/Market interaction state.

window.CityAssetConfig = {
  renderMode: "emoji",

  sceneImages: {
    building: "./assets/city/building_scene.png",
    park: "./assets/city/park_scene.png",
    market: "./assets/city/market_scene.png"
  },

  park: {
    tree:     { emoji: "🌳", image: null },
    flower:   { emoji: "🌷", image: null },
    bench:    { emoji: "🪑", image: null },
    fountain: { emoji: "⛲", image: null },
    sprout:   { emoji: "🌱", image: null },
    butterfly:{ emoji: "🦋", image: null }
  },

  market: {
    peach:   { emoji: "🍑", image: null },
    cabbage: { emoji: "🥬", image: null },
    egg:     { emoji: "🥚", image: null }
  }
};
