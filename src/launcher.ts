import readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { runSimulation } from './simulation/simulate'
import { runAnalysis } from './analysis/analyze'

async function main() {
    const rl = readline.createInterface({ input: stdin, output: stdout })

    const reponse = await rl.question('Combien de parties voulez-vous simuler ? ')
    rl.close()

    const nbParties = parseInt(reponse, 10)

    if (isNaN(nbParties) || nbParties <= 0) {
        console.log('Nombre invalide.')
        process.exit(1)
    }

    console.log('Lancement de la simulation...')
    runSimulation(nbParties)

    console.log('Analyse des résultats...')
    runAnalysis()

    console.log('Terminé ! Fichier stats.xlsx généré dans output/.')
}

main()