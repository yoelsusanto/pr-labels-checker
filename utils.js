export function parseInputTags (inputText) {
  const splitByNewLine = inputText.split('\n')
  const splitByComma = [];

  splitByNewLine.forEach(eachLine => {
    splitByComma.push(...eachLine.split('\n'))
  })

  const trimmed =  splitByComma.map(tag => tag.trim())

  return trimmed
}