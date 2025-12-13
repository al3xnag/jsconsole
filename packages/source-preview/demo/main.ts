import { createSourcePreview } from '../src'
import './style.css'

const link = document.createElement('a')
link.href = createSourcePreview({
  title: 'VM123',
  source: `console.log("hello world! < > | $ % &");
const a = [123];
function foo() {
  console.log('foo');
}
`,
  location: [2, 1, 2, 6],
}).url
link.target = '_blank'
link.textContent = 'LINK'

const root = document.getElementById('app')!
root.appendChild(link)
