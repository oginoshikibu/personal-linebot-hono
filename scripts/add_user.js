const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function addUser() {
  try {
    // 引数からLINE IDを取得
    const lineId = process.argv[2];
    const name = process.argv[3] || "ユーザー"; // 名前が指定されていない場合はデフォルト値

    if (!lineId) {
      console.error("LINE IDを指定してください");
      process.exit(1);
    }

    // ユーザーの存在確認
    const existingUser = await prisma.user.findUnique({
      where: { lineId },
    });

    if (existingUser) {
      console.log("LINE ID: " + lineId + " は既に登録されています");
      console.log(existingUser);
      process.exit(0);
    }

    // ユーザーの作成
    const newUser = await prisma.user.create({
      data: {
        lineId,
        name,
      },
    });

    console.log("ユーザーを作成しました:");
    console.log(newUser);
  } catch (error) {
    console.error("エラーが発生しました:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addUser(); 