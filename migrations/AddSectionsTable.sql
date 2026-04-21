-- Migration: Add Sections Table and SchoolId to Classes
-- Date: 2026-04-18

-- 1. Add SchoolId to Classes table if not exists
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Classes' AND COLUMN_NAME = 'SchoolId')
BEGIN
    ALTER TABLE Classes ADD SchoolId INT NULL;
    -- Populate SchoolId from Campuses table
    UPDATE Classes SET SchoolId = (SELECT SchoolId FROM Campuses WHERE CampusId = Classes.CampusId);
    ALTER TABLE Classes ALTER COLUMN SchoolId INT NOT NULL;
    ALTER TABLE Classes ADD FOREIGN KEY (SchoolId) REFERENCES Schools(SchoolId);
    CREATE INDEX IX_Classes_SchoolId ON Classes(SchoolId);
END

-- 2. Create Sections table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Sections')
BEGIN
    CREATE TABLE Sections (
        SectionId INT PRIMARY KEY IDENTITY(1,1),
        ClassId INT NOT NULL,
        CampusId INT NOT NULL,
        SchoolId INT NOT NULL,
        SectionName NVARCHAR(100) NOT NULL,
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (ClassId) REFERENCES Classes(ClassId),
        FOREIGN KEY (CampusId) REFERENCES Campuses(CampusId),
        FOREIGN KEY (SchoolId) REFERENCES Schools(SchoolId),
        CONSTRAINT UQ_Section_Class_Name UNIQUE (ClassId, SectionName),
        INDEX IX_Sections_CampusId (CampusId),
        INDEX IX_Sections_SchoolId (SchoolId)
    );
END

-- 3. Add SectionId to Students table (optional, for associating students with sections)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Students' AND COLUMN_NAME = 'SectionId')
BEGIN
    ALTER TABLE Students ADD SectionId INT NULL;
    ALTER TABLE Students ADD FOREIGN KEY (SectionId) REFERENCES Sections(SectionId);
END
