use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("VauLT1111111111111111111111111111111111111");

/// On-chain transaction vault for batched Solana operations.
///
/// This program demonstrates PDA management, CPI transfers, account validation,
/// custom errors, and event emission using the Anchor framework. Users can
/// create named vaults, deposit SOL, execute batched transfers to multiple
/// recipients in a single instruction, and close vaults to reclaim rent.
#[program]
pub mod tx_vault {
    use super::*;

    /// Initializes a new PDA-owned vault for the caller.
    ///
    /// The vault is derived from the owner's public key and a human-readable name,
    /// allowing a single user to manage multiple independent vaults. The name must
    /// not exceed 32 bytes to keep account size predictable.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The instruction context containing the accounts to initialize.
    /// * `name` - A human-readable label for the vault (max 32 characters).
    ///
    /// # Errors
    ///
    /// Returns [`VaultError::NameTooLong`] if `name` exceeds 32 bytes.
    pub fn initialize_vault(ctx: Context<InitializeVault>, name: String) -> Result<()> {
        require!(name.len() <= 32, VaultError::NameTooLong);

        let vault = &mut ctx.accounts.vault;
        vault.owner = ctx.accounts.owner.key();
        vault.name = name.clone();
        vault.total_deposited = 0;
        vault.total_withdrawn = 0;
        vault.tx_count = 0;
        vault.bump = ctx.bumps.vault;
        vault.created_at = Clock::get()?.unix_timestamp;

        emit!(VaultInitialized {
            vault: vault.key(),
            owner: vault.owner,
            name,
        });

        Ok(())
    }

    /// Deposits SOL from the depositor into the vault PDA.
    ///
    /// Transfers native SOL via a CPI to the System Program. Any signer can
    /// deposit into any vault — ownership is only required for withdrawals.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The instruction context containing the vault and depositor accounts.
    /// * `amount` - The number of lamports to transfer into the vault.
    ///
    /// # Errors
    ///
    /// Returns [`VaultError::ZeroAmount`] if `amount` is zero.
    /// Returns [`VaultError::Overflow`] if the running total would overflow.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::ZeroAmount);

