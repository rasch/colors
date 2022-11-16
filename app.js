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

// swatchColor :: Color -> String
// NOTE: a threshold of 112 gives fairly reasonable results to minimize
// the number of swatches that don't meet WCAG color contrast standards.
const swatchColor = color => `
  background-color:${color.hex};
  color:${brightness(hex2rgb(color.hex)) > 112 ? "#000" : "#fff"};
`.trim()

// display :: ([Color], String) -> String
const display = (colors, sort) =>
  parse(colors)
  .sort(orderBy(sort))
  .map(color => `
    <li
      class="card"
      data-hex="${color.hex}"
      style="${swatchColor(color)}"
      tabindex="0"
    >
      <p data-hex="${color.hex}" class="name">${color.name}</p>
      <p data-hex="${color.hex}" class="hex">${color.hex}</p>
    </li>`.trim())
  .join("")

// colorDialog :: ([Color], Color) -> IO
const colorDialog = (colors, color) => {
  const dialog = document.body.querySelector("dialog")

  if (typeof dialog.showModal !== "function")
    return

  dialog.innerHTML = `
    <h1 style="${swatchColor(color)}">${color.name}</h1>
    <p class="hex-color">${color.hex}</p>
    <div
      aria-label="close"
      class="close-button"
      style="${swatchColor(color)}"
      tabindex="0"
      title="close"
    ></div>
    ${color.aliases
      ? `<h2>Aliases</h2>
         <ul class="aliases">
           ${color.aliases.map(a => `<li>${a}</li>`).join("")}
         </ul>`
      : ""}
    ${color.groups
      ? `<h2>Groups</h2>
         ${color.groups.map(g => `
         <h3>${g}</h3>
         <ul class="group">
           ${colors
             .filter(c => c.groups?.find(h => h === g))
             .map(s => `
               <li
                 class="swatch"
                 data-hex="${s.hex}"
                 style="background-color:${s.hex}"
                 tabindex="0"
                 title="${s.name}"
               ></li>`)
             .join("")}
         </ul>`).join("")}`
      : ""}`

  document.body.style.overflow = "hidden"

  dialog.addEventListener("close", () => {
    document.body.style.overflow = "auto"
  })

  document.querySelector(".close-button").addEventListener("click", () => {
    dialog.close()
  })

  dialog.showModal()
}

// options :: { palette: String, sort: String }
const options = (queryString =>
  queryString.slice(1).split("&").reduce((opts, opt) => ({
    ...opts,
    [opt.split("=")[0]]: decodeURIComponent(opt.split("=")[1]),
  }), { palette: "crayola-crayons", sort: "brightness" })
)(window.location.search)

import(`./palettes/${options.palette}.js`)
  .then(module => {
    const app = document.getElementById("app")

    app.innerHTML = display(module.colors, options.sort)

    document.addEventListener("click", e => {
      const hex = e.target.getAttribute("data-hex")

      if (hex) {
        const color = module.colors.find(c => c.hex === hex)

        colorDialog(module.colors, color)
        document.activeElement.blur()
      }
    })
  })

const palettes = [
  "crayola-crayons",
  "the-new-defaults",
  "chartpak-ad-markers",
  "prismacolor-markers",
  "prismacolor-pastels",
  "prismacolor-pencils",
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

document.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    document.activeElement.click()
  } else if (keybindings[e.key]) {
    window.location.search = (/^p$/i).test(e.key)
      ? `?sort=${options.sort}&palette=${palettes[keybindings[e.key]()]}`
      : `?sort=${keybindings[e.key]}&palette=${options.palette}`
  }
})
