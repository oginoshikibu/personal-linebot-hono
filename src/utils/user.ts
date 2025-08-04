import { config } from "../config";

export const getUserName = async (userId: string): Promise<"Alice" | "Bob"> => {
  if (userId === config.line.users.alice) {
    return "Alice";
  }
  if (userId === config.line.users.bob) {
    return "Bob";
  }

  throw new Error(`Unknown user ID: ${userId}`);
};

export const getOtherUserName = (
  currentUser: "Alice" | "Bob",
): "Alice" | "Bob" => {
  return currentUser === "Alice" ? "Bob" : "Alice";
};
