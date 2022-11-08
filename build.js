import(`./${process.argv[2]}`).then(module => {
  const customProps = module.colors.map(c => `--${c.name}:${c.hex};`).join("")
  const css = `:where(html){${customProps}}`

  console.log(css)
})
