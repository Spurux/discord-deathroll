import { ICommand } from '../interfaces/command.interface';
import { Message } from 'discord.js';
import UserController from '../controllers/user.controller';
import ChannelController from '../controllers/channel.controller';
import GameController from '../controllers/game.controller';

export class Roll implements ICommand {
    public name = 'roll';
    public description = 'Throw your dice. E.g. !roll';

    public async execute(message: Message, args: any) {
        const channel = await ChannelController.FindOrCreate({ channelId: message.channel.id });
        if (channel.currentGame == null) {
            message.channel.send(`No game is currently in progress in this channel. Start one by doing !bet [amount].`);
            return;
        }

        const foundUser = await UserController.FindOrCreate({
            userId: message.author.id,
            userTag: message.author.toString(),
            userName: message.author.username,
        });
        if (channel.currentGame.currentPlayer == null) {
            if (channel.currentGame.nextPlayer.userId === foundUser.userId) {
                message.channel.send(`You can't roll against yourself.`);
                return;
            }

            if (foundUser.gold < channel.currentGame.bet) {
                message.channel.send(`${message.author.toString()}, you don't have enough gold to accept a bet of ${channel.currentGame.bet}. Do !bank to check how much gold you have.`);
                return;
            }

            const newCurrentGame = await GameController.SetCurrentPlayer({
                gameId: channel.currentGame.id,
                user: foundUser,
            });

            channel.currentGame = newCurrentGame;

            channel.currentGame.currentPlayer = await UserController.SetGold({
                userId: channel.currentGame.currentPlayer.userId,
                gold: channel.currentGame.currentPlayer.gold - channel.currentGame.bet,
            });

            channel.currentGame.nextPlayer = await UserController.SetGold({
                userId: channel.currentGame.nextPlayer.userId,
                gold: channel.currentGame.nextPlayer.gold - channel.currentGame.bet,
            });

            message.channel.send(`${channel.currentGame.nextPlayer.userTag}, your bet has been accepted!`);
        } else {
            if (!(channel.currentGame.nextPlayer.userId === message.author.id ||
                channel.currentGame.currentPlayer.userId === message.author.id)) {
                message.channel.send(`You're not part of the current game in this channel.`);
                return;
            }

            if (message.author.id !== channel.currentGame.currentPlayer.userId) {
                message.channel.send(`It's not your turn. Please wait for ${channel.currentGame.currentPlayer.userTag} to do their roll.`);
                return;
            }
        }

        const roll = Math.floor((Math.random() * channel.currentGame.previousRoll) + 1);
        message.channel.send(`${message.author.toString()} rolled a ${roll}.`);

        if (roll === 1) {
            UserController.GivePrice({
                winnerId: channel.currentGame.nextPlayer.userId,
                looserId: channel.currentGame.currentPlayer.userId,
                gold: channel.currentGame.bet * 2,
            });

            await ChannelController.UnsetGame({ channelId: channel.channelId });

            message.channel.send(`${channel.currentGame.nextPlayer.userTag} has won ${channel.currentGame.bet * 2} gold!`);
            return;
        }

        GameController.FinishRoll({ gameId: channel.currentGame.id, roll });
    }
}