        // CPI: transfer SOL from depositor to vault PDA via System Program.
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.depositor.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, amount)?;

        let vault = &mut ctx.accounts.vault;
        vault.total_deposited = vault
            .total_deposited
            .checked_add(amount)
            .ok_or(VaultError::Overflow)?;
        vault.tx_count = vault
            .tx_count
            .checked_add(1)
            .ok_or(VaultError::Overflow)?;

        emit!(DepositMade {
            vault: vault.key(),
            depositor: ctx.accounts.depositor.key(),
            amount,
            total_deposited: vault.total_deposited,
        });

        Ok(())
    }

    /// Executes a batched transfer of SOL from the vault to multiple recipients.
    ///
    /// Only the vault owner may invoke this instruction. The vault PDA signs each
    /// outbound transfer using its derived seeds, so no private key is required.
    /// The instruction enforces a maximum of 10 recipients per batch to stay within
    /// compute-unit limits.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The instruction context containing the vault, owner, and system program.
    /// * `recipients` - Public keys of the accounts to receive SOL.
    /// * `amounts` - Lamport amounts corresponding to each recipient.
    ///
    /// # Errors
    ///
    /// Returns [`VaultError::LengthMismatch`] if `recipients` and `amounts` differ in length.
    /// Returns [`VaultError::EmptyBatch`] if both vectors are empty.
    /// Returns [`VaultError::BatchTooLarge`] if there are more than 10 recipients.
    /// Returns [`VaultError::Overflow`] if the total amount overflows.
    /// Returns [`VaultError::InsufficientFunds`] if the vault lacks enough lamports
    ///   (after reserving rent-exempt minimum).
    pub fn execute_batch(
        ctx: Context<ExecuteBatch>,
        recipients: Vec<Pubkey>,
        amounts: Vec<u64>,
    ) -> Result<()> {
        require!(recipients.len() == amounts.len(), VaultError::LengthMismatch);
        require!(!recipients.is_empty(), VaultError::EmptyBatch);
        require!(recipients.len() <= 10, VaultError::BatchTooLarge);

        // Compute the total outbound amount with overflow protection.
        let total_amount: u64 = amounts
            .iter()
            .try_fold(0u64, |acc, &amt| acc.checked_add(amt))
            .ok_or(VaultError::Overflow)?;

        // Ensure the vault retains enough lamports for rent exemption.
        let vault_info = ctx.accounts.vault.to_account_info();
        let rent = Rent::get()?;
        let rent_exempt_min = rent.minimum_balance(vault_info.data_len());
        let available = vault_info
            .lamports()
            .checked_sub(rent_exempt_min)
            .ok_or(VaultError::InsufficientFunds)?;
        require!(available >= total_amount, VaultError::InsufficientFunds);

        // Build the PDA signer seeds for the vault.
        let vault = &ctx.accounts.vault;
        let owner_key = vault.owner;
        let name_bytes = vault.name.as_bytes();
        let bump = &[vault.bump];
        let signer_seeds: &[&[u8]] = &[b"vault", owner_key.as_ref(), name_bytes, bump];

        // Transfer SOL to each recipient via CPI, signed by the vault PDA.
        let recipient_count = recipients.len() as u8;
        for (i, recipient) in recipients.iter().enumerate() {
            let amount = amounts[i];
            if amount == 0 {
                continue;
            }

            // Locate the matching remaining account for this recipient.
            let recipient_info = ctx
                .remaining_accounts
                .iter()
                .find(|a| a.key == recipient)
                .ok_or(ErrorCode::AccountNotEnoughKeys)?;

            require!(recipient_info.is_writable, VaultError::RecipientNotWritable);

            let cpi_context = CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: recipient_info.clone(),
                },
                &[signer_seeds],
            );
            system_program::transfer(cpi_context, amount)?;
        }

        // Update vault accounting.
        let vault = &mut ctx.accounts.vault;
        vault.total_withdrawn = vault
            .total_withdrawn
            .checked_add(total_amount)
            .ok_or(VaultError::Overflow)?;
        vault.tx_count = vault
            .tx_count
            .checked_add(1)
            .ok_or(VaultError::Overflow)?;

        emit!(BatchExecuted {
            vault: vault.key(),
            owner: owner_key,
            recipient_count,
            total_amount,
        });

        Ok(())
    }

    /// Closes the vault and returns all remaining lamports to the owner.
    ///
    /// This instruction uses Anchor's `close` constraint, which zeroes the
    /// account data, transfers lamports, and assigns ownership back to the
    /// System Program — making the account eligible for garbage collection.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The instruction context containing the vault and owner accounts.
    pub fn close_vault(ctx: Context<CloseVault>) -> Result<()> {
        emit!(VaultClosed {
            vault: ctx.accounts.vault.key(),
            owner: ctx.accounts.owner.key(),
        });

        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Account structures
// ---------------------------------------------------------------------------

/// Persistent state for a single vault PDA.
///
/// Each vault is uniquely derived from its owner and name, and tracks
/// cumulative deposit / withdrawal totals along with a transaction counter.
#[account]
pub struct Vault {
    /// The authority allowed to execute withdrawals and close the vault.
    pub owner: Pubkey,
    /// Human-readable label for this vault (max 32 chars).
    pub name: String,
    /// Cumulative lamports deposited into the vault.
    pub total_deposited: u64,
    /// Cumulative lamports withdrawn from the vault.
    pub total_withdrawn: u64,
    /// Number of deposit and batch-execute transactions processed.
    pub tx_count: u64,
    /// The PDA bump seed, stored for efficient re-derivation.
    pub bump: u8,
    /// Unix timestamp when the vault was created.
    pub created_at: i64,
}

impl Vault {
    /// Account space calculation including the 8-byte Anchor discriminator.
    ///
    /// Layout:
    /// - discriminator:     8
    /// - owner (Pubkey):   32
    /// - name (String):     4 (length prefix) + 32 (max chars)
    /// - total_deposited:   8
    /// - total_withdrawn:   8
    /// - tx_count:          8
    /// - bump:              1
    /// - created_at:        8
    /// -------------------------
    /// Total:             109
    pub const SPACE: usize = 8  // discriminator
        + 32                    // owner
        + 4 + 32               // name (borsh string: 4-byte len + max content)
        + 8                     // total_deposited
        + 8                     // total_withdrawn
        + 8                     // tx_count
        + 1                     // bump
        + 8;                    // created_at
}

// ---------------------------------------------------------------------------
// Instruction contexts
// ---------------------------------------------------------------------------

/// Accounts required by [`tx_vault::initialize_vault`].
#[derive(Accounts)]
#[instruction(name: String)]
pub struct InitializeVault<'info> {
    /// The vault PDA to be created. Seeds encode the owner and vault name so
    /// that each (owner, name) pair maps to exactly one vault.
    #[account(
        init,
        payer = owner,
        space = Vault::SPACE,
        seeds = [b"vault", owner.key().as_ref(), name.as_bytes()],
        bump,
    )]
    pub vault: Account<'info, Vault>,

    /// The wallet funding the account creation and becoming the vault owner.
    #[account(mut)]
    pub owner: Signer<'info>,

    /// The Solana System Program, required for account creation.
    pub system_program: Program<'info, System>,
}

