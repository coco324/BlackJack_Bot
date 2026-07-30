import { game } from '../engine/game'
import { bot } from '../bot/bot'
import fs from 'node:fs'


export function runSimulation(nbParties: number) {
    fs.writeFileSync('output/output.jsonl', '') // vide le fichier

    function logLine(data: object) {
        fs.appendFileSync('output/output.jsonl', JSON.stringify(data) + '\n')
    }

    const g = new game()
    const monBot = new bot(g)

    const NB_PARTIES = 10

    for (let i = 0; i < NB_PARTIES; i++) {
        g.resetRound()
        let step = 0

        while (g.getPlayerStatus() === 'start') {
            const handIndex = g.getCurrentHandIndex()
            const result = monBot.play()
            logLine({ roundId: i, step, handIndex, ...result })
            step++
        }

        const nbHands = g.getPlayersMain().length
        for (let handIndex = 0; handIndex < nbHands; handIndex++) {
            logLine({
                roundId: i,
                step: 'final',
                handIndex,
                result: g.getPlayerStatusByIndex(handIndex),
                finalPlayerScore: g.getPlayerScoreByIndex(handIndex),
                finalDealerScore: g.getDealerScore(),
                finalDealerCards: g.getDealerMain().map(c => c.getNom())
            })
        }
    }

    console.log(`${NB_PARTIES} parties jouées, résultats dans output/output.jsonl`)
}