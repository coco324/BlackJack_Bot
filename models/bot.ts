
import { game } from './game'

export class bot {
    private game: game

    constructor(gameInstance: game) {
        this.game = gameInstance
    }

    public test(): void {
        console.log('Le bot test...')
    }

    public play(): void {
        const playerScore = this.GetGame().getPlayerScore();

        if (playerScore < 17) {
            console.log('Le bot décide de tirer une carte.')
            this.GetGame().playerHit()
        }
        else {
            console.log('Le bot décide de rester.')
            this.GetGame().playerStand()
        }
    }

    public GetGame(): game {
        return this.game
    }
}