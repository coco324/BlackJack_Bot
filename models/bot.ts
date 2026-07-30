import { game } from './game'
import { card } from './card'
import data from './strategy.json'

type Action = 'H' | 'S' | 'D' | 'P'
type HandType = 'hard' | 'soft' | 'pairs'

export class bot {
    private game: game

    constructor(gameInstance: game) {
        this.game = gameInstance
    }

    // Transforme le nom d'une carte ('K', 'Q', 'J', '10', 'A', '2'...'9')
    // en clé utilisable dans strategy.json ('10' ou 'A' ou '2'...'9')
    private getCardKey(cardName: string): string {
        if (cardName === 'A') return 'A'
        if (['V', 'D', 'R'].includes(cardName)) return '10'
        return cardName
    }

    // Détermine si la main est "soft" (contient un As qui compte encore comme 11)
    private isSoft(cards: card[]): boolean {
        const hasAce = cards.some(c => c.getNom() === 'A')
        if (!hasAce) return false
        const total = cards.reduce((sum, c) => sum + (c.getNom() === 'A' ? 1 : c.getValue()), 0)
        return total + 10 <= 21
    }

    // Détermine si les 2 cartes de départ forment une paire
    private isPair(cards: card[]): boolean {
        if (cards.length !== 2) return false
        return cards[0].getValue() === cards[1].getValue()
    }

    // regarde si le score du joueur et bien dans la range de la handtype sinon prend le min ou le max (pour eviter les ligne inutile dans le json)
    private clamp(score: number, min: number, max: number): number {
    if (score < min) {
        return min
    }
    if (score > max) {
        return max
    }
    return score
}

    public play(): { playerScore: number, playerCards: string[], dealerUpCard: string, handType: HandType, action: Action } {
        const playerScore = this.GetGame().getPlayerScore()
        const playerCards = this.GetGame().getPlayerMain()

        const dealerMain = this.GetGame().getDealerMain()
        const dealerUpCard = dealerMain.find(c => c.getIsFaceUp())
        if (!dealerUpCard) {
            throw new Error('Aucune carte du dealer visible')
        }
        const dealerKey = this.getCardKey(dealerUpCard.getNom())

        let handType: HandType = 'hard'
        if (this.isSoft(playerCards)) {
            handType = 'soft'
        }
        if (this.isPair(playerCards)) {
            handType = 'pairs'
        }

        let action: Action

        if (handType === 'pairs') {
            const pairKey = this.getCardKey(playerCards[0].getNom())
            action = (data as any)[handType][pairKey][dealerKey]
        }
        else if (handType === 'soft') {
            const clampedScore = this.clamp(playerScore, 13, 20)
            action = (data as any)[handType][clampedScore.toString()][dealerKey]
        }
        else {
            const clampedScore = this.clamp(playerScore, 8, 17)
            action = (data as any)[handType][clampedScore.toString()][dealerKey]
        }
        const result = { playerScore, playerCards: playerCards.map(c => c.getNom()), dealerUpCard: dealerUpCard.getNom(), handType, action }

        if (action === 'H') {
            this.GetGame().playerHit()
        }
        else if (action === 'D') {
            this.GetGame().playerDouble()
        }
        else if (action === 'S') {
            this.GetGame().playerStand()
        }
        else {
            this.GetGame().playerSplit()
        }

        return result

    }

    public GetGame(): game {
        return this.game
    }
}