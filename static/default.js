// Add sub-menu elements
let elements = [
  { text: 'Facade', href: '/docs/facade' },
  { text: 'Factory', href: '/docs/factory' },
  { text: 'Config', href: '/docs/config' },
  { text: 'Dependency Provider', href: '/docs/dependency-provider' },
]

let ul = document.createElement('ul')
ul.classList.add('dropdown')

for (const element of elements) {
  let li = document.createElement('li')
  let entry = document.createElement('a')
  entry.text = element.text
  entry.href = element.href
  li.appendChild(entry)
  ul.appendChild(li)
}

document.querySelector('.menu li:first-child').appendChild(ul)
