# Building a Message Board Program with Poseidon

## Overview
In this tutorial, we'll build a message board program where users can post, edit, and delete messages. Each message will have a title, content, author, and timestamp. This tutorial is designed for developers who want to learn Solana development using TypeScript through Poseidon.

## Prerequisites
Make sure you have completed the environment setup from the Poseidon main tutorial. You'll need:
- Rust and Cargo
- Solana CLI
- Yarn
- Anchor CLI
- Poseidon binary

## Program Structure
Our message board program will have the following instructions:
1. `initialize` - Create a new message board
2. `postMessage` - Post a new message
3. `editMessage` - Edit an existing message (only by the author)
4. `deleteMessage` - Delete a message (only by the author)

## Implementation Steps

### 1. Create Project Scaffold
```bash
mkdir message-board
cd message-board
poseidon init message-board
```

### 2. Define Program Structure
Create a new file `ts-programs/messageBoardProgram.ts`:

```typescript
import { 
  Account, 
  Pubkey, 
  type Result, 
  i64, 
  u8, 
  Signer, 
  string 
} from "@solanaturbine/poseidon";

export default class MessageBoardProgram {
  static PROGRAM_ID = new Pubkey("11111111111111111111111111111111");

  initialize(): Result {}
  postMessage(): Result {}
  editMessage(): Result {}
  deleteMessage(): Result {}
}

// Message account structure
export interface Message extends Account {
  author: Pubkey;     // Message author's public key
  title: string;      // Message title
  content: string;    // Message content
  timestamp: i64;     // Posted timestamp
  bump: u8;          // PDA bump
}

// Board state account structure
export interface BoardState extends Account {
  authority: Pubkey;  // Board admin
  messageCount: i64;  // Total number of messages
  bump: u8;          // PDA bump
}
```

### 3. Implement Instructions

#### Initialize Board
```typescript
initialize(
  authority: Signer,
  boardState: BoardState
): Result {
  // Initialize board state PDA
  boardState.derive(["board"])
           .init(authority);
  
  // Set initial values
  boardState.authority = authority.key;
  boardState.messageCount = new i64(0);
  boardState.bump = boardState.getBump();
}
```

#### Post Message
```typescript
postMessage(
  author: Signer,
  message: Message,
  boardState: BoardState,
  title: string,
  content: string
): Result {
  // Derive board state PDA
  boardState.derive(["board"]);
  
  // Create unique message PDA using message count as seed
  message.derive([
    "message",
    boardState.messageCount.toBytes(),
    author.key
  ]).init(author);
  
  // Set message data
  message.author = author.key;
  message.title = title;
  message.content = content;
  message.timestamp = new i64(Date.now());
  message.bump = message.getBump();
  
  // Increment message count
  boardState.messageCount = boardState.messageCount.add(1);
}
```

#### Edit Message
```typescript
editMessage(
  author: Signer,
  message: Message,
  boardState: BoardState,
  newTitle: string,
  newContent: string
): Result {
  // Verify author
  if (!message.author.equals(author.key)) {
    throw new Error("Only the author can edit this message");
  }
  
  // Update message content
  message.title = newTitle;
  message.content = newContent;
}
```

#### Delete Message
```typescript
deleteMessage(
  author: Signer,
  message: Message,
  boardState: BoardState
): Result {
  // Verify author
  if (!message.author.equals(author.key)) {
    throw new Error("Only the author can delete this message");
  }
  
  // Close the message account and return rent to author
  message.close(author);
}
```

### 4. Testing
Create tests in `tests/messageBoard.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MessageBoardProgram } from "../target/types/message_board_program";
import { assert } from "chai";

describe("message board program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.MessageBoardProgram as Program<MessageBoardProgram>;

  it("Initialize board", async () => {
    // Test initialization
  });

  it("Post message", async () => {
    // Test posting message
  });

  it("Edit message", async () => {
    // Test editing message
  });

  it("Delete message", async () => {
    // Test deleting message
  });
});
```

### 5. Build and Deploy
```bash
# Build the program
poseidon build

# Test locally
poseidon test

# Deploy to devnet (optional)
anchor deploy --provider.cluster devnet
```

After a successful build, you should see an output similar to the one below
![Successful build](public/poseidon-build.png)

## Key Concepts Covered

1. **Program Derived Addresses (PDAs)**
   - Board state PDA for storing global state
   - Message PDAs for individual messages
   - Using message count as a unique seed

2. **Account Management**
   - Creating and closing accounts
   - Account authorization checks
   - Rent handling

3. **State Management**
   - Storing and updating message content
   - Managing message count
   - Handling timestamps

4. **Access Control**
   - Author verification for edits and deletes
   - Board authority management

## Next Steps

After completing this tutorial, you can extend the program with additional features:
- Add message categories or tags
- Implement message reactions/likes
- Add board moderators
- Create message threading/replies
- Add pagination for message retrieval

## Reference
- [Poseidon Documentation](https://github.com/Turbin3/poseidon)
- [Solana Account Model](https://solana.com/docs/core/accounts)
- [Program Derived Addresses](https://solana.com/docs/core/pda)



