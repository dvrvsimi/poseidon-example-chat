use anchor_lang::prelude::*;

declare_id!("CqDSGGxfagLcVq8KYQjz4iRnPRxVkVSpVp2bnj19nHVj");

#[program]
pub mod chat {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
