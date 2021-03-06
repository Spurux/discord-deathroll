import Game, { IGame } from '../models/game.model';

interface ICreateGame {
    nextPlayer: IGame['nextPlayer'];
    bet: IGame['bet'];
}

interface ISetCurrentPlayer {
    gameId: string;
    user: IGame['currentPlayer'];
}

interface IFinishRoll {
    gameId: string;
    roll: IGame['previousRoll'];
}

async function Create({ nextPlayer, bet }: ICreateGame): Promise<IGame> {
    return await Game.create({
        nextPlayer,
        bet,
        previousRoll: bet * 10,
        updated: new Date().getTime(),
    });
}

async function SetCurrentPlayer({ gameId, user }: ISetCurrentPlayer): Promise<IGame> {
    const result =  await Game.findOneAndUpdate({ _id: gameId },
        {
            currentPlayer: user.id,
            updated: new Date().getTime(),
        }, { new: true })
        .populate('currentPlayer')
        .populate('nextPlayer')
        .exec();
    return result;
}

async function FinishRoll({ gameId, roll }: IFinishRoll) {
    const game: IGame = await Game.findOne({ _id: gameId });

    const newCurrent = game.nextPlayer;
    const newNext = game.currentPlayer;

    return await Game.findOneAndUpdate(
        { _id: gameId },
        {
            currentPlayer: newCurrent,
            nextPlayer: newNext,
            previousRoll: roll,
            updated: new Date().getTime(),
        },
        { new: true});
}

export default {
    Create,
    SetCurrentPlayer,
    FinishRoll,
};
