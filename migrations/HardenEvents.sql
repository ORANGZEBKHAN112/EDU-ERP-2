-- Migration: Harden Financial Events for Multi-Server Safety
ALTER TABLE FinancialEvents ADD LockedBy NVARCHAR(100) NULL;
ALTER TABLE FinancialEvents ADD LockedAt DATETIME NULL;
ALTER TABLE FinancialEvents ADD IsDeadLetter BIT DEFAULT 0;
ALTER TABLE FinancialEvents ADD SequenceNumber BIGINT IDENTITY(1,1);

CREATE INDEX IX_FinancialEvents_Sequence ON FinancialEvents(SequenceNumber);
CREATE INDEX IX_FinancialEvents_Lock ON FinancialEvents(LockedBy, LockedAt);
CREATE INDEX IX_FinancialEvents_DeadLetter ON FinancialEvents(IsDeadLetter);
