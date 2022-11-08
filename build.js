import(`./${process.argv[2]}`).then(module => {
  const customProps = module.colors.map(c => {
    const aliases = c.aliases
      ? c.aliases.map(a => `--${a}:${c.hex};`).join("")
      : ""

    return `--${c.name}:${c.hex};${aliases}`
  }).join("")

  const css = `:where(html){${customProps}}`

  console.log(css)
})
