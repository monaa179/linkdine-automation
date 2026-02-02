-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `linkedin_accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('personal', 'company') NOT NULL,
    `linkedinAccountId` VARCHAR(191) NOT NULL,
    `linkedinPageId` VARCHAR(191) NULL,
    `accessToken` TEXT NOT NULL,
    `refreshToken` TEXT NULL,
    `tokenExpiresAt` DATETIME(3) NOT NULL,
    `contextPrompt` TEXT NOT NULL,
    `postingFrequency` INTEGER NOT NULL DEFAULT 1,
    `postingPeriod` ENUM('week') NOT NULL DEFAULT 'week',
    `postingDay` ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL DEFAULT 'monday',
    `postingHour` VARCHAR(191) NOT NULL DEFAULT '09:00',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `linkedinAccountId` INTEGER NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `imageDescription` TEXT NULL,
    `aiCaption` TEXT NOT NULL,
    `editedCaption` TEXT NULL,
    `status` ENUM('draft', 'scheduled', 'published') NOT NULL DEFAULT 'draft',
    `scheduledAt` DATETIME(3) NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `linkedin_accounts` ADD CONSTRAINT `linkedin_accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_linkedinAccountId_fkey` FOREIGN KEY (`linkedinAccountId`) REFERENCES `linkedin_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
