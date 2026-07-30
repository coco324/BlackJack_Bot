import fs from 'node:fs'
import * as XLSX from 'xlsx'

interface DecisionLine {
    roundId: number
    step: number
    handIndex: number
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
    finalPlayerScore: number
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

// ==========================================
// Winrate global (basé sur les mains, pas les décisions)
// ==========================================
const totalHands = finals.length
const totalWins = finals.filter(f => f.result === 'win').length
const totalLosses = finals.filter(f => f.result === 'loose').length
const totalPushes = finals.filter(f => f.result === 'push').length
const globalWinrate = (totalWins / totalHands * 100).toFixed(2)

console.log(`\n=== Winrate global ===`)
console.log(`Mains jouées: ${totalHands}`)
console.log(`Winrate: ${globalWinrate}%`)
console.log(`${totalWins}W / ${totalLosses}L / ${totalPushes}P`)

// ==========================================
// Simulation de bankroll (mise 10€/main, double x2, blackjack naturel 3:2)
// ==========================================
const MISE_BASE = 10

const doubledHands = new Set<string>()
for (const d of decisions) {
    if (d.action === 'D') {
        doubledHands.add(`${d.roundId}_${d.handIndex}`)
    }
}

const handsWithDecision = new Set<string>()
for (const d of decisions) {
    handsWithDecision.add(`${d.roundId}_${d.handIndex}`)
}

let bankroll = 0
let nbBlackjacks = 0
let nbDoubles = 0

for (const f of finals) {
    const handKey = `${f.roundId}_${f.handIndex}`
    const hasNoDecision = !handsWithDecision.has(handKey)
    const isDoubled = doubledHands.has(handKey)

    const isNaturalBlackjack = hasNoDecision && f.finalPlayerScore === 21 && f.result === 'win'

    if (isNaturalBlackjack) {
        nbBlackjacks++
        bankroll += MISE_BASE * 1.5
        continue
    }

    const mise = isDoubled ? MISE_BASE * 2 : MISE_BASE
    if (isDoubled) nbDoubles++

    if (f.result === 'win') bankroll += mise
    else if (f.result === 'loose') bankroll -= mise
}

console.log(`\n=== Simulation bankroll (mise ${MISE_BASE}€/main) ===`)
console.log(`Doubles joués: ${nbDoubles}`)
console.log(`Blackjacks naturels (payés 3:2): ${nbBlackjacks}`)
console.log(`Résultat final: ${bankroll >= 0 ? '+' : ''}${bankroll.toFixed(2)}€`)

// ==========================================
// Export Excel
// ==========================================
const resumeData = [
    { indicateur: 'Mains jouées', valeur: totalHands },
    { indicateur: 'Winrate global (%)', valeur: globalWinrate },
    { indicateur: 'Wins', valeur: totalWins },
    { indicateur: 'Losses', valeur: totalLosses },
    { indicateur: 'Pushes', valeur: totalPushes },
    { indicateur: 'Doubles joués', valeur: nbDoubles },
    { indicateur: 'Blackjacks naturels', valeur: nbBlackjacks },
    { indicateur: `Bankroll finale (mise ${MISE_BASE}€/main)`, valeur: bankroll.toFixed(2) + '€' }
]

const worksheet = XLSX.utils.json_to_sheet(tableData)
const workbook = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(workbook, worksheet, 'Stats')
XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(resumeData), 'Résumé')

XLSX.writeFile(workbook, 'stats.xlsx')
console.log('Fichier stats.xlsx généré')

// npx tsx models/analyze.ts