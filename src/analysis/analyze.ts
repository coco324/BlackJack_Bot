import fs from 'node:fs'
import readline from 'node:readline'
import * as XLSX from 'xlsx'

export async function runAnalysis() {
    const stats: Record<string, { played: number, wins: number, losses: number, pushes: number }> = {}

    let totalHands = 0
    let totalWins = 0
    let totalLosses = 0
    let totalPushes = 0

    const MISE_BASE = 10
    let bankroll = 0
    let nbBlackjacks = 0
    let nbDoubles = 0

    // Buffer des décisions du round en cours, groupées par handIndex
    let currentRoundId: number | null = null
    let currentDecisions: Record<number, any[]> = {}

    const rl = readline.createInterface({
        input: fs.createReadStream('output/output.jsonl'),
        crlfDelay: Infinity
    })

    for await (const line of rl) {
        if (!line.trim()) continue
        const data = JSON.parse(line)

        // Nouveau round : on repart avec un buffer vide
        if (data.roundId !== currentRoundId) {
            currentRoundId = data.roundId
            currentDecisions = {}
        }

        if (data.step !== 'final') {
            // Ligne de décision : on la stocke temporairement
            if (!currentDecisions[data.handIndex]) currentDecisions[data.handIndex] = []
            currentDecisions[data.handIndex].push(data)
            continue
        }

        // Ligne "final" : on traite immédiatement cette main avec ses décisions en buffer
        const decisionsForHand = currentDecisions[data.handIndex] || []
        const hasNoDecision = decisionsForHand.length === 0
        const isDoubled = decisionsForHand.some(d => d.action === 'D')

        // Stats globales
        totalHands++
        if (data.result === 'win') totalWins++
        else if (data.result === 'loose') totalLosses++
        else totalPushes++

        // Stats par situation
        for (const d of decisionsForHand) {
            const key = `${d.handType}_${d.playerScore}_vs_${d.dealerUpCard}_${d.action}`
            if (!stats[key]) stats[key] = { played: 0, wins: 0, losses: 0, pushes: 0 }
            stats[key].played++
            if (data.result === 'win') stats[key].wins++
            else if (data.result === 'loose') stats[key].losses++
            else stats[key].pushes++
        }

        // Bankroll
        const isNaturalBlackjack = hasNoDecision && data.finalPlayerScore === 21 && data.result === 'win'
        if (isNaturalBlackjack) {
            nbBlackjacks++
            bankroll += MISE_BASE * 1.5
        } else {
            const mise = isDoubled ? MISE_BASE * 2 : MISE_BASE
            if (isDoubled) nbDoubles++
            if (data.result === 'win') bankroll += mise
            else if (data.result === 'loose') bankroll -= mise
        }
    }

    const globalWinrate = (totalWins / totalHands * 100).toFixed(2)

    console.log(`\n=== Winrate global ===`)
    console.log(`Mains jouées: ${totalHands}`)
    console.log(`Winrate: ${globalWinrate}%`)
    console.log(`${totalWins}W / ${totalLosses}L / ${totalPushes}P`)

    console.log(`\n=== Simulation bankroll (mise ${MISE_BASE}€/main) ===`)
    console.log(`Doubles joués: ${nbDoubles}`)
    console.log(`Blackjacks naturels (payés 3:2): ${nbBlackjacks}`)
    console.log(`Résultat final: ${bankroll >= 0 ? '+' : ''}${bankroll.toFixed(2)}€`)

    const sorted = Object.entries(stats).sort((a, b) => b[1].played - a[1].played)
    const tableData = sorted.map(([key, s]) => ({
        situation: key,
        joué: s.played,
        'win%': (s.wins / s.played * 100).toFixed(1),
        wins: s.wins,
        losses: s.losses,
        pushes: s.pushes
    }))

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

    XLSX.writeFile(workbook, 'output/stats.xlsx')
    console.log('\nFichier stats.xlsx généré')
}
