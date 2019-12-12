import User, { IUser } from '../model/user.model';

interface IFindOrCreate {
    userId: IUser['userId'];
    userTag: IUser['userTag'];
}

interface ISetGold {
    userId: IUser['userId'];
    gold: IUser['gold'];
}

async function FindOrCreate({ userId, userTag }: IFindOrCreate): Promise<IUser> {
    let user: IUser = await User.findOne({ userId }).exec();

    if (user === null) {
        user = await User.create({ userId, userTag });
    }

    return user;
}

async function SetGold({ userId, gold }: ISetGold): Promise<IUser> {
    return await User.findOneAndUpdate({ userId }, { gold }, { new: true });
}

export default {
    FindOrCreate,
    SetGold,
};