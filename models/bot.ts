
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
        const playerCards = this.GetGame().getPlayerMain().map(c => c.getNom());
        const playercardsValues = this.GetGame().getPlayerMain().map(c => c.getValue());
        let handType: 'hard' | 'soft' | 'pairs' = 'hard';
        if(playerCards.includes("A") ){
            handType = "soft";
        }
        if(playercardsValues[0] === playercardsValues[1]){
            handType = "pairs";
        }




        if (playerScore < 17) {
            this.GetGame().playerHit()
        }
        else {
            this.GetGame().playerStand()
        }
    }

    public GetGame(): game {
        return this.game
    }
}