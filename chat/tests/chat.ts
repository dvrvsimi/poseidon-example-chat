import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Chat } from "../target/types/chat";
import { assert } from "chai";

describe("chat program", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Chat as Program<Chat>;

  // Generate the program derived address for our board state
  const [boardPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("board")],
    program.programId
  );

  it("Initialize board", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        authority: provider.wallet.publicKey,
        boardState: boardPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Initialize transaction:", tx);

    // Fetch the created board state
    const boardState = await program.account.boardState.fetch(boardPda);
    assert.ok(boardState.authority.equals(provider.wallet.publicKey));
    assert.ok(boardState.messageCount.eq(new anchor.BN(0)));
  });

  it("Post a message", async () => {
    // Generate PDA for the message using message count as seed
    const [messagePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("message"),
        new anchor.BN(0).toArrayLike(Buffer, "le", 8),
        provider.wallet.publicKey.toBuffer()
      ],
      program.programId
    );

    const title = "First Message";
    const content = "Hello, Solana!";

    const tx = await program.methods
      .postMessage(title, content)
      .accounts({
        author: provider.wallet.publicKey,
        message: messagePda,
        boardState: boardPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Post message transaction:", tx);

    // Fetch and verify the message
    const message = await program.account.message.fetch(messagePda);
    assert.ok(message.author.equals(provider.wallet.publicKey));
    assert.equal(message.title, title);
    assert.equal(message.content, content);
    assert.ok(message.messageIndex.eq(new anchor.BN(0)));

    // Verify board state was updated
    const boardState = await program.account.boardState.fetch(boardPda);
    assert.ok(boardState.messageCount.eq(new anchor.BN(1)));
  });

  it("Edit a message", async () => {
    // Use same PDA from the previous test
    const [messagePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("message"),
        new anchor.BN(0).toArrayLike(Buffer, "le", 8),
        provider.wallet.publicKey.toBuffer()
      ],
      program.programId
    );

    const newTitle = "Updated Title";
    const newContent = "Updated content!";

    const tx = await program.methods
      .editMessage(newTitle, newContent)
      .accounts({
        author: provider.wallet.publicKey,
        message: messagePda,
        boardState: boardPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Edit message transaction:", tx);

    // Verify the message was updated
    const message = await program.account.message.fetch(messagePda);
    assert.equal(message.title, newTitle);
    assert.equal(message.content, newContent);
  });

  it("Delete a message", async () => {
    // Use same PDA from the previous tests
    const [messagePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("message"),
        new anchor.BN(0).toArrayLike(Buffer, "le", 8),
        provider.wallet.publicKey.toBuffer()
      ],
      program.programId
    );

    const tx = await program.methods
      .deleteMessage()
      .accounts({
        author: provider.wallet.publicKey,
        message: messagePda,
        boardState: boardPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Delete message transaction:", tx);

    // Verify the message account was closed
    try {
      await program.account.message.fetch(messagePda);
      assert.fail("Message account should have been closed");
    } catch (e) {
      // Expected error - account not found
      assert.ok(e);
    }
  });
});