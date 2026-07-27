import { game } from './game'
import { bot } from './bot'

console.log('Démarrage de la simulation...')

// On crée une seule partie pour commencer, histoire de vérifier que tout marche
const g = new game()
const monBot = new bot(g)

g.startGame()

console.log('Main du joueur:', g.getPlayerMain().map(c => c.getNom()))
console.log('Main du dealer:', g.getDealerMain().map(c => c.getNom()))
console.log('Score joueur:', g.getPlayerScore())

while (g.getPlayerStatus() === 'start') {
    monBot.play()
}

console.log('Main final du joueur:', g.getPlayerMain().map(c => c.getNom()), 'Score final:', g.getPlayerScore())
console.log('Main final du dealer:', g.getDealerMain().map(c => c.getNom()), 'Score final:', g.getDealerScore())
console.log('Statut final du joueur:', g.getPlayerStatus())