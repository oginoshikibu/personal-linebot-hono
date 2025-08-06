import { getUserByLineId, type UserName } from "../constants/users";

export const getUserName = async (userId: string): Promise<UserName> => {
  const user = getUserByLineId(userId);
  return user.name;
};

export const getOtherUserName = (currentUser: UserName): UserName => {
  return currentUser === "Alice" ? "Bob" : "Alice";
};
