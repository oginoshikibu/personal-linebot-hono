export const getUserName = async (userId: string): Promise<"Alice" | "Bob"> => {
  const ALICE_USER_ID = process.env.ALICE_USER_ID || "alice_line_id";
  const BOB_USER_ID = process.env.BOB_USER_ID || "bob_line_id";

  if (userId === ALICE_USER_ID) {
    return "Alice";
  }
  if (userId === BOB_USER_ID) {
    return "Bob";
  }

  throw new Error(`Unknown user ID: ${userId}`);
};

export const getOtherUserName = (
  currentUser: "Alice" | "Bob",
): "Alice" | "Bob" => {
  return currentUser === "Alice" ? "Bob" : "Alice";
};
