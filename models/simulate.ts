import { game } from './game'
import { bot } from './bot'

console.log('Démarrage de la simulation...')


const g = new game()
const monBot = new bot(g)

g.startGame()

console.log('Main du joueur:', g.getPlayerMain().map(c => c.getNom()))
console.log('Main du dealer:', g.getDealerScore())
console.log('Score joueur:', g.getPlayerScore())

while (g.getPlayerStatus() === 'start') {
    monBot.play()
}

console.log('Main final du joueur:', g.getPlayerMain().map(c => c.getNom()), 'Score final:', g.getPlayerScore())
console.log('Main final du dealer:', g.getDealerMain().map(c => c.getNom()), 'Score final:',g.getDealerScoreAllCard())
console.log('Statut final du joueur:', g.getPlayerStatus())