/// Accounts required by [`tx_vault::deposit`].
#[derive(Accounts)]
pub struct Deposit<'info> {
    /// The target vault. Seeds and bump are re-verified to ensure the correct
    /// PDA is referenced, preventing substitution attacks.
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), vault.name.as_bytes()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    /// The account transferring SOL into the vault. Does not need to be the
    /// vault owner — anyone may deposit.
    #[account(mut)]
    pub depositor: Signer<'info>,

    /// The Solana System Program, required for the SOL transfer CPI.
    pub system_program: Program<'info, System>,
}

/// Accounts required by [`tx_vault::execute_batch`].
///
/// Recipient accounts are passed via `ctx.remaining_accounts` so the
/// instruction can handle a dynamic number of recipients without fixed account
/// slots.
#[derive(Accounts)]
pub struct ExecuteBatch<'info> {
    /// The vault PDA from which SOL is disbursed. The `has_one` constraint
    /// ensures only the recorded owner may authorize withdrawals.
    #[account(
        mut,
        has_one = owner,
        seeds = [b"vault", vault.owner.as_ref(), vault.name.as_bytes()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    /// The vault owner authorizing the batch transfer.
    pub owner: Signer<'info>,

    /// The Solana System Program, required for each outbound transfer CPI.
    pub system_program: Program<'info, System>,
}

/// Accounts required by [`tx_vault::close_vault`].
#[derive(Accounts)]
pub struct CloseVault<'info> {
    /// The vault to close. Anchor's `close` constraint will zero the data,
    /// transfer remaining lamports to `owner`, and reassign the account to the
    /// System Program.
    #[account(
        mut,
        has_one = owner,
        seeds = [b"vault", vault.owner.as_ref(), vault.name.as_bytes()],
        bump = vault.bump,
        close = owner,
    )]
    pub vault: Account<'info, Vault>,

    /// The owner receiving the reclaimed lamports.
    #[account(mut)]
    pub owner: Signer<'info>,
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Emitted when a new vault PDA is initialized.
#[event]
pub struct VaultInitialized {
    /// The public key of the newly created vault PDA.
    pub vault: Pubkey,
    /// The wallet that owns the vault.
    pub owner: Pubkey,
    /// The human-readable name assigned to the vault.
    pub name: String,
}

/// Emitted when SOL is deposited into a vault.
#[event]
pub struct DepositMade {
    /// The vault that received the deposit.
    pub vault: Pubkey,
    /// The wallet that funded the deposit.
    pub depositor: Pubkey,
    /// The number of lamports deposited.
    pub amount: u64,
    /// The vault's cumulative deposit total after this transaction.
    pub total_deposited: u64,
}

/// Emitted when a batch transfer is executed from a vault.
#[event]
pub struct BatchExecuted {
    /// The vault from which SOL was disbursed.
    pub vault: Pubkey,
    /// The owner who authorized the batch.
    pub owner: Pubkey,
    /// The number of recipients in this batch.
    pub recipient_count: u8,
    /// The total lamports transferred across all recipients.
    pub total_amount: u64,
}

/// Emitted when a vault is closed and its lamports reclaimed.
#[event]
pub struct VaultClosed {
    /// The public key of the closed vault.
    pub vault: Pubkey,
    /// The owner who received the remaining lamports.
    pub owner: Pubkey,
}

// ---------------------------------------------------------------------------
// Custom errors
// ---------------------------------------------------------------------------

/// Domain-specific errors for the tx-vault program.
#[error_code]
pub enum VaultError {
    /// The vault name exceeds the 32-byte maximum.
    #[msg("Vault name must be 32 characters or fewer")]
    NameTooLong,

    /// A zero-lamport amount was provided where a positive value is required.
    #[msg("Amount must be greater than zero")]
    ZeroAmount,

    /// An arithmetic operation would overflow.
    #[msg("Arithmetic overflow")]
    Overflow,

    /// The `recipients` and `amounts` vectors have different lengths.
    #[msg("Recipients and amounts vectors must have the same length")]
    LengthMismatch,

    /// The batch is empty — at least one recipient is required.
    #[msg("Batch must contain at least one recipient")]
    EmptyBatch,

    /// The batch exceeds the maximum of 10 recipients.
    #[msg("Batch must not exceed 10 recipients")]
    BatchTooLarge,

    /// The vault does not hold enough lamports (above rent-exempt minimum) to
    /// cover the requested transfer.
    #[msg("Insufficient funds in vault after reserving rent-exempt minimum")]
    InsufficientFunds,

    /// A recipient account was not passed as writable.
    #[msg("Recipient account must be writable")]
    RecipientNotWritable,
}
