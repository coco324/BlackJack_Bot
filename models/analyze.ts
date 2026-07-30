// src/analyze.ts
import fs from 'node:fs'

interface DecisionLine {
    roundId: number
    step: number
    playerScore: number
    dealerUpCard: string
    handType: 'hard' | 'soft' | 'pairs'
    action: string
}

interface FinalLine {
    roundId: number
    step: 'final'
    handIndex: number
    result: 'win' | 'loose' | 'push'
}

const lines = fs.readFileSync('output.jsonl', 'utf-8').trim().split('\n')
const allData = lines.map(l => JSON.parse(l))

// Sépare décisions et résultats finaux
const decisions = allData.filter(d => d.step !== 'final') as DecisionLine[]
const finals = allData.filter(d => d.step === 'final') as FinalLine[]

// Associe chaque roundId à son résultat final 
const resultByRoundAndHand = new Map<string, string>()
for (const f of finals) {
    resultByRoundAndHand.set(`${f.roundId}_${f.handIndex}`, f.result)
}

// Regroupe par situation: handType + playerScore + dealerUpCard + action
const stats: Record<string, { played: number, wins: number, losses: number, pushes: number }> = {}

for (const d of decisions) {
    const key = `${d.handType}_${d.playerScore}_vs_${d.dealerUpCard}_${d.action}`
    const result = resultByRoundAndHand.get(`${d.roundId}_${d.handIndex}`)
    if (!result) continue

    if (!stats[key]) stats[key] = { played: 0, wins: 0, losses: 0, pushes: 0 }
    stats[key].played++
    if (result === 'win') stats[key].wins++
    else if (result === 'loose') stats[key].losses++
    else stats[key].pushes++
}

// Affiche trié par nombre de parties (les situations les plus fréquentes en premier)
const sorted = Object.entries(stats).sort((a, b) => b[1].played - a[1].played)

const tableData = sorted.map(([key, s]) => ({
    situation: key,
    joué: s.played,
    'win%': (s.wins / s.played * 100).toFixed(1),
    wins: s.wins,
    losses: s.losses,
    pushes: s.pushes
}))

console.table(tableData)