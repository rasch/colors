// hex2rgb :: String -> [Integer]
const hex2rgb = hex =>
  hex.match(/[a-f0-9]{2}/gi).map(n => parseInt(n, 16))

// rgb2hsv :: [Integer] -> Object
const rgb2hsv = rgb => {
  const [r, g, b] = rgb.map(n => n / 255)
  const min = Math.min(r, g, b)
  const value = Math.max(r, g, b)
  const saturation = (value - min) / value
  const d = r === min ? g - b : b === min ? r - g : b - r
  const h = r === min ? 3 : b === min ? 1 : 5
  const hue = min === value ? 0 : 60 * (h - d / (value - min))

  return { hue, saturation, value }
}

// brightness :: [Integer] -> Integer
// https://www.w3.org/TR/AERT/#color-contrast
const brightness = rgb =>
  (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000

// parse :: [Color] -> [Color]
const parse = colors =>
  colors.map(color => ({
    ...color,
    ...hex2rgb(color.hex),
    ...rgb2hsv(hex2rgb(color.hex)),
    brightness: brightness(hex2rgb(color.hex)),
  }))

// orderBy :: String -> (Object, Object) -> Integer
const orderBy = prop => (a, b) =>
  a[prop] < b[prop] ? -1 : a[prop] > b[prop] ? 1 : 0

// display :: ([Color], String) -> String
// NOTE: a threshold of 112 gives fairly reasonable results to minimize
// the number of swatches that don't meet WCAG color contrast standards.
const display = (colors, sort) =>
  parse(colors).sort(orderBy(sort)).map(color => `
    <div style="background-color:${color.hex}" class="color-card">
      <p style="color:${brightness(color) > 112 ? "#000" : "#fff"}">
        ${color.name}<br><span class="hex">${color.hex}</span>
      </p>
    </div>
  `).join("")

// options :: { palette: String, sort: String }
const options = (queryString =>
  queryString.slice(1).split("&").reduce((opts, opt) => ({
    ...opts,
    [opt.split("=")[0]]: decodeURIComponent(opt.split("=")[1]),
  }), { palette: "the-new-defaults", sort: "brightness" })
)(window.location.search)

import(`./palettes/${options.palette}.js`)
  .then(module => {
    const app = document.getElementById("app")
    app.innerHTML = display(module.colors, options.sort)
  })

const palettes = [
  "the-new-defaults",
  "chartpak-ad-markers",
  "prismacolor-markers",
  "prismacolor-pastels",
  "prismacolor-pencils",
  "crayola-crayons",
  "css-named-colors",
]

const keybindings = {
  h: "hue",
  s: "saturation",
  v: "value",
  r: "0",
  g: "1",
  b: "2",
  n: "name",
  x: "hex",
  o: "groups",
  l: "brightness",
  p: () => (palettes.indexOf(options.palette) + 1) % palettes.length,
  P: () => palettes.indexOf(options.palette) === 0
    ? palettes.length - 1
    : palettes.indexOf(options.palette) - 1,
}

document.addEventListener("keypress", e => {
  if (keybindings[e.key])
    window.location.search = (/^p$/i).test(e.key)
      ? `?sort=${options.sort}&palette=${palettes[keybindings[e.key]()]}`
      : `?sort=${keybindings[e.key]}&palette=${options.palette}`
})
