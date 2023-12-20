import './style.css'
import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.ts'

document.getElementById('mainlogo')?.setAttribute('src', viteLogo);
document.getElementById('vanillalogo')?.setAttribute('src', typescriptLogo);

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